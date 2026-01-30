import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000", // backend port
  withCredentials: true,            // 🔥 REQUIRED for cookie auth
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

/* ================= RESPONSE INTERCEPTOR ================= */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // ✅ Backend responded with error
    if (error.response) {
      const { status } = error.response;

      // 🔐 Unauthorized → redirect ONLY if not already on login
      if (status === 401) {
        if (!window.location.pathname.startsWith("/login")) {
          window.location.href = "/login";
        }
      }

      return Promise.reject(error);
    }

    // 🌐 Network / backend down
    error.isNetworkError = true;
    return Promise.reject(error);
  }
);

export default api;
