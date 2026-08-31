import axios from "axios";

// This is the ONE place we point to our backend.
// Set VITE_API_BASE_URL in .env to point somewhere else (e.g. a deployed API).
// Falls back to the backend's default local port (see backend/.env.example).
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // needed so the backend's login cookies get sent/stored
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config;
    if (error.response?.status !== 401 || request?._retried || request?.url === "/users/refresh-token") {
      return Promise.reject(error);
    }
    request._retried = true;
    try {
      await api.post("/users/refresh-token");
      return api(request);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  },
);

export default api;
