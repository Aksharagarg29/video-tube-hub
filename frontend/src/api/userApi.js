import api from "./axios";

// -------------------------
// USER
// -------------------------

export async function updateAvatar(formData) {
  return api.patch("/users/avatar", formData);
}

export async function updateCoverImage(formData) {
  return api.patch("/users/cover-image", formData);
}

export async function updateAccountDetails(data) {
  return api.patch("/users/update-details", data);
}

export async function changePassword(data) {
  return api.post("/users/change-password", data);
}

// -------------------------
// VIDEOS
// -------------------------

export async function getChannelVideos(userId) {
  return api.get(`/videos?userId=${userId}`);
}

export async function publishVideo(formData) {
  return api.post("/videos", formData);
}

export async function togglePublishStatus(videoId) {
  return api.patch(`/videos/toggle/publish/${videoId}`);
}

export async function updateVideo(videoId, data) {
  return api.patch(`/videos/${videoId}`, data);
}