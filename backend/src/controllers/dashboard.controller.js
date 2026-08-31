import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {PlayList} from "../models/playlist.model.js" 
import {Tweet} from "../models/tweet.model.js"
import {APIerror} from "../utils/apiError.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { getPagination } from "../utils/validation.js";

const getChannelStats = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    const totalSubscribers = await Subscription.countDocuments({ channel: userId });

    const videoStats = await Video.aggregate([
        { 
            $match: 
            { 
                owner: new mongoose.Types.ObjectId(userId) 
            } 
        },
        { 
            $group: 
            { 
                _id: null, 
                totalVideos: { $sum: 1 }, 
                totalViews: { $sum: "$views" } 
            } 
        }
    ]);

    const totalVideos = videoStats[0]?.totalVideos || 0;
    // const totalViews = videoStats[0]?.totalViews || 0;

    const videoIds = await Video.find(
        { owner: userId }
    ).distinct("_id");

    const totalLikes = await Like.countDocuments(
        { video: { $in: videoIds } }
    );

    const totalPlaylists = await PlayList.countDocuments(
        { owner: userId }
    );

    const totalPosts = await Tweet.countDocuments(
        { owner: userId }
    );

    return res
        .status(200)
        .json(new ApiResponse(200, { totalSubscribers, totalVideos, totalPlaylists, totalPosts }, "Channel stats fetched successfully"));
})

const getChannelVideos = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const { page: pageNum, limit: limitNum } = getPagination(req.query);

    const videoAggregate = Video.aggregate([
        { 
            $match: 
            { 
                owner: new mongoose.Types.ObjectId(userId) 
            } 
        },
        { 
            $sort: 
            { 
                createdAt: -1 
            } 
        }
    ]);

    const videos = await Video.aggregatePaginate(videoAggregate, 
        {   
            page: pageNum,
            limit: limitNum
        }
    )
    
    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Channel videos fetched successfully"));
})

export { 
    getChannelStats, 
    getChannelVideos 
}
