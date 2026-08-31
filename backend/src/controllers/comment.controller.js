import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Comment} from "../models/comment.model.js"
import {APIerror} from "../utils/apiError.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Like} from "../models/like.model.js"
import { createNotification } from "../services/notification.service.js";

const getVideoComments = asyncHandler(async (req, res) => {

    const { videoId } = req.params;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new APIerror(
            400,
            "invalid or missing video id"
        );
    }

    const { page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

    // Logged-in user may be undefined if this route
    // does not require authentication.
    const currentUserId = req.user?._id
        ? new mongoose.Types.ObjectId(req.user._id)
        : null;

    const commentAggregate = Comment.aggregate([

        // --------------------------------
        // COMMENTS FOR THIS VIDEO
        // --------------------------------

        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },

        // --------------------------------
        // COMMENT OWNER
        // --------------------------------

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

        // --------------------------------
        // GET ALL LIKES FOR THIS COMMENT
        // --------------------------------

        {
            $lookup: {
                from: "likes",
                let: {
                    commentId: "$_id"
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: [
                                    "$comment",
                                    "$$commentId"
                                ]
                            }
                        }
                    }
                ],
                as: "commentLikes"
            }
        },

        // --------------------------------
        // ADD LIKE COUNT
        // --------------------------------

        {
            $addFields: {
                likeCount: {
                    $size: "$commentLikes"
                }
            }
        },

        // --------------------------------
        // CHECK IF CURRENT USER LIKED IT
        // --------------------------------

        {
            $addFields: {
                isLiked: currentUserId
                    ? {
                        $gt: [
                            {
                                $size: {
                                    $filter: {
                                        input: "$commentLikes",
                                        as: "like",
                                        cond: {
                                            $eq: [
                                                "$$like.likedBy",
                                                currentUserId
                                            ]
                                        }
                                    }
                                }
                            },
                            0
                        ]
                    }
                    : false
            }
        },

        // --------------------------------
        // RESPONSE FIELDS
        // --------------------------------

        {
            $project: {
                content: 1,
                owner: 1,
                createdAt: 1,
                updatedAt: 1,
                likeCount: 1,
                isLiked: 1
            }
        }

    ]);

    const comments =
        await Comment.aggregatePaginate(
            commentAggregate,
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
                comments,
                "comments fetched successfully"
            )
        );
});

const addComment = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    if (!mongoose.isValidObjectId(videoId)) {
        throw new APIerror(400, "invalid or missing video id");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new APIerror(404, "video not found");
    }

    const {content} = req.body
    if(!content?.trim()){
        throw new APIerror(400, "content is required")
    }
    const comment = await Comment.create({
        content: content.trim(),
        video: videoId,
        owner: req.user?._id
    })
    if(!comment){
        throw new APIerror(404, "Something went wrong while publishing the comment")
    }

    await createNotification({
        recipient: video.owner,
        sender: req.user?._id,
        type: "comment",
        video: videoId,
        comment: comment._id
    });

    return res
    .status(200)
    .json(
        new ApiResponse(200, comment, "comment added successfully")
    )
    
})

const updateComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    if (!mongoose.isValidObjectId(commentId)) {
        throw new APIerror(400, "invalid or missing comment id");
    }
    
    const {content} = req.body
    if(!content?.trim()){
        throw new APIerror(400, "content is required")
    }

    const storedComment = await Comment.findById(commentId)

    if(!storedComment){
        throw new APIerror(404, "comment not found")
    }

    if(storedComment.owner.toString() !== req.user?._id.toString()){
        throw new APIerror(403, "not authorized to update this comment")
    }
    const updatedComment = await Comment.findByIdAndUpdate(
        commentId, 
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
        new ApiResponse(200, updatedComment, "Comment updated successfully")
    )
    
})

const deleteComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    if (!mongoose.isValidObjectId(commentId)) {
        throw new APIerror(400, "invalid or missing comment id");
    }

    const storedComment = await Comment.findById(commentId)
    if(!storedComment){
        throw new APIerror(404, "comment not found")
    }

    if(storedComment.owner.toString() !== req.user?._id.toString()){
        throw new APIerror(403, "not authorized to delete this comment")
    }
    await Comment.findByIdAndDelete(
        commentId
    )
    await Like.deleteMany({ comment: commentId });

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Comment deleted successfully")
    )
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }