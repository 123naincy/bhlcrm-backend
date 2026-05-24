import Notification from "../models/Notification";

interface NotificationPayload {
  title: string;
  message: string;
  type: string;
  userId: string;
  meta?: any;
}

export const createNotification =
  async ({
    title,
    message,
    type,
    userId,
    meta = {},
  }: NotificationPayload) => {
    try {
      // save in DB
      const notification =
        await Notification.create({
          title,
          message,
          type,
          userId,
          meta,
        });

      return notification;
    } catch (error) {
      console.error(
        "Notification create failed:",
        error
      );
    }
  };