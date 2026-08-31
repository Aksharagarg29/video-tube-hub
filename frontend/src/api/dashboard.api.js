import api from "./axios";

export const getChannelStats = () => api.get("/dashboard/stats");
