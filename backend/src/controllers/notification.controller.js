import mongoose from "mongoose"
import {Notification} from "../models/notification.model.js"
import {APIerror} from "../utils/apiError.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { getPagination } from "../utils/validation.js";

const getNotifications = asyncHandler(async (req, res) => {
    const { page: pageNum, limit: limitNum } = getPagination(req.query);

    const notifications = await Notification.find({ recipient: req.user._id })
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .populate("sender", "userName fullName avatar")
        .populate("video", "title thumbnail")
        .lean();

    return res
        .status(200)
        .json(new ApiResponse(200, notifications, "Notifications fetched successfully"));
});

const getUnreadCount = asyncHandler(async (req, res) => {
    const count = await Notification.countDocuments({
        recipient: req.user._id,
        isRead: false
    });

    return res
        .status(200)
        .json(new ApiResponse(200, { count }, "Unread notification count fetched successfully"));
});

const markNotificationAsRead = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;

    if (!mongoose.isValidObjectId(notificationId)) {
        throw new APIerror(400, "invalid notification id");
    }

    const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: req.user._id },
        { $set: { isRead: true } },
        { new: true }
    );

    if (!notification) {
        throw new APIerror(404, "notification not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, notification, "Notification marked as read"));
});

const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany(
        { recipient: req.user._id, isRead: false },
        { $set: { isRead: true } }
    );

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "All notifications marked as read"));
});

export {
    getNotifications,
    getUnreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead
}