import { v4 as uuidv4 } from 'uuid';
import { redisClient } from '../app';

/**
 * @param lockKey 
 * @param ttl_ms 
 * @returns 
 */
export const acquireLock = async (lockKey: string, ttl_ms: number = 5000): Promise<string | null> => {
    const lockValue: string = uuidv4();
    const isLocked: string | null = await redisClient.set(lockKey, lockValue, {
        NX: true,
        PX: ttl_ms 
    });

    return isLocked === 'OK' ? lockValue : null; 
};

/**
 * @param lockKey 
 * @param lockValue 
 */
export const releaseLock = async (lockKey: string, lockValue: string): Promise<void> => {
    const currentOwner: string | null = await redisClient.get(lockKey);
    if (currentOwner === lockValue) {
        await redisClient.del(lockKey);
    }
};