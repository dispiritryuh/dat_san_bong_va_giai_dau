import prisma from "../../../prisma/prisma-client";
import { Prisma } from "@prisma/client";
import { NotificationEvent, sendNotificationToUser } from "../../real/notification.service";
import Httpexception from "../../model/http-exception.model";
import { FifaRankingSystem } from "../../share/fifa.share";

export const createMatch = async (challengeId: number) => {
    try {
        // BƯỚC 1: Kiểm tra xem Match đã tồn tại chưa
        const existingMatch = await prisma.match.findFirst({
            where: { challengeId: challengeId }
        });

        if (existingMatch) {
            return existingMatch;
        }

        const findChallenge = await prisma.challenge.findUnique({
            where: { id: challengeId },
            include: {
                challenger: true,
                opponent: true,
            }
        });

        if (!findChallenge) {
            throw new Httpexception(404, { error: 'Challenge không tồn tại' });
        }

        const teamAId = findChallenge.challenger.id;
        const teamBId = findChallenge.opponent.id;

        const newMatch = await prisma.match.create({
            data: {
                teamAId: teamAId,
                teamBId: teamBId,
                challengeId: challengeId,
                scoreA: 0,
                scoreB: 0,
            }
        });
        return newMatch;
    } catch (error) {
        throw new Httpexception(400, { error: 'Lỗi tạo trận đấu' });
    }
}

export const submitMatchResult = async (matchId: number, goalsA: number, goalsB: number) => {
    try {
        const match = await prisma.match.findUnique({
            where: { id: matchId },
            include: { 
                teamA: true, 
                teamB: true,  
            }
        });
        
        if (!match) {
            throw new Httpexception(404, { error: 'Không tìm thấy trận đấu' });
        }
        
        if (match.status === "COMPLETED") {
            throw new Httpexception(400, { error: 'Trận đấu đã cập nhật tỉ số' });
        }
        
        let scoreA = 0.5; 
        if (goalsA > goalsB) scoreA = 1; 
        if (goalsA < goalsB) scoreA = 0; 
        
        const eloResult = FifaRankingSystem.calculate(
            parseFloat(match.teamA?.elo?.toString() || "0"),
            parseFloat(match.teamB?.elo?.toString() || "0"),
            scoreA,
            FifaRankingSystem.IMPORTANCE.FRIENDLY 
        );
        
        const [updatedMatch] = await prisma.$transaction([
            prisma.match.update({
                where: { id: matchId },
                data: { 
                    scoreA: goalsA, 
                    scoreB: goalsB, 
                    status: "COMPLETED" 
                }
            }),
            prisma.team.update({
                where: { id: match.teamA?.id },
                data: { elo: new Prisma.Decimal(eloResult.teamA.newElo.toString()) }
            }),
            prisma.team.update({
                where: { id: match.teamB?.id },
                data: { elo: new Prisma.Decimal(eloResult.teamB.newElo.toString()) }
            })
        ]);
        const rankTeamA = await prisma.team.count({
            where: { elo: { gt: eloResult.teamA.newElo } }
        }) + 1; 

        const rankTeamB = await prisma.team.count({
            where: { elo: { gt: eloResult.teamB.newElo } }
        }) + 1;

        const leaderAId = match.teamA?.leaderID;
        const leaderBId = match.teamB?.leaderID;

        const payloadTeamA = {
            matchId: match.id,
            oldElo: eloResult.teamA.oldElo,
            newElo: eloResult.teamA.newElo,
            pointsChange: eloResult.teamA.pointsChange,
            newRank: rankTeamA,
            message: `Elo ${eloResult.teamA.pointsChange > 0 ? 'tăng' : 'giảm'} ${Math.abs(eloResult.teamA.pointsChange)} điểm. Hạng mới: Top ${rankTeamA}`
        };
        sendNotificationToUser(leaderAId!, NotificationEvent.SCORE_NEW, payloadTeamA);

        const payloadTeamB = {
            matchId: match.id,
            oldElo: eloResult.teamB.oldElo,
            newElo: eloResult.teamB.newElo,
            pointsChange: eloResult.teamB.pointsChange,
            newRank: rankTeamB,
            message: `Elo ${eloResult.teamB.pointsChange > 0 ? 'tăng' : 'giảm'} ${Math.abs(eloResult.teamB.pointsChange)} điểm. Hạng mới: Top ${rankTeamB}`
        };
        sendNotificationToUser(leaderBId!, NotificationEvent.SCORE_NEW, payloadTeamB);

        return updatedMatch;
    } catch (error) {
        throw error;
    }
}