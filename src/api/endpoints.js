import axios from "axios";

// --- Base URL ---
const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://molek-school-backend-production.up.railway.app";

console.log("🌐 API_BASE URL:", API_BASE);

// --- Utility: get cookie value ---
export function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

// --- Axios instance ---
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // ✅ include cookies in every request
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// --- Request Interceptor: attach CSRF dynamically ---
api.interceptors.request.use((config) => {
  const token = getCookie("csrftoken");
  if (token && ["post", "put", "patch", "delete"].includes(config.method)) {
    config.headers["X-CSRFToken"] = token;
  }
  return config;
});

// --- Response Interceptor: handle auth/session errors globally ---
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if ([401, 403].includes(error.response?.status)) {
      console.warn("🚫 Session invalid. Redirecting to /login ...");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ===========================
// 🔐 AUTH API
// ===========================
export const authAPI = {
  // --- Fetch CSRF Token ---
  getCsrfToken: async () => {
    try {
      console.log("🔹 Fetching CSRF token...");
      const res = await fetch(`${API_BASE}/api/csrf/`, {
        method: "GET",
        credentials: "include", // ✅ necessary for cookies
      });

      if (!res.ok) throw new Error(`CSRF fetch failed (${res.status})`);
      const data = await res.json();

      console.log("✅ CSRF cookie set:", data);
      const csrfToken =
        data.csrftoken ||
        (document.cookie.match(/csrftoken=([^;]+)/) || [])[1] ||
        null;

      if (!csrfToken) console.warn("⚠️ CSRF token missing in cookies!");
      return csrfToken;
    } catch (error) {
      console.error("❌ Failed to fetch CSRF:", error.message);
      throw error;
    }
  },

  // --- Login ---
  login: async (username, password) => {
    try {
      // Step 1: Ensure CSRF cookie is set
      const csrfToken = await authAPI.getCsrfToken();
      console.log("🧩 Using CSRF Token:", csrfToken);

      // Step 2: Prepare credentials
      const params = new URLSearchParams();
      params.append("username", username);
      params.append("password", password);

      // Step 3: Perform login
      const response = await api.post("/admin/login/", params, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-CSRFToken": csrfToken,
        },
        withCredentials: true,
        responseType: "text",
      });

      console.log("✅ Login response:", response.status);
      return response;
    } catch (error) {
      console.error("❌ Login error:", error);
      throw error;
    }
  },

  changePassword: (oldPassword, newPassword) => {
    const params = new URLSearchParams();
    params.append("old_password", oldPassword);
    params.append("new_password1", newPassword);
    params.append("new_password2", newPassword);
    return api.post("/admin/password_change/", params, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
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
    Object.keys(data).forEach((key) => {
      formData.append(key, data[key]);
    });
    return api.post("/api/userprofile/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  update: (id, data) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (data[key] !== null && data[key] !== undefined) {  // Avoid appending null/undefined
        formData.append(key, data[key]);
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
    Object.keys(data).forEach((key) => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    return api.post("/api/students/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  update: (id, data) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
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
  // Admin CRUD (like users)
  list: (params = {}) => api.get("/api/contentitem/", { params }),  // ?content_type=image&search=math
  get: (id) => api.get(`/api/contentitem/${id}/`),
  create: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (data[key] !== null && data[key] !== undefined) formData.append(key, data[key]);
    });
    return api.post("/api/contentitem/", formData, { headers: { "Content-Type": "multipart/form-data" } });
  },
  update: (id, data) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (data[key] !== null && data[key] !== undefined) formData.append(key, data[key]);
    });
    return api.put(`/api/contentitem/${id}/`, formData, { headers: { "Content-Type": "multipart/form-data" } });
  },
  delete: (id) => api.delete(`/api/contentitem/${id}/`),

  // Fetch/Public (your existing)
  publicList: () => api.get("/molek/content/public/"),  // Unauth fetch
  listCreate: (params = {}) => api.get("/molek/content/", { params }),  // Teacher list + create
  detail: (id) => api.get(`/molek/content/${id}/`),  // Detail/fetch single
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
