import mongoose, { Schema } from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        sender: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        type: {
            type: String,
            enum: ["subscribe", "comment", "like", "newVideo"],
            required: true
        },

        video: {
            type: Schema.Types.ObjectId,
            ref: "Video"
        },

        comment: {
            type: Schema.Types.ObjectId,
            ref: "Comment"
        },

        tweet: {
            type: Schema.Types.ObjectId,
            ref: "Tweet"
        },

        isRead: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });

export const Notification = mongoose.model("Notification", notificationSchema);