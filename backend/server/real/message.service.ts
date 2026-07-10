//luu tin nhan
import { PrismaClient } from '@prisma/client';
import prisma from '../../prisma/prisma-client';

export const createMessageService = async (challengeId: number, senderId: number, content: string) => {
    const savedMessage = await prisma.message.create({
        data: {
            challengeId: challengeId,
            senderId: senderId,
            content: content
        },
        include: {
            sender: {
                select: { username: true } 
            }
        }
    });

    return savedMessage; 
}