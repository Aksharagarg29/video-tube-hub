import { Notification } from "../models/notification.model.js";
import { Subscription } from "../models/subscription.model.js";

// Creates a single notification. Never throws — a notification failing to
// save should never break the action that triggered it (subscribing,
// commenting, liking, etc).
export const createNotification = async ({ recipient, sender, type, video, comment, tweet }) => {
    if (!recipient || !sender) return;

    // Don't notify people about their own actions (e.g. liking your own video).
    if (recipient.toString() === sender.toString()) return;

    try {
        await Notification.create({ recipient, sender, type, video, comment, tweet });
    } catch (error) {
        console.error("NOTIFICATION CREATE ERROR:", error);
    }
};

// Notifies every subscriber of a channel that it uploaded a new video.
export const notifySubscribersOfNewVideo = async ({ channelId, video }) => {
    try {
        const subscriptions = await Subscription.find({ channel: channelId }).select("subscriber");
        if (!subscriptions.length) return;

        const notifications = subscriptions.map((sub) => ({
            recipient: sub.subscriber,
            sender: channelId,
            type: "newVideo",
            video: video._id
        }));

        await Notification.insertMany(notifications, { ordered: false });
    } catch (error) {
        console.error("NOTIFY SUBSCRIBERS ERROR:", error);
    }
};