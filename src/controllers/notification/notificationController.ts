import { Request, Response } from "express";
import Notification from "../../models/Notification";

export const getNotifications = async (
  req: any,
  res: Response
) => {
  try {
    const user = req.user;

    const notifications =
      await Notification.find({
        userId: user.userId,
      })
        .sort({ createdAt: -1 })
        .limit(20);

    res.status(200).json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch notifications",
    });
  }
};

export const getUnreadCount = async (
  req: any,
  res: Response
) => {
  try {
    const user = req.user;

    const count =
      await Notification.countDocuments({
        userId: user.userId,
        isRead: false,
      });

    res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch unread count",
    });
  }
};

export const markNotificationRead =
  async (
    req: any,
    res: Response
  ) => {
    try {
      const user = req.user;
      const { id } = req.params;

      const notification =
        await Notification.findOne({
          _id: id,
          userId: user.userId,
        });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message:
            "Notification not found",
        });
      }

      notification.isRead = true;
      await notification.save();

      res.status(200).json({
        success: true,
        message:
          "Notification marked read",
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message:
          "Failed to update notification",
      });
    }
  };

export const markAllNotificationsRead =
  async (
    req: any,
    res: Response
  ) => {
    try {
      const user = req.user;

      await Notification.updateMany(
        {
          userId: user.userId,
          isRead: false,
        },
        {
          isRead: true,
        }
      );

      res.status(200).json({
        success: true,
        message:
          "All notifications marked read",
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message:
          "Failed to mark all read",
      });
    }
  };