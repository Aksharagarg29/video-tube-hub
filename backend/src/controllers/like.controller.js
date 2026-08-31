import mongoose from "mongoose";
import { Like } from "../models/like.model.js";
import { getLikeStatus, toggleLike } from "../services/like.service.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createToggleHandler = (entityType, paramName) => asyncHandler(async (req, res) => {
    const data = await toggleLike({ entityType, entityId: req.params[paramName], userId: req.user?._id });
    return res.status(200).json(new ApiResponse(200, data, data.liked ? `${entityType} liked successfully` : `${entityType} unliked successfully`));
});

const toggleVideoLike = createToggleHandler("video", "videoId");
const toggleCommentLike = createToggleHandler("comment", "commentId");
const toggleTweetLike = createToggleHandler("tweet", "tweetId");

const getVideoLikeStatus = asyncHandler(async (req, res) => {
    const data = await getLikeStatus({ entityType: "video", entityId: req.params.videoId, userId: req.user?._id });
    return res.status(200).json(new ApiResponse(200, data, "Video like status fetched successfully"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
    const likedVideos = await Like.aggregate([
        { $match: { likedBy: new mongoose.Types.ObjectId(req.user._id), video: { $ne: null } } },
        { $sort: { createdAt: -1 } },
        { $lookup: { from: "videos", localField: "video", foreignField: "_id", as: "video" } },
        { $unwind: "$video" },
        { $lookup: { from: "users", localField: "video.owner", foreignField: "_id", as: "owner", pipeline: [{ $project: { userName: 1, fullName: 1, avatar: 1 } }] } },
        { $lookup: { from: "likes", let: { videoId: "$video._id" }, pipeline: [{ $match: { $expr: { $eq: ["$video", "$$videoId"] } } }, { $count: "count" }], as: "likeData" } },
        { $set: { "video.owner": { $first: "$owner" }, "video.likeCount": { $ifNull: [{ $first: "$likeData.count" }, 0] } } },
        { $replaceRoot: { newRoot: "$video" } },
    ]);
    return res.status(200).json(new ApiResponse(200, likedVideos, likedVideos.length ? "Liked videos fetched successfully" : "No videos liked yet"));
});

export { getLikedVideos, getVideoLikeStatus, toggleCommentLike, toggleTweetLike, toggleVideoLike };
