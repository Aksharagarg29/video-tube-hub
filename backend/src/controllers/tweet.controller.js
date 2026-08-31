import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {APIerror} from "../utils/apiError.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Like } from "../models/like.model.js";
import { requireOwner } from "../utils/authorization.js";

const createTweet = asyncHandler(async (req, res) => {
    const {content} = req.body
    if(!content?.trim()){
        throw new APIerror(400, "content is required")
    }
    const tweet = await Tweet.create({
        content: content.trim(),
        owner: req.user?._id
    })

    if(!tweet){
        throw new APIerror(404, "Something went wrong while publishing the tweet")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, tweet, "Tweet published successfully")
    )
})

const getUserTweets = asyncHandler(async (req, res) => {
    const {userId} = req.params
    if (!mongoose.isValidObjectId(userId)) {
        throw new APIerror(400, "invalid or missing user id");
    }
    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
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
                owner: {
                    $first: "$owner"
                }
            }
        },
        {
            $project: {
                content: 1,
                owner: 1
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200, tweets, "tweets of this user fetched successfully")
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    if (!mongoose.isValidObjectId(tweetId)) {
        throw new APIerror(400, "invalid or missing tweet id");
    }

    const {content} = req.body
    if(!content?.trim()){
        throw new APIerror(400, "content is required")
    }

    const tweet = await Tweet.findById(tweetId)
    if(!tweet){
        throw new APIerror(404, "tweet not found")
    }

    requireOwner(tweet, req.user?._id, "Not authorized to update this tweet");

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content: content.trim()
            }
        },
        {new: true}
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedTweet, "tweet updated successfully")
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    if (!mongoose.isValidObjectId(tweetId)) {
        throw new APIerror(400, "invalid or missing tweet id");
    }

    const tweet = await Tweet.findById(tweetId)
    if(!tweet){
        throw new APIerror(404, "tweet not found")
    }

    requireOwner(tweet, req.user?._id, "Not authorized to delete this tweet");

    await Tweet.findByIdAndDelete(tweetId)
    await Like.deleteMany({ tweet: tweetId });

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "tweet deleted successfully")
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
