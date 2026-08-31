import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";
import { Tweet } from "../models/tweet.model.js";
import { Video } from "../models/video.model.js";
import { APIerror } from "../utils/apiError.js";
import { requireObjectId } from "../utils/validation.js";
import { createNotification } from "./notification.service.js";

const entities = {
    video: { field: "video", label: "Video", model: Video },
    comment: { field: "comment", label: "Comment", model: Comment },
    tweet: { field: "tweet", label: "Tweet", model: Tweet },
};
const getEntity = (type) => {
    const entity = entities[type];
    if (!entity) throw new APIerror(400, "Unsupported like type");
    return entity;
};
const getFilter = (type, id, userId) => ({ [getEntity(type).field]: id, ...(userId && { likedBy: userId }) });

export const toggleLike = async ({ entityType, entityId, userId }) => {
    if (!userId) throw new APIerror(401, "User is not authenticated");
    const entity = getEntity(entityType);
    const id = requireObjectId(entityId, `${entityType} id`);
    const entityDoc = await entity.model.findById(id).select("owner");
    if (!entityDoc) throw new APIerror(404, `${entity.label} not found`);
    const filter = getFilter(entityType, id, userId);
    const existing = await Like.findOne(filter);
    let liked;
    if (existing) {
        await Like.deleteOne({ _id: existing._id });
        liked = false;
    } else {
        try {
            await Like.create(filter);
            liked = true;
            await createNotification({
                recipient: entityDoc.owner,
                sender: userId,
                type: "like",
                [entity.field]: id
            });
        }
        catch (error) { if (error?.code !== 11000) throw error; liked = true; }
    }
    return { liked, likeCount: await Like.countDocuments(getFilter(entityType, id)) };
};

export const getLikeStatus = async ({ entityType, entityId, userId }) => {
    const entity = getEntity(entityType);
    const id = requireObjectId(entityId, `${entityType} id`);
    if (!(await entity.model.exists({ _id: id }))) throw new APIerror(404, `${entity.label} not found`);
    const filter = getFilter(entityType, id);
    const liked = userId ? await Like.exists({ ...filter, likedBy: userId }) : false;
    return { liked: Boolean(liked), likeCount: await Like.countDocuments(filter) };
};