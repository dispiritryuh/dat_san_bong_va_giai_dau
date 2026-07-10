import prisma from "../../../prisma/prisma-client";
import { Prisma } from "@prisma/client";
import Httpexception from "../../model/http-exception.model";
import { FifaRankingSystem } from "../../share/fifa.share";
// xao cap doi
const shuffleTeams = (teams: number[]): number[] => {
    const arr = [...teams];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

// boc tham nhanh dau
export const generateKnockoutBracket = async (cupId: number, teamIds: number[]) => {
    const totalTeams = teamIds.length;
    const shuffledTeams = shuffleTeams(teamIds);
    const totalRounds = Math.log2(totalTeams);
    let nextMatchIds: (number | null)[] = [null]; 
    for (let step = 1; step <= totalRounds; step++) {
        const currentRoundMatchesCount = Math.pow(2, step - 1); 
        const isFirstRound = step === totalRounds; 
        
        const newNextMatchIds: number[] = [];

        for (let i = 0; i < currentRoundMatchesCount; i++) {
            const parentMatchId = nextMatchIds[Math.floor(i / 2)]; 

            let matchTeamAId = null;
            let matchTeamBId = null;
            if (isFirstRound) {
                matchTeamAId = shuffledTeams.pop() || null;
                matchTeamBId = shuffledTeams.pop() || null;
            }

            let roundName = `Vòng ${totalRounds - step + 1}`;
            if (step === 1) roundName = "Chung Kết";
            if (step === 2) roundName = "Bán Kết";
            if (step === 3 && totalRounds >= 3) roundName = "Tứ Kết";
            const newMatch = await prisma.match.create({
                data: {
                    cupId: cupId,
                    roundName: roundName,
                    nextMatchId: parentMatchId,
                    teamAId: matchTeamAId,
                    teamBId: matchTeamBId,
                    status: "SCHEDULED"
                }
            });

            newNextMatchIds.push(newMatch.id);
        }
        nextMatchIds = newNextMatchIds;
    }

    return { message: "success" };
};
// ghi doi thu cho vong tiep theo
const advanceTeamToNextRound = async (currentMatchId: number, winnerTeamId: number) => {
    const currentMatch = await prisma.match.findUnique({ where: { id: currentMatchId } });
    
    if (!currentMatch) throw new Httpexception(404, { error: 'not found current match' });
    if (!currentMatch.nextMatchId) {
        return { status: "CUP_FINISHED", winnerId: winnerTeamId };
    }

    const nextMatch = await prisma.match.findUnique({ where: { id: currentMatch.nextMatchId } });
    if (!nextMatch) throw new Httpexception(404, { error: 'error tree:not found current match' });
    let updateData = {};
    if (nextMatch.teamAId === null) {
        updateData = { teamAId: winnerTeamId };
    } else if (nextMatch.teamBId === null) {
        updateData = { teamBId: winnerTeamId };
    } else {
        throw new Httpexception(400, { error: 'check throw!' });
    }

    await prisma.match.update({
        where: { id: nextMatch.id },
        data: updateData
    });

    return { status: "ADVANCED", nextMatchId: nextMatch.id };
};
//kq
export const submitCupScore = async (matchId: number, goalsA: number, goalsB: number) => {
    const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: { teamA: true, teamB: true }
    });

    if (!match || !match.teamA || !match.teamB) {
        throw new Httpexception(404, { error: 'Trận đấu không tồn tại hoặc chưa xác định đủ 2 đội.' });
    }
    if (match.status === "COMPLETED") {
        throw new Httpexception(400, { error: 'Trận đấu này đã chốt kết quả từ trước.' });
    }
    if (goalsA === goalsB) {
        throw new Httpexception(400, { error: 'Đá cúp loại trực tiếp không được phép hòa, nhập kết quả sau penalty' });
    }
    const scoreA = goalsA > goalsB ? 1 : 0;
    
    const eloResult = FifaRankingSystem.calculate(
        Number(match.teamA.elo),
        Number(match.teamB.elo),
        scoreA,
        FifaRankingSystem.IMPORTANCE.TOURNAMENT_KNOCKOUT 
    );
    const [updatedMatch, updatedTeamA, updatedTeamB] = await prisma.$transaction([
        prisma.match.update({
            where: { id: matchId },
            data: { 
                scoreA: goalsA, 
                scoreB: goalsB, 
                status: "COMPLETED" 
            }
        }),
        prisma.team.update({
            where: { id: match.teamAId! },
            data: { elo: eloResult.teamA.newElo }
        }),
        prisma.team.update({
            where: { id: match.teamBId! },
            data: { elo: eloResult.teamB.newElo }
        })
    ]);
    const winnerTeamId = goalsA > goalsB ? match.teamAId : match.teamBId;
    if (winnerTeamId === null) {
  throw new Error("! winnerId"); 
}
    const advanceResult = await advanceTeamToNextRound(matchId, winnerTeamId);
    return {
        matchInfo: updatedMatch,
        eloChanges: eloResult,
        advanceStatus: advanceResult
    };
};
// nhap cac doi va tao giai
export const importTeamsAndStartCup = async (cupId: number, organizerId: number, teamIds: number[]) => {
    const cup = await prisma.cup.findUnique({ where: { id: cupId } });
    
    if (!cup) throw new Httpexception(404, { error: '!cup' });
    if (cup.organizerId !== organizerId) {
        throw new Httpexception(403, { error: '!boss' });
    }
    if (cup.status !== "UPCOMING") {
        throw new Httpexception(400, { error: 'ing or end' });
    }

    const totalTeams = teamIds.length;
    if (totalTeams < 2 || (Math.log2(totalTeams) % 1 !== 0)) {
        throw new Httpexception(400, { 
            error: `pick ${totalTeams} team, or {4,8,16,32}` 
        });
    }

    await prisma.$transaction(async (tx) => {
        await tx.cup.update({
            where: { id: cupId },
            data: { status: "ONGOING" }
        });
        await tx.cupRegistration.deleteMany({
            where: { cupId: cupId }
        });
        const registrationData = teamIds.map(teamId => ({
            cupId: cupId,
            teamId: teamId,
            status: "APPROVED" 
        }));
        await tx.cupRegistration.createMany({ data: registrationData });
        
    });

    await generateKnockoutBracket(cupId, teamIds);

    return { 
        message: "create cup success",
        totalTeamsImported: totalTeams
    };
};