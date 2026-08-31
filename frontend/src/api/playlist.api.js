import api from "./axios";

// NOTE: the backend mounts this router at "/api/v1/playLists" (capital L) —
// see backend/src/app.js. Keep the casing here in sync with that.

export const getUserPlaylists = (userId) => api.get(`/playLists/user/${userId}`);
export const getPlaylistById = (playlistId) => api.get(`/playLists/${playlistId}`);
export const createPlaylist = (name, description) => api.post("/playLists", { name, description });
export const updatePlaylist = (playlistId, name, description) => api.patch(`/playLists/${playlistId}`, { name, description });
export const deletePlaylist = (playlistId) => api.delete(`/playLists/${playlistId}`);
export const addVideoToPlaylist = (playlistId, videoId) => api.patch(`/playLists/add/${videoId}/${playlistId}`);
export const removeVideoFromPlaylist = (playlistId, videoId) => api.patch(`/playLists/remove/${videoId}/${playlistId}`);
