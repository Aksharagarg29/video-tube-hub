import mongoose, {isValidObjectId} from "mongoose"
import {PlayList} from "../models/playlist.model.js"
import {Video} from "../models/video.model.js"
import {Like} from "../models/like.model.js"
import {APIerror} from "../utils/apiError.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { requireOwner } from "../utils/authorization.js";


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    if(!name?.trim() || !description?.trim()){
        throw new APIerror(400, "All fields are required")
    }
    const playList = await PlayList.create({
        name: name.trim(),
        description: description.trim(),
        owner: req.user?._id,
        video: []
    })

    if(!playList){
        throw new APIerror(404, "Something went wrong while creating playlist")
    }
    
    return res
    .status(200)
    .json(
        new ApiResponse(200, playList, "PlayList created successfully")
    )

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    if(!mongoose.isValidObjectId(userId)){
        throw new APIerror(400, "invalid user id")
    }

    const userPlaylist = await PlayList.aggregate([
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
                            fullName: 1,
                            userName: 1,
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
                name: 1,
                description: 1,
                video: 1,
                owner: 1
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200, userPlaylist, "fetched user playlist successfully")
    )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if (!mongoose.isValidObjectId(playlistId)) {
        throw new APIerror(400, "invalid playlist id");
    }
    const playList = await PlayList.findById(playlistId)
        .populate({
            path: "video",
            populate: {
                path: "owner",
                select: "userName fullName avatar"
            }
        })
        .populate("owner", "userName fullName avatar")
    if(!playList){
        throw new APIerror(404, "playlist not found")
    }

    const videoIds = playList.video.map((video) => video._id)

    const likeCounts = await Like.aggregate([
        { $match: { video: { $in: videoIds } } },
        { $group: { _id: "$video", count: { $sum: 1 } } }
    ])

    const likeCountMap = new Map(
        likeCounts.map((entry) => [entry._id.toString(), entry.count])
    )

    const playListWithLikeCounts = playList.toObject()
    playListWithLikeCounts.video = playListWithLikeCounts.video.map((video) => ({
        ...video,
        likeCount: likeCountMap.get(video._id.toString()) || 0
    }))

    return res
    .status(200)
    .json(
        new ApiResponse(200, playListWithLikeCounts, "playList fetched successfully")
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!playlistId || !videoId){
        throw new APIerror(400, "playlist id or video id is missing")
    }

    if (!mongoose.isValidObjectId(playlistId)) {
        throw new APIerror(400, "invalid playlist id");
    }

    const playList = await PlayList.findById(playlistId)
    if(!playList){
        throw new APIerror(404, "playlist not found")
    }

    if (!mongoose.isValidObjectId(videoId)) {
        throw new APIerror(400, "invalid video id");
    }

    const video = await Video.findById(videoId)
    if(!video){
        throw new APIerror(404, "video not found")
    }

    requireOwner(playList, req.user?._id, "Not authorized to add videos in this playlist");

    const addVideo = await PlayList.findByIdAndUpdate(
        playlistId,
        {
            $addToSet: {
                video : videoId
            }
        },
        {new: true}
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200, addVideo, "video added to playlist successfully")
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!playlistId || !videoId){
        throw new APIerror(400, "playlist id or video id is missing")
    }

    if (!mongoose.isValidObjectId(playlistId)) {
        throw new APIerror(400, "invalid playlist id");
    }

    const playList = await PlayList.findById(playlistId)
    if(!playList){
        throw new APIerror(404, "playlist not found")
    }

    if (!mongoose.isValidObjectId(videoId)) {
        throw new APIerror(400, "invalid video id");
    }
    
    const video = await Video.findById(videoId)
    if(!video){
        throw new APIerror(404, "video not found")
    }

    requireOwner(playList, req.user?._id, "Not authorized to remove videos from this playlist");

    const removeVideo = await PlayList.findByIdAndUpdate(
        playlistId,
        {
            $pull: {
                video: videoId
            }
        },
        {new: true}
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200, removeVideo, "video removed from the playlist successfully")
    )

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if (!mongoose.isValidObjectId(playlistId)) {
        throw new APIerror(400, "invalid playlist id");
    }

    const playList = await PlayList.findById(playlistId)
    if(!playList){
        throw new APIerror(404, "playlist not exists")
    }

    requireOwner(playList, req.user?._id, "Not authorized to delete this playlist");

    await PlayList.findByIdAndDelete(playlistId)

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "playList deleted successfully")
    )
    
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if (!mongoose.isValidObjectId(playlistId)) {
        throw new APIerror(400, "invalid playlist id");
    }

    const {name, description} = req.body
    if(!name?.trim() || !description?.trim()){
        throw new APIerror(400, "all fields are required")
    }

    const playList = await PlayList.findById(playlistId)
    if(!playList){
        throw new APIerror(404, "playlist not exists")
    }

    requireOwner(playList, req.user?._id, "Not authorized to update this playlist");

    const updatedPlayList = await PlayList.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name: name.trim(),
                description: description.trim()
            }
        },
        {new: true}
    )

    if(!updatedPlayList){
        throw new APIerror(404, "something went wrong while updating playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedPlayList, "playList updated successfully")
    )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}