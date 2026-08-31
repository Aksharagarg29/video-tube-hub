import mongoose from "mongoose"
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js"
import {APIerror} from "../utils/apiError.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { toggleSubscription as toggleSubscriptionService } from "../services/subscription.service.js";


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    const result = await toggleSubscriptionService({ channelId, subscriberId: req.user?._id });

    return res
    .status(200)
    .json(
        new ApiResponse(200, result, result.subscribed ? "Subscribed successfully" : "Unsubscribed successfully")
    )
})


const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!mongoose.isValidObjectId(channelId)){
        throw new APIerror(400, "invalid channel id")
    }
    if (!(await User.exists({ _id: channelId }))) throw new APIerror(404, "channel not found");
    
    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
                pipeline: [
                    {
                        $project: {
                            userName: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                subscriber: {$first: "$subscriber"}
            }
        },
        {
            $project: {
                subscriber: 1
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200, subscribers, "channel subscribers fetched successfully")
    )
})


const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if(!mongoose.isValidObjectId(subscriberId)){
        throw new APIerror(400, "invalid subscriber id")
    }
    if (!(await User.exists({ _id: subscriberId }))) throw new APIerror(404, "user not found");

    const channels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channel",
                pipeline: [
                    {
                        $project: {
                            userName: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                channel: {$first: "$channel"}
            }
        },
        {
            $project: {
                channel: 1
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200, channels, "user subscribes to these channels, fetched successfully")
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}

