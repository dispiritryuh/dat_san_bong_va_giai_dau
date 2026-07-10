import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { Prisma } from '@prisma/client';
import prisma from '../../prisma/prisma-client'; 
import { createMessageService } from './message.service';
let io: SocketIOServer;

export const initSocketServer = (httpServer: HttpServer) => {
    io = new SocketIOServer(httpServer, {
        cors: {
            origin: "*", 
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket: Socket) => {
        console.log(`Client connected: ${socket.id}`);
        socket.on('join_user_room', (userId: number) => {
            const roomName = `user_${userId}`;
            socket.join(roomName); 
            console.log(`User ${userId} đã vào phòng nhận thông báo: ${roomName}`);
        });
        socket.on('join_challenge_room', (challengeId: number) => {
            const roomName = `challenge_${challengeId}`;
            socket.join(roomName);
            console.log(`User đã join phòng chat: ${roomName}`);
        });

        socket.on('send_message', async (payload: { challengeId: number, senderId: number, content: string }) => {
            try {
                const savedMessage = await createMessageService(
                    payload.challengeId, 
                    payload.senderId, 
                    payload.content
                );

                const roomName = `challenge_${payload.challengeId}`;
                io.to(roomName).emit('receive_message', savedMessage);
                
            } catch (error) {
                console.error("Lỗi khi lưu tin nhắn chat:", error);
                socket.emit('chat_error', { message: "Không thể gửi tin nhắn lúc nà" });
            }
        });

        socket.on('disconnect', () => {
            console.log(` Client disconnected: ${socket.id}`);
        });
        socket.on('propose_pitch', (data) => {
            const roomName = `challenge_${data.challengeId}`;
            socket.to(roomName).emit('opponent_proposed_pitch', data.pitch);
        });

        socket.on('im_ready', (data) => {
            const roomName = `challenge_${data.challengeId}`;
            socket.to(roomName).emit('opponent_is_ready');
        });

        socket.on('payment_success', (data) => {
            const roomName = `challenge_${data.challengeId}`;
            socket.to(roomName).emit('payment_success_broadcast');
        });

        socket.on('propose_score', (data) => {
            const roomName = `challenge_${data.challengeId}`;
            socket.to(roomName).emit('opponent_proposed_score', { scoreA: data.scoreA, scoreB: data.scoreB });
        });

        socket.on('confirm_score', (data) => {
            const roomName = `challenge_${data.challengeId}`;
            socket.to(roomName).emit('opponent_confirmed_score');
        });

        socket.on('cancel_score', (data) => {
            const roomName = `challenge_${data.challengeId}`;
            socket.to(roomName).emit('opponent_canceled_score');
        });
        socket.on('cancel_pitch_proposal', (data) => {
            const roomName = `challenge_${data.challengeId}`;
            socket.to(roomName).emit('opponent_canceled_pitch_proposal');
        });
        socket.on('request_current_state', (data) => {
            const roomName = `challenge_${data.challengeId}`;
            socket.to(roomName).emit('ask_for_state_sync_from_opponent');
        });
    }); 

    return io;
};

export const getSocketInstance = () => {
    if (!io) {
        throw new Error("Socket.io chưa được khởi tạo!phải gọi initSocketServer ở server.ts trướ");
    }
    return io;
};