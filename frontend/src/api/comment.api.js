import api from "./axios";

export const getComments = (videoId, params) => api.get(`/comments/${videoId}`, { params });
export const addComment = (videoId, content) => api.post(`/comments/${videoId}`, { content });
export const updateComment = (commentId, content) => api.patch(`/comments/c/${commentId}`, { content });
export const deleteComment = (commentId) => api.delete(`/comments/c/${commentId}`);
