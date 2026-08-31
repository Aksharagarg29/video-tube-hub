import mongoose, { Schema } from "mongoose";

const likeSchema = new mongoose.Schema(
    {
        likedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        comment: {
            type: Schema.Types.ObjectId,
            ref: "Comment",
            default: undefined
        },

        video: {
            type: Schema.Types.ObjectId,
            ref: "Video",
            default: undefined
        },

        tweet: {
            type: Schema.Types.ObjectId,
            ref: "Tweet",
            default: undefined
        }
    },
    { timestamps: true }
);

likeSchema.pre("validate", function (next) {
    const targetCount = [this.video, this.comment, this.tweet].filter(Boolean).length;
    if (targetCount !== 1) this.invalidate("video", "A like must belong to exactly one target");
    next();
});


// Prevent duplicate video likes
likeSchema.index(
    { likedBy: 1, video: 1 },
    {
        unique: true,
        partialFilterExpression: {
            video: { $exists: true }
        }
    }
);


// Prevent duplicate comment likes
likeSchema.index(
    { likedBy: 1, comment: 1 },
    {
        unique: true,
        partialFilterExpression: {
            comment: { $exists: true }
        }
    }
);


// Prevent duplicate tweet likes
likeSchema.index(
    { likedBy: 1, tweet: 1 },
    {
        unique: true,
        partialFilterExpression: {
            tweet: { $exists: true }
        }
    }
);


export const Like = mongoose.model("Like", likeSchema);
