import axios from "axios";

// --- Base URL ---
const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://molek-school-backend-production.up.railway.app";

console.log("🌐 API_BASE URL:", API_BASE);

// --- Axios instance ---
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// --- Attach token to every request ---
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// --- Handle 401/403 globally ---
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      localStorage.getItem("refreshToken")
    ) {
      originalRequest._retry = true;
      try {
        const refreshRes = await axios.post(`${API_BASE}/api/token/refresh/`, {
          refresh: localStorage.getItem("refreshToken"),
        });
        const newAccessToken = refreshRes.data.access;
        localStorage.setItem("accessToken", newAccessToken);
        api.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error("🔒 Token refresh failed:", refreshError);
        localStorage.clear();
        window.location.href = "/login";
      }
    }

    if ([401, 403].includes(error.response?.status)) {
      console.warn("🚫 Unauthorized. Redirecting to login...");
      localStorage.clear();
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

// ===========================
// 🔐 AUTH API
// ===========================
export const authAPI = {
  login: async (username, password) => {
    try {
      const response = await api.post("/api/token/", {
        username,
        password,
      });

      const { access, refresh } = response.data;
      localStorage.setItem("accessToken", access);
      localStorage.setItem("refreshToken", refresh);
      api.defaults.headers.common["Authorization"] = `Bearer ${access}`;

      return response;
    } catch (error) {
      console.error("❌ Login failed:", error);
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    delete api.defaults.headers.common["Authorization"];
  },
};

// ===========================
// 👥 USERS API
// ===========================
export const usersAPI = {
  list: (params = {}) => api.get("/api/userprofile/", { params }),
  get: (id) => api.get(`/api/userprofile/${id}/`),
  create: (data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, value);
      }
    });
    return api.post("/api/userprofile/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  update: (id, data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, value);
      }
    });
    return api.put(`/api/userprofile/${id}/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  delete: (id) => api.delete(`/api/userprofile/${id}/`),
};

// ===========================
// 🎓 STUDENTS API
// ===========================
export const studentsAPI = {
  list: (params = {}) => api.get("/api/students/", { params }),
  get: (id) => api.get(`/api/students/${id}/`),
  create: (data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, value);
      }
    });
    return api.post("/api/students/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  update: (id, data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, value);
      }
    });
    return api.put(`/api/students/${id}/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  delete: (id) => api.delete(`/api/students/${id}/`),
};

// ===========================
// 📚 CONTENT API
// ===========================
export const contentAPI = {
  list: (params = {}) => api.get("/api/contentitem/", { params }),
  get: (id) => api.get(`/api/contentitem/${id}/`),
  create: (data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, value);
      }
    });
    return api.post("/api/contentitem/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  update: (id, data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, value);
      }
    });
    return api.put(`/api/contentitem/${id}/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  delete: (id) => api.delete(`/api/contentitem/${id}/`),
  publicList: () => api.get("/molek/content/public/"),
  listCreate: (params = {}) => api.get("/molek/content/", { params }),
  detail: (id) => api.get(`/molek/content/${id}/`),
};

export const profileAPI = {
  getCurrent: async () => {
    try {
      const response = await usersAPI.list({ limit: 1 });
      return response.data;
    } catch (error) {
      if ([401, 403].includes(error.response?.status)) {
        throw new Error("Session invalid - re-login required");
      }
      throw error;
    }
  },
};

export default api;
