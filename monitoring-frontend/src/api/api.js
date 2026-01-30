import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // 🔥 USE ENV
  withCredentials: true,                 // 🔥 REQUIRED for cookie auth
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

/* ================= RESPONSE INTERCEPTOR ================= */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;

      if (status === 401) {
        if (!window.location.pathname.startsWith("/login")) {
          window.location.href = "/login";
        }
      }

      return Promise.reject(error);
    }

    error.isNetworkError = true;
    return Promise.reject(error);
  }
);

export default api;
