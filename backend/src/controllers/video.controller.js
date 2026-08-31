import mongoose, {isValidObjectId} from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";
import { PlayList } from "../models/playlist.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { APIerror } from "../utils/apiError.js";
import { deleteOldImage, uploadToCloudinary } from "../utils/cloudinary.js";
import { notifySubscribersOfNewVideo } from "../services/notification.service.js";


const getAllVideos = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        query,
        sortBy,
        sortType,
        userId
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const pipeline = [];

    // --------------------------------
    // USER / CHANNEL FILTER
    // --------------------------------

    if (userId) {

        if (!mongoose.isValidObjectId(userId)) {
            throw new APIerror(400, "userId not found");
        }

        const ownerId = new mongoose.Types.ObjectId(userId);

        // If logged-in user is viewing their OWN channel,
        // show both public and private videos.
        const isOwnChannel =
            req.user?._id?.toString() === userId.toString();

        if (isOwnChannel) {

            pipeline.push({
                $match: {
                    owner: ownerId
                }
            });

        } else {

            // Other users can only see published videos
            pipeline.push({
                $match: {
                    owner: ownerId,
                    isPublished: true
                }
            });
        }

    } else {

        // Home page / general video listing
        // should only show public videos
        pipeline.push({
            $match: {
                isPublished: true
            }
        });
    }

    // --------------------------------
    // SEARCH
    // --------------------------------

    if (query) {
        pipeline.push({
            $match: {
                $or: [
                    {
                        title: {
                            $regex: query,
                            $options: "i"
                        }
                    },
                    {
                        description: {
                            $regex: query,
                            $options: "i"
                        }
                    }
                ]
            }
        });
    }

    // --------------------------------
    // SORT
    // --------------------------------

    if (sortBy && sortType) {

        pipeline.push({
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1
            }
        });

    } else {

        pipeline.push({
            $sort: {
                createdAt: -1
            }
        });
    }

    // --------------------------------
    // OWNER DETAILS
    // --------------------------------

    pipeline.push(
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
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
                ownerDetails: {
                    $first: "$ownerDetails"
                }
            }
        }
    );

    // --------------------------------
    // LIKE COUNT
    // --------------------------------

    pipeline.push({
        $lookup: {
            from: "likes",
            let: {
                videoId: "$_id"
            },
            pipeline: [
                {
                    $match: {
                        $expr: {
                            $eq: [
                                "$video",
                                "$$videoId"
                            ]
                        }
                    }
                },
                {
                    $count: "count"
                }
            ],
            as: "likeData"
        }
    });

    pipeline.push({
        $addFields: {
            likeCount: {
                $ifNull: [
                    {
                        $arrayElemAt: [
                            "$likeData.count",
                            0
                        ]
                    },
                    0
                ]
            }
        }
    });

    // Remove temporary lookup data
    pipeline.push({
        $project: {
            likeData: 0
        }
    });

    // --------------------------------
    // PAGINATION
    // --------------------------------

    const videoAggregate = Video.aggregate(pipeline);

    const videos = await Video.aggregatePaginate(
        videoAggregate,
        {
            page: pageNum,
            limit: limitNum
        }
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                videos,
                "videos fetched successfully"
            )
        );
});

const publishAVideo = asyncHandler(async (req, res) => {

    const {
        title,
        description,
        isPublished
    } = req.body;

    if (
        [title, description].some(
            (field) => field?.trim() === ""
        )
    ) {
        throw new APIerror(
            400,
            "Fields should not be empty"
        );
    }

    const videoLocalPath =
        req.files?.videoFile?.[0]?.path;

    const thumbnailLocalPath =
        req.files?.thumbnail?.[0]?.path;

    if (
        !(videoLocalPath && thumbnailLocalPath)
    ) {
        throw new APIerror(
            400,
            "Video file and thumbnail file is required"
        );
    }

    const videoFile =
        await uploadToCloudinary(
            videoLocalPath
        );

    const thumbnail =
        await uploadToCloudinary(
            thumbnailLocalPath
        );

    if (
        !(videoFile && thumbnail)
    ) {
        throw new APIerror(
            400,
            "Video file and thumbnail file is not uploaded"
        );
    }

    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,

        owner: req.user._id,

        title,
        description,

        duration: videoFile.duration,

        // IMPORTANT
        isPublished: isPublished === "true"
    });

    if (!video) {
        throw new APIerror(
            500,
            "Something went wrong while publishing the video"
        );
    }

    if (video.isPublished) {
        await notifySubscribersOfNewVideo({
            channelId: req.user._id,
            video
        });
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                video,
                isPublished === "true"
                    ? "Video has been published successfully"
                    : "Video has been saved as private successfully"
            )
        );
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new APIerror(400, "invalid or missing video id");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new APIerror(404, "video not found");
    }

    const isOwner =
        req.user &&
        video.owner.toString() === req.user._id.toString();

    if (!video.isPublished && !isOwner) {
        throw new APIerror(
            400,
            "This video is not available"
        );
    }

    // Attach owner details (username/avatar/subscriber info) and like
    // count so the watch page can show who uploaded the video and let
    // the viewer subscribe to them directly.
    const [videoWithDetails] = await Video.aggregate([
        {
            $match: {
                _id: video._id
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $lookup: {
                            // See getUserChannelProfile for why this collection
                            // name doesn't match the "Subscription" model name.
                            from: "subsciptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribers"
                        }
                    },
                    {
                        $addFields: {
                            subscribersCount: {
                                $size: "$subscribers"
                            },
                            isSubscribed: {
                                $cond: {
                                    if: {
                                        $in: [
                                            req.user?._id,
                                            "$subscribers.subscriber"
                                        ]
                                    },
                                    then: true,
                                    else: false
                                }
                            }
                        }
                    },
                    {
                        $project: {
                            userName: 1,
                            fullName: 1,
                            avatar: 1,
                            subscribersCount: 1,
                            isSubscribed: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                ownerDetails: {
                    $first: "$ownerDetails"
                }
            }
        },
        {
            $lookup: {
                from: "likes",
                let: {
                    videoId: "$_id"
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: [
                                    "$video",
                                    "$$videoId"
                                ]
                            }
                        }
                    },
                    {
                        $count: "count"
                    }
                ],
                as: "likeData"
            }
        },
        {
            $addFields: {
                likeCount: {
                    $ifNull: [
                        {
                            $arrayElemAt: [
                                "$likeData.count",
                                0
                            ]
                        },
                        0
                    ]
                }
            }
        },
        {
            $project: {
                likeData: 0
            }
        }
    ]);

    if (!videoWithDetails) {
        throw new APIerror(404, "video not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                videoWithDetails,
                "video fetched successfully"
            )
        );
});

const incrementVideoView = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new APIerror(400, "invalid or missing video id");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new APIerror(404, "video not found");
    }

    const isOwner =
        req.user &&
        video.owner.toString() === req.user._id.toString();

    if (!video.isPublished && !isOwner) {
        throw new APIerror(
            400,
            "This video is not available"
        );
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $inc: {
                views: 1
            }
        },
        {
            new: true
        }
    );

    // Add to watch history only for logged-in users
    if (req.user?._id) {
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $addToSet: {
                    watchHistory: videoId
                }
            }
        );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    views: updatedVideo.views
                },
                "Video view counted successfully"
            )
        );
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!mongoose.isValidObjectId(videoId)) {
        throw new APIerror(400, "invalid or missing video id");
    }

    const video = await Video.findById(videoId)
    if(!video){
        throw new APIerror(404, "Video not found")
    }

    if(video.owner.toString() !== req.user?._id.toString()){
        throw new APIerror(403, "Not authorized to update this video")
    }

    const {title, description} = req.body
    if(!title || !description){
        throw new APIerror(400, "all fields are required")
    }

    let thumbnailUrl = video.thumbnail

    const thumbnailLocalFile = req.file?.path

    if(thumbnailLocalFile){
        const thumbnail = await uploadToCloudinary(thumbnailLocalFile)
        if(!thumbnail){
            throw new APIerror(404, "something went wrong while uploading updated thumbnail")
        }
        await deleteOldImage({ file: video.thumbnail })
        thumbnailUrl = thumbnail.url
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
         {
            $set: {
                title,
                description,
                thumbnail: thumbnailUrl
            }
        },
        {new: true}
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedVideo, "updated video successfully")
    )

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!mongoose.isValidObjectId(videoId)) {
        throw new APIerror(400, "invalid or missing video id");
    }

    const video = await Video.findById(videoId)
    if(!video){
        throw new APIerror(404, "Video not found")
    }

    if(video.owner.toString() !== req.user?._id.toString()){
        throw new APIerror(403, "Not authorized to delete this video")
    }
    
    await Video.findByIdAndDelete(videoId)

    // Remove dependent records so deleted videos never surface in user data.
    const comments = await Comment.find({ video: videoId }).distinct("_id");
    await Like.deleteMany({ $or: [{ video: videoId }, { comment: { $in: comments } }] });
    await Comment.deleteMany({ video: videoId });
    await PlayList.updateMany({}, { $pull: { video: videoId } });
    await User.updateMany({}, { $pull: { watchHistory: videoId } });

    await deleteOldImage({file: video.thumbnail})
    await deleteOldImage({file: video.videoFile}, "video")

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "video deleted successfully")
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!mongoose.isValidObjectId(videoId)) {
        throw new APIerror(400, "invalid or missing video id");
    }

    const video = await Video.findById(videoId)
    if(!video){
        throw new APIerror(404, "Video not found")
    }

    if(video.owner.toString() !== req.user?._id.toString()){
        throw new APIerror(403, "Not authorized to toggle publish status")
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: !(video.isPublished)
            },
        },
        {new: true}
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedVideo, "Toggled publish status successfully")
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    incrementVideoView,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
