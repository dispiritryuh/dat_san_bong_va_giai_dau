import Cron from "node-cron";
import { Prisma } from "@prisma/client";
import prisma from "../../../prisma/prisma-client";
export const initCleanupCron = () => {
    Cron.schedule('0 0 * * *', async () => {
        console.log("check expired challenge");
        
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        try {
            const expiredChallenges = await prisma.challenge.updateMany({
                where: {
                    status: "PENDING",
                    createdAt: {
                        lte: oneWeekAgo 
                    }
                },
                data: {
                    status: "EXPIRED" 
                }
            });
        } catch (error) {
            console.error("erorr clean expire", error);
        }
    });
};