import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL 
console.log("API_BASE URL:", API_BASE);

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
  withCredentials: true,
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
});


// Request interceptor (no JWT for admin; use session cookies)
api.interceptors.request.use((config) => {
  // CSRF for POST (required for /admin/login/)
  if (['post', 'put', 'patch', 'delete'].includes(config.method) && !config.headers['X-CSRFToken']) {
    const csrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }
  }
  return config;
});

// Response interceptor (no 401 for admin session)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Swallow /accounts/profile/ or root / 404s if legacy
    if (error.response?.status === 404 && 
        (error.config?.url?.includes('/accounts/profile/') || error.config?.url === '/')) {
      console.warn('Ignoring legacy 404 on', error.config.url);
      return Promise.resolve({ status: 200, data: {} });  // Fake success to bypass
    }
    if (error.response?.status === 403 || error.response?.status === 401) {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// Auth endpoints (Admin session login only - no JWT)
export const authAPI = {
  getCsrfToken: () => {
    return api.get("/admin/login/", {
      responseType: 'text',
    });
  },
  login: (username, password) => {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);
    return api.post("/admin/login/", params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      responseType: 'text',
    });
  },
  changePassword: (oldPassword, newPassword) => {
    const params = new URLSearchParams();
    params.append('old_password', oldPassword);
    params.append('new_password1', newPassword);
    params.append('new_password2', newPassword);
    return api.post("/admin/password_change/", params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
    });
  },
};

// Users endpoints (/admin/users/userprofile/ - admin management)
export const usersAPI = {
  list: (params = {}) => api.get("/api/userprofile/", { params }),  // Line ~52: Full path, no root
  get: (id) => api.get(`/admin/users/userprofile/${id}/`),  // Line 54: Safe, ID-specific
  update: (id, data) => api.put(`/admin/users/userprofile/${id}/change/`, data),
  delete: (id) => api.delete(`/admin/users/userprofile/${id}/delete/`),
};

// Students endpoints (/admin/users/student/ - admin management)
export const studentsAPI = {
  list: (params = {}) => api.get("/api/students/", { params }),
  get: (id) => api.get(`/admin/users/student/${id}/`),
  update: (id, data) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => formData.append(key, data[key]));
    return api.put(`/admin/users/student/${id}/change/`, formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      },
    });
  },
  delete: (id) => api.delete(`/admin/users/students/${id}/delete/`),
};

// Content endpoints (/admin/content/contentitem/ - admin only)
export const contentAPI = {
  list: (params = {}) => api.get("/api/contentitem/", { params }),
  get: (id) => api.get(`/admin/content/contentitem/${id}/`),
  create: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => formData.append(key, data[key]));
    return api.post("/admin/content/contentitem/add/", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      },
    });
  },
  update: (id, data) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => formData.append(key, data[key]));
    return api.put(`/admin/content/contentitem/${id}/change/`, formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      },
    });
  },
  delete: (id) => api.delete(`/admin/content/contentitem/${id}/delete/`),
};

// Profile endpoints (admin profile)
export const profileAPI = {
  getCurrent: async () => {
    try {
      // Use users list as lightweight auth check (full admin path)
      const response = await usersAPI.list({ limit: 1 });
      return response.data;  // JSON or empty; 200 confirms session
    } catch (error) {
      if (error.response?.status === 403 || error.response?.status === 401) {
        throw new Error('Session invalid - re-login required');
      }
      throw error;
    }
  },
};

export default api;