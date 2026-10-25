
import mongoose from "mongoose";
import Notification from "../models/Notification.js";

export const getNotifications = async (req, res, next) => {
  try {
    const {
      page = "1",
      limit = "20",
      unreadOnly = "false",
    } = req.query;

    const pageNumber = Number(page);
    const pageSize = Number(limit);

    if (
      !Number.isInteger(pageNumber) ||
      pageNumber < 1 ||
      !Number.isInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Page must be positive and limit must be between 1 and 100",
      });
    }

    if (!["true", "false"].includes(unreadOnly)) {
      return res.status(400).json({
        success: false,
        message: "unreadOnly must be true or false",
      });
    }

    // Users can only access their own notifications.
    const filter = {
      recipientId: req.user._id,
    };

    if (unreadOnly === "true") {
      filter.readAt = null;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .populate("actorId", "name email")
        .sort({ createdAt: -1, _id: -1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .lean(),

      Notification.countDocuments(filter),

      Notification.countDocuments({
        recipientId: req.user._id,
        readAt: null,
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const markNotificationAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    // The recipient condition prevents users from marking
    // another user's notification as read.
    const notification = await Notification.findOneAndUpdate(
      {
        _id: id,
        recipientId: req.user._id,
      },
      {
        $set: { readAt: new Date() },
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("actorId", "name email")
      .lean();

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      {
        recipientId: req.user._id,
        readAt: null,
      },
      {
        $set: { readAt: new Date() },
      }
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    next(error);
  }
};
