import axios from "axios"

// Utility to read cookies
export function getCookie(name) {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop().split(";").shift()
}

// Base URL from environment or fallback
const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://molek-school-backend-production.up.railway.app"
console.log("API_BASE URL:", API_BASE)

// Axios instance
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "X-CSRFToken": getCookie("csrftoken"),
  },
})

// Request interceptor to attach CSRF token dynamically
api.interceptors.request.use((config) => {
  if (['post', 'put', 'patch', 'delete'].includes(config.method) && !config.headers['X-CSRFToken']) {
    const csrfToken = getCookie("csrftoken")
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken
    }
  }
  return config
})

// Response interceptor to handle session errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 404 &&
        (error.config?.url?.includes('/accounts/profile/') || error.config?.url === '/')) {
      console.warn('Ignoring legacy 404 on', error.config.url)
      return Promise.resolve({ status: 200, data: {} })
    }
    if (error.response?.status === 403 || error.response?.status === 401) {
      window.location.href = "/login"
    }
    return Promise.reject(error)
  }
)

// Auth endpoints (session-based)
export const authAPI = {
  getCsrfToken: () => api.get("/api/csrf/"), // Custom CSRF endpoint
  login: (username, password) => {
    const params = new URLSearchParams()
    params.append("username", username)
    params.append("password", password)
    return api.post("/admin/login/", params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      responseType: "text",
    })
  },
  changePassword: (oldPassword, newPassword) => {
    const params = new URLSearchParams()
    params.append("old_password", oldPassword)
    params.append("new_password1", newPassword)
    params.append("new_password2", newPassword)
    return api.post("/admin/password_change/", params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
    })
  },
}

// Users endpoints
export const usersAPI = {
  list: (params = {}) => api.get("/api/userprofile/", { params }),
  get: (id) => api.get(`/admin/users/userprofile/${id}/`),
  update: (id, data) => api.put(`/admin/users/userprofile/${id}/change/`, data),
  delete: (id) => api.delete(`/admin/users/userprofile/${id}/delete/`),
}

// Students endpoints
export const studentsAPI = {
  list: (params = {}) => api.get("/api/students/", { params }),
  get: (id) => api.get(`/admin/users/student/${id}/`),
  update: (id, data) => {
    const formData = new FormData()
    Object.keys(data).forEach((key) => formData.append(key, data[key]))
    return api.put(`/admin/users/student/${id}/change/`, formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      },
    })
  },
  delete: (id) => api.delete(`/admin/users/students/${id}/delete/`),
}

// Content endpoints
export const contentAPI = {
  list: (params = {}) => api.get("/api/contentitem/", { params }),
  get: (id) => api.get(`/admin/content/contentitem/${id}/`),
  create: (data) => {
    const formData = new FormData()
    Object.keys(data).forEach((key) => formData.append(key, data[key]))
    return api.post("/admin/content/contentitem/add/", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      },
    })
  },
  update: (id, data) => {
    const formData = new FormData()
    Object.keys(data).forEach((key) => formData.append(key, data[key]))
    return api.put(`/admin/content/contentitem/${id}/change/`, formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      },
    })
  },
  delete: (id) => api.delete(`/admin/content/contentitem/${id}/delete/`),
}

// Profile check
export const profileAPI = {
  getCurrent: async () => {
    try {
      const response = await usersAPI.list({ limit: 1 })
      return response.data
    } catch (error) {
      if (error.response?.status === 403 || error.response?.status === 401) {
        throw new Error("Session invalid - re-login required")
      }
      throw error
    }
  },
}

export default api
