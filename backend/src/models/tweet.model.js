import mongoose, { Schema } from "mongoose";

const tweetSchema = new mongoose.Schema(
    {
        content : {
            type: String,
            required: true,
            trim: true,
            maxlength: 5000
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        }
    }, 
    {timestamps: true}
)

export const Tweet = mongoose.model("Tweet", tweetSchema)
