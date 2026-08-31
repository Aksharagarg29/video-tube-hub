import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
    {
        subscriber:{
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        channel: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {timestamps: true}
)

subscriptionSchema.index({ subscriber: 1, channel: 1 }, { unique: true });
subscriptionSchema.index({ channel: 1, createdAt: -1 });

// Keep the existing model/collection name to avoid an unnecessary data migration.
export const Subscription = mongoose.model("Subsciption", subscriptionSchema);

