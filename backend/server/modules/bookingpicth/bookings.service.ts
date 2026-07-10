import { Prisma } from "@prisma/client";
import { acquireLock, releaseLock } from "../../share/createLock.share";
import Httpexception from "../../model/http-exception.model";
import { pickPitchInput } from "../../share/validate.share";
import prisma from "../../../prisma/prisma-client";
import { redisClient } from "../../app";
import { getSystemPrice } from "../admin/admin.service";
import { eventBus,Events } from "../../share/evenBus";

const billSelection = {
    userId: true,
    pitchId:true,
    startTime: true,
    endTime: true,
    totalPrice: true,
    status:true,
} satisfies Prisma.BookingSelect;

export type BillResponse = Prisma.BookingGetPayload<{ select: typeof billSelection }>;

export const checkPitchempty = async (UserId: number, input: pickPitchInput): Promise<BillResponse> => {
    const { PitchId, startTime, endTime } = input;
    const pendingLock = `keo:pitch:${PitchId}:startTime:${startTime}`;

    const isPending = await redisClient.get(pendingLock);
    if (isPending) {
        throw new Httpexception(409, { error: `pitch being process` });
    }

    const Pitched = await prisma.pitch.findUnique({
        where: { id: PitchId },
    });

    if (!Pitched || Pitched.status !== "ACTIVE") {
        throw new Httpexception(422, { error: { "pitch": ['placed or maintance'] } });
    }

    const timeString = new Date(startTime).getTime();
    const lockKey = `lock:payment:pitch:${PitchId}:time:${timeString}`;

    const lockValue = await acquireLock(lockKey, 30000);
    if (!lockValue) {
        throw new Httpexception(409, { error: 'pitch transacting, wait 5 minute' });
    }

    try {
        const bookingsuccess = await prisma.$transaction(async (tx) => {
            const isOverlap = await tx.booking.findFirst({
                where: {
                    pitchId: PitchId,
                    startTime,
                    endTime,
                    status: { not: 'PENDING' },
                }
            });

            if (isOverlap) {
                throw new Httpexception(409, { error: 'existed' });
            }

            const totalPrice = await getSystemPrice(PitchId);

            const payResult = await tx.users.updateMany({
                where: {
                    id: UserId,
                    balance: { gte: totalPrice }
                },
                data: {
                    balance: { decrement: totalPrice }
                }
            });

            if (payResult.count === 0) {
                throw new Httpexception(402, { error: "not enough money to pay" });
            }

            // 1. Tạo Booking
            const booking = await tx.booking.create({
                data: {
                    userId: UserId,
                    pitchId: PitchId,
                    startTime,
                    endTime,
                    totalPrice,
                    status: "resolved",
                },
                select: billSelection,
            });

            // 2. TỰ ĐỘNG ĐĂNG TIN TÌM ĐỐI (CHALLENGE)
            const userTeam = await tx.team.findFirst({ where: { leaderID: UserId } });
            if (userTeam) {
                await tx.challenge.create({
                    data: {
                        challengerId: userTeam.id,
                        status: 'OPEN',
                        pitchName: Pitched.name,
                        startTime: startTime,
                        endTime: endTime,
                    }
                });
            }

            return booking;
        });

        eventBus.emit(Events.BOOKING_SUCCESS, {
            userId: UserId,
            amount: bookingsuccess.totalPrice,
            pitchName: Pitched.name
        });

        return bookingsuccess;

    } finally {
        await releaseLock(lockKey, lockValue);
    }
}
//tim kiem ca
export interface SearchPitchInput {
    startTime: string | Date;
    endTime: string | Date;
}

export const findAvailablePitches = async (input: SearchPitchInput) => {
    const { startTime, endTime } = input;
    const allPitches = await prisma.pitch.findMany({
        where: { status: "ACTIVE" },
        select: {
            id: true,
            name: true,
        }
    });

    if (!allPitches || allPitches.length === 0) {
        return []; 
    }
    const overlappingBookings = await prisma.booking.findMany({
        where: {
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            status: { notIn: ['FAILED', 'CANCELLED'] } 
        },
        select: { pitchId: true }
    });
    const bookedPitchIds = overlappingBookings.map(booking => booking.pitchId);
    const availablePitches = await Promise.all(allPitches.map(async (pitch) => {
        const price = await getSystemPrice(pitch.id); 
        
        return {
            id: pitch.id,
            name: pitch.name,
            price: price,
            isAvailable: !bookedPitchIds.includes(pitch.id) 
        };
    }));

    return availablePitches;
};
// getuserprofile
export const getuserProfile = async (userId: number) => {
    const getProfile = await prisma.users.findUnique({
        where: { id: userId },
        select: {
            username: true,
            balance: true,
            organizedCups: true,
            manageTeam: {
                select: {
                    name: true,
                    elo: true
                }
            },
            bookings: {
                where: {
                    endTime: { gte: new Date() }
                },
                include: {
                    pitch: true,
                    match: {
                        include: {
                            teamA: true,
                            teamB: true
                        }
                    }
                }
            }
        }
    });
    return getProfile;
}
export const getOpenChallenges = async () => {
    return await prisma.challenge.findMany({
        where: { status: 'OPEN' },
        include: { challenger: true },
        orderBy: { createdAt: 'desc' }
    });
};