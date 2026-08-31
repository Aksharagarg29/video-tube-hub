import api from "./axios";

export const getVideo = (videoId) => api.get(`/videos/${videoId}`);
export const recordVideoView = (videoId) => api.post(`/videos/${videoId}/view`);
