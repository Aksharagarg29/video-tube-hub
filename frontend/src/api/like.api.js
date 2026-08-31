import api from "./axios";

const paths = { video: "v", comment: "c", tweet: "t" };
export const toggleLike = (entityType, entityId) => api.post(`/likes/toggle/${paths[entityType]}/${entityId}`);
export const getVideoLikeStatus = (videoId) => api.get(`/likes/status/v/${videoId}`);
