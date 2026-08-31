import api from "./axios";

export const toggleSubscription = (channelId) => api.post(`/subscriptions/c/${channelId}`);
export const getChannelSubscribers = (channelId) => api.get(`/subscriptions/c/${channelId}`);
export const getSubscribedChannels = (userId) => api.get(`/subscriptions/u/${userId}`);
