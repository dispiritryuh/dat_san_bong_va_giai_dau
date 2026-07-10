import { getSocketInstance } from './socket'; 

export enum NotificationEvent {
    NEW_CHALLENGE = 'new_challenge',
    CHALLENGE_ACCEPTED = 'challenge_accepted',
    CHALLENGE_REJECTED = 'challenge_rejected',
    SCORE_SUBMITTED = 'score_submitted',
    MATCH_FINISHED = 'match_finished',
    CHALLENGE_CANCELED='challenge_canceled',
    NOT_ENOUGHT_MONEY='not_enougth_money',
    SCORE_NEW='score_NEW',
}

/**
 * @param targetUserId 
 * @param event 
 * @param payload 
 */
export const sendNotificationToUser = (targetUserId: number, event: NotificationEvent, payload: any): void => {
    try {
        const io = getSocketInstance();
        
        const roomName = `user_${targetUserId}`;
        
        io.to(roomName).emit(event, payload);
        
        console.log(`[Notification] sended [${event}] ->  User ID: ${targetUserId}`);
    } catch (error) {
        console.error(`[Notification] error send mess -> User ${targetUserId}:`, error);
    }
};

/**
 * 
 */
export const sendNotificationToMany = (userIds: number[], event: NotificationEvent, payload: any): void => {
    try {
        const io = getSocketInstance();
        const rooms = userIds.map(id => `user_${id}`);
        io.to(rooms).emit(event, payload);
    } catch (error) {
        console.error(`[Notification] Lỗi Broadcast:`, error);
    }
};