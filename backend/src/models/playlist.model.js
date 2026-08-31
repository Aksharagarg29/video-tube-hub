import mongoose, { Schema } from "mongoose";

const playListSchema = new mongoose.Schema(
    {
        name : {
            type: String,
            required: true,
            trim: true,
            maxlength: 120
        },
        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 5000
        },
        video : [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        }
    }, 
    {timestamps: true}
)

export const PlayList = mongoose.model("PlayList", playListSchema)
