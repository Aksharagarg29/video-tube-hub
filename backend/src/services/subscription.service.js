import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { APIerror } from "../utils/apiError.js";
import { requireObjectId } from "../utils/validation.js";
import { createNotification } from "./notification.service.js";

export const toggleSubscription = async ({ channelId, subscriberId }) => {
    const channel = requireObjectId(channelId, "channel id");
    if (!subscriberId) throw new APIerror(401, "User is not authenticated");
    if (channel.toString() === subscriberId.toString()) throw new APIerror(400, "You cannot subscribe to your own channel");
    if (!(await User.exists({ _id: channel }))) throw new APIerror(404, "Channel not found");
    const filter = { subscriber: subscriberId, channel };
    const existing = await Subscription.findOne(filter);
    if (existing) {
        await Subscription.deleteOne({ _id: existing._id });
        return { subscribed: false, subscription: null };
    }
    try {
        const subscription = await Subscription.create(filter);
        await createNotification({ recipient: channel, sender: subscriberId, type: "subscribe" });
        return { subscribed: true, subscription };
    } catch (error) {
        if (error?.code !== 11000) throw error;
        return { subscribed: true, subscription: await Subscription.findOne(filter) };
    }
};
