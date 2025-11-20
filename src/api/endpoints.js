import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://molek-school-backend-production.up.railway.app";

console.log("🌐 API_BASE URL:", API_BASE);

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token && token !== "undefined") {
    const authHeader = token.startsWith("eyJ") ? `Bearer ${token}` : `Token ${token}`;
    config.headers["Authorization"] = authHeader;
  }
  return config;
});

// Handle token expiration and refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const refreshToken = localStorage.getItem("refreshToken");

    if (
      error.response?.status === 401 &&
      refreshToken &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        const res = await axios.post(`${API_BASE}/api/token/refresh/`, {
          refresh: refreshToken,
        });
        const newAccessToken = res.data.access;
        localStorage.setItem("accessToken", newAccessToken);
        const authHeader = newAccessToken.startsWith("eyJ") ? `Bearer ${newAccessToken}` : `Token ${newAccessToken}`;
        api.defaults.headers.common["Authorization"] = authHeader;
        originalRequest.headers["Authorization"] = authHeader;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.clear();
        window.location.href = "/login";
      }
    }

    // If no refresh token or other 401/403, clear and redirect
    if ([401, 403].includes(error.response?.status)) {
      localStorage.clear();
      delete api.defaults.headers.common["Authorization"];
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

// ============================================
// 🔐 AUTHENTICATION API
// ============================================
export const authAPI = {
  login: async (username, password) => {
    const response = await api.post("/api/token/", { username, password });
    
    let accessToken, refreshToken;
    const data = response.data;
    
    console.log("Login Response Data:", data);
    
    if (data.access && data.refresh) {
      // Standard SimpleJWT
      accessToken = data.access;
      refreshToken = data.refresh;
    } else if (data.token) {
      // DRF TokenAuth
      accessToken = data.token.replace(/^Token\s+/, "");
      refreshToken = null;
    } else {
      throw new Error("Unexpected login response format: " + JSON.stringify(data));
    }
    
    // Validate token
    if (!accessToken || accessToken === "undefined") {
      throw new Error("Invalid access token received from server");
    }
    
    // Store tokens
    localStorage.setItem("accessToken", accessToken);
    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    }
    
    // Set header
    const authHeader = data.token ? `Token ${accessToken}` : `Bearer ${accessToken}`;
    api.defaults.headers.common["Authorization"] = authHeader;
    
    return response;
  },

  logout: () => {
    localStorage.clear();
    delete api.defaults.headers.common["Authorization"];
  },

  changePassword: async (oldPassword, newPassword) => {
    return api.post("/api/users/profile/change-password/", { 
      old_password: oldPassword, 
      new_password: newPassword 
    });
  },
};

// ============================================
// 👥 ADMIN MANAGEMENT API
// ============================================
export const adminsAPI = {
  list: (params = {}) => api.get("/api/admins/", { params }),
  get: (id) => api.get(`/api/admins/${id}/`),
  create: (data) => api.post("/api/admins/", data, {
    headers: { "Content-Type": "application/json" },
  }),
  update: (id, data) => api.put(`/api/admins/${id}/`, data, {
    headers: { "Content-Type": "application/json" },
  }),
  delete: (id) => api.delete(`/api/admins/${id}/`),
  stats: () => api.get("/api/admins/stats/"),
};

// ============================================
// 📚 CONTENT API (Images, Videos, News)
// ============================================
export const contentAPI = {
  list: (params = {}) => api.get("/api/content/", { params }),
  get: (id) => api.get(`/api/content/${id}/`),
  create: (formData) => {
    // formData is already FormData from the component
    return api.post("/api/content/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  update: (id, formData) => {
    // formData is already FormData from the component
    return api.put(`/api/content/${id}/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  delete: (id) => api.delete(`/api/content/${id}/`),
  publicList: (params = {}) => api.get("/api/content/public/", { params }),
  stats: () => api.get("/api/content/stats/"),
};

// ============================================
// 🖼️ GALLERY API
// ============================================
export const galleriesAPI = {
  list: (params = {}) => api.get("/api/galleries/", { params }),
  get: (id) => api.get(`/api/galleries/${id}/`),
  create: (formData) => api.post("/api/galleries/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
  update: (id, formData) => api.put(`/api/galleries/${id}/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
  delete: (id) => api.delete(`/api/galleries/${id}/`),
};

// ============================================
// 👤 PROFILE API
// ============================================
export const profileAPI = {
  getCurrent: async () => {
    try {
      const response = await api.get("/api/users/profile/");
      return response.data;
    } catch (error) {
      console.error("Failed to fetch current profile:", error);
      throw error;
    }
  },
  update: (data) => api.put("/api/users/profile/", data, {
    headers: { "Content-Type": "application/json" },
  }),
};

export default api;