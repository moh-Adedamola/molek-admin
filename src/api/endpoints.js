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
    const authHeader = token.startsWith("eyJ") ? `Bearer ${token}` : `Token ${token}`;  // JWT starts with 'eyJ'
    config.headers["Authorization"] = authHeader;
  }
  return config;
});

// Handle token expiration
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

    // If no refresh token (e.g., TokenAuth), or other 401/403, clear and redirect
    if ([401, 403].includes(error.response?.status)) {
      localStorage.clear();
      delete api.defaults.headers.common["Authorization"];
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

// 🔐 AUTH API
export const authAPI = {
  login: async (username, password) => {
    const response = await api.post("/api/token/", { username, password });
    
    // Handle different backend response formats
    let accessToken, refreshToken;
    const data = response.data;
    
    console.log("Login Response Data:", data);  // Temporary log for debugging
    
    if (data.access && data.refresh) {
      // Standard SimpleJWT
      accessToken = data.access;
      refreshToken = data.refresh;
    } else if (data.token) {
      // DRF TokenAuth (single token, no refresh)
      accessToken = data.token.replace(/^Token\s+/, "");  // Strip "Token " prefix if present
      refreshToken = null;
    } else if (data.access_token && data.refresh_token) {
      // Variant with underscores
      accessToken = data.access_token;
      refreshToken = data.refresh_token;
    } else {
      throw new Error("Unexpected login response format: " + JSON.stringify(data));
    }
    
    // Validate token is not undefined or invalid
    if (!accessToken || accessToken === "undefined") {
      throw new Error("Invalid access token received from server");
    }
    
    // Store tokens
    localStorage.setItem("accessToken", accessToken);
    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    }
    
    // Set header (use 'Token' for TokenAuth, 'Bearer' for JWT)
    const authHeader = data.token ? `Token ${accessToken}` : `Bearer ${accessToken}`;
    api.defaults.headers.common["Authorization"] = authHeader;
    
    return response;
  },

  logout: () => {
    localStorage.clear();
    delete api.defaults.headers.common["Authorization"];
  },

  changePassword: async (oldPassword, newPassword) => {
    return api.post("/api/change-password/", { 
      old_password: oldPassword, 
      new_password: newPassword 
    });
  },
};

// 👥 USERS API
export const usersAPI = {
  list: (params = {}) => api.get("/api/userprofile/", { params }),
  get: (id) => api.get(`/api/userprofile/${id}/`),
  create: (data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) formData.append(key, value);
    });
    return api.post("/api/userprofile/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  update: (id, data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) formData.append(key, value);
    });
    return api.put(`/api/userprofile/${id}/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  delete: (id) => api.delete(`/api/userprofile/${id}/`),
};

// 🎓 STUDENTS API
export const studentsAPI = {
  list: (params = {}) => api.get("/api/students/", { params }),
  get: (id) => api.get(`/api/students/${id}/`),
  create: (data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) formData.append(key, value);
    });
    return api.post("/api/students/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  update: (id, data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) formData.append(key, value);
    });
    return api.put(`/api/students/${id}/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  delete: (id) => api.delete(`/api/students/${id}/`),
};

// 📚 CONTENT API
export const contentAPI = {
  list: (params = {}) => api.get("/api/contentitem/", { params }),
  get: (id) => api.get(`/api/contentitem/${id}/`),
  create: (data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) formData.append(key, value);
    });
    return api.post("/api/contentitem/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  update: (id, data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) formData.append(key, value);
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
      const response = await api.get("/api/userprofile/");
      return [response.data]; 
    } catch (error) {
      console.error("Failed to fetch current profile:", error);
      return [];
    }
  },
  update: (data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) formData.append(key, value);
    });
    return api.put("/api/userprofile/", formData, { 
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export const galleriesAPI = {
  list: (params = {}) => axios.get(`${API_BASE}/molek/galleries/`, { params }),
  get: (id) => axios.get(`${API_BASE}/molek/galleries/${id}/`),
  create: (formData) => {
    const config = { 
      headers: { 
        "Content-Type": "multipart/form-data",
        "Authorization": `Bearer ${localStorage.getItem('accessToken') || ''}`
      } 
    };
    return axios.post(`${API_BASE}/molek/galleries/`, formData, config);
  },
  update: (id, formData) => {
    const config = { 
      headers: { 
        "Content-Type": "multipart/form-data",
        "Authorization": `Bearer ${localStorage.getItem('accessToken') || ''}` 
      } 
    };
    return axios.put(`${API_BASE}/molek/galleries/${id}/`, formData, config); 
  },
  delete: (id) => {
    const config = { 
      headers: { 
        "Authorization": `Bearer ${localStorage.getItem('accessToken') || ''}` 
      } 
    };
    return axios.delete(`${API_BASE}/molek/galleries/${id}/`, config); 
  },
};
export default api;