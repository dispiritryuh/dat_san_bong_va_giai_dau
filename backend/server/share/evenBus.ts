
import { EventEmitter } from 'events';
export const eventBus = new EventEmitter();
export const Events = {
    BOOKING_SUCCESS: 'BOOKING_SUCCESS',
    NOT_ENOUGHT_MONEY:'NOT_ENOUGHT_MONE',
    PAYMENT_SUCCESS_MATCH: 'PAYMENT_SUCCESS_MATCH',
};