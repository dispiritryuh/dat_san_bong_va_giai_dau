import { Prisma } from "@prisma/client";
import prisma from "../../../prisma/prisma-client";
import { Challenge } from "@prisma/client";
import Httpexception from "../../model/http-exception.model";
import { NotificationEvent, sendNotificationToUser } from "../../real/notification.service";
import { redisClient } from "../../app";
// gui yeu cau
//tao challenge
//tu choi
//xoa
// chap nhan
import { createMessageService } from "../../real/message.service";
import { getSystemPrice } from "../admin/admin.service";
import { checkPitchempty } from "../bookingpicth/bookings.service";
import { BtransferA } from "../../share/transfer.share";
import { pickPitchInput } from "../../share/validate.share";
import { eventBus, Events } from "../../share/evenBus";
type challengerType=Prisma.ChallengeGetPayload<{include:{
    challenger:true,
}}>;
export const sendChallenge = async (
    challengerId: number, 
    opponentId: number, 
    initialMessage: string = "Hello,go goal" ,
): Promise<any> => { 
    
    const newChallenge = await prisma.challenge.create({
        data: {
            challengerId,
            opponentId,
        },
        include: {
            challenger: true,
        }
    });

    await createMessageService(
        newChallenge.id, 
        challengerId,    
        initialMessage 
    );

    const sendPayload = {
        ChallengeId: newChallenge.id,
        challengerId: challengerId, 
        Aname: newChallenge.challenger.name,
        status: "Go Goal",
    };
    sendNotificationToUser(opponentId, NotificationEvent.NEW_CHALLENGE, sendPayload);
    return newChallenge;
}
export const rejectChallenge= async(challengeId:number,challengerId:number,opponentId:number)=>{
const checkChallenge=await prisma.challenge.findUnique({
    where:{
        id:challengeId,
    },
})
if(!checkChallenge || checkChallenge.status!=="PENDING"){
    throw new Error('!exist or cancel');
}
const rejectedChallenge=await prisma.challenge.update(
    {
        where:{id:challengeId},
        data:{
            status:'REJECT',
        }
    }
)

sendNotificationToUser(checkChallenge.challengerId,NotificationEvent.CHALLENGE_REJECTED,{message:"opponent rejected"});
return rejectedChallenge;
}
export const cancelChallenge=async(challengeId:number,challengerId:number,opponentId:number)=>{
const checkChallenge=await prisma.challenge.findUnique({
    where:{
        id:challengeId,
    }
})
if(!checkChallenge || checkChallenge.status!=="PENDING"){
    throw new Error('!exist or cancel');
}
const canceledChallenge=await prisma.challenge.update(
    {
        where:{id:challengeId},
        data:{
            status:'DELETE',
        }
    }
)

sendNotificationToUser(canceledChallenge.challengerId,NotificationEvent.CHALLENGE_CANCELED,{message:"cancel challenge complete"});
sendNotificationToUser(canceledChallenge.opponentId,NotificationEvent.CHALLENGE_CANCELED,{message:"challenge canceled"});
return cancelChallenge;
}
export const acceptChallenge = async (challengeId: number, opponentTeamId: number) => {
    return await prisma.$transaction(async (tx) => {
        // 1. Dùng updateMany để chặn Race Condition (2 người bấm cùng lúc)
        // Chỉ những kèo đang OPEN mới được chuyển sang MATCHED
        const result = await tx.challenge.updateMany({
            where: { 
                id: challengeId, 
                status: 'OPEN' 
            },
            data: { 
                status: 'MATCHED', 
                opponentTeamId: opponentTeamId 
            }
        });
        if (result.count === 0) {
            throw new Httpexception(400, "hết slot");
        }
        const updatedChallenge = await tx.challenge.findUnique({ 
            where: { id: challengeId },
            include: { challenger: true } 
        });
        if (updatedChallenge) {
            const payload = {
                challengeId: updatedChallenge.id,
                message: "Đối thủ đã chấp nhận!"
            };
            sendNotificationToUser(updatedChallenge.challengerId, NotificationEvent.CHALLENGE_ACCEPTED, payload);
        }

        return updatedChallenge;
    });
};
// check dong thuan
// cho dong thuan,xu li doi keo
export const selectPitchp2p = async(challengeId: number, challengerId: number, opponentId: number, input: any) => {
    
    let finalOpponentId = opponentId;
    if (!finalOpponentId || finalOpponentId === 0) {
        console.log("Service: Đang tự động tìm ID đối thủ trong DB...");
        const challengeInfo = await prisma.challenge.findUnique({
            where: { id: Number(challengeId) }
        });
        
        if (!challengeInfo) throw new Httpexception(404, "Không tìm thấy kèo đấu này trong DB!");
        finalOpponentId = challengeInfo.challengerId === challengerId 
            ? challengeInfo.opponentId 
            : challengeInfo.challengerId;
            
        console.log("Service: Đã tóm được ID đối thủ là:", finalOpponentId);
    }
    const pId = input?.PitchId || input?.pitchId || input?.id;
    if (!pId) throw new Httpexception(400, "Backend không nhận được ID Sân!");

    const currentPrice = await getSystemPrice(pId);
    const halfPrice = currentPrice / 2;

    try {
        await BtransferA(challengerId, finalOpponentId, halfPrice);
    } catch(error) {
        eventBus.emit('NOT_ENOUGHT_MONEY', { opponentId: finalOpponentId });
        throw new Httpexception(402, "Tài khoản đối thủ không đủ tiền chốt sân!");
    }

    try {
        console.log("=== ĐANG CHUẨN BỊ GỌI checkPitchempty VỚI INPUT ===", input);
        const Bookingend = await checkPitchempty(challengerId, input);
        eventBus.emit('PAYMENT_SUCCESS_MATCH', { challengeId });
        return Bookingend;
    } catch(error) {
        console.log("error:booking,A->B");
        await BtransferA(finalOpponentId, challengerId, halfPrice);
        throw new Httpexception(400, "Sân đã được đặt hoặc lỗi Database!");
    }
}
export const DashBoard= async ()=>{
    const rankDashBoard= await prisma.team.findMany({
        orderBy:{
            elo:`desc`,
        },
        select:{
            id:true,
            name:true,
            description  :true,
  leaderID:true, 
  leader:true,
  status   :true,
  elo            :true,
        }
    })
    return rankDashBoard;
}
// lay doan chat
export const getChatHistory = async (challengeId: number) => {
    return await prisma.message.findMany({
        where: { challengeId: challengeId },
        orderBy: { createdAt: 'asc' } 
    });
}
//

