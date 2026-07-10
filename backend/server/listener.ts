import { eventBus, Events } from "./share/evenBus";
import prisma from "../prisma/prisma-client";
import {
  NotificationEvent,
  sendNotificationToUser,
} from "./real/notification.service";
import { createMatch } from "./modules/match/match.service";
eventBus.on(Events.BOOKING_SUCCESS, async (data) => {
  try {
    await prisma.walletTransaction.create({
      data: {
        userId: data.userId,
        amount: data.amount,
        type: "OK",
        description: `Payment success pitch of ${data.pitchName}`,
      },
    });
    console.log(`[Event] log User ${data.userId}`);
  } catch (error) {
    console.error(`[Event] NOTICE: OVERLOAD ${data.userId}`, error);
  }
});
eventBus.on(Events.PAYMENT_SUCCESS_MATCH,async(data)=>{
  await createMatch(data.challengeId);
})
eventBus.on(Events.NOT_ENOUGHT_MONEY, async (data) => {
  await sendNotificationToUser(data.userId, NotificationEvent.NOT_ENOUGHT_MONEY, {
    mess: "not enought money",
  });
});
