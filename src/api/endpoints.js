import axios from "axios"

// --- Utility to read CSRF cookie ---
export function getCookie(name) {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop().split(";").shift()
  return null
}

// --- Base URL ---
const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://molek-school-backend-production.up.railway.app"
console.log("🌐 API_BASE URL:", API_BASE)

// --- Axios instance ---
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    "Accept": "application/json",
    "Content-Type": "application/json",
  },
})

// --- CSRF Debugging Helper (optional) ---
const DEBUG_URL = `${API_BASE}/api/debug-cookies/`

const debugCookies = async () => {
  try {
    const res = await axios.get(DEBUG_URL, { withCredentials: true })
    console.log("🍪 Cookies seen by backend:", res.data)
    localStorage.setItem("molekLogin_backendCookies", JSON.stringify(res.data))
  } catch (err) {
    console.error("❌ Cookie debug failed:", err)
    localStorage.setItem("molekLogin_debugError", err.message || "Unknown error")
  }
}

// --- Request Interceptor (attach CSRF token dynamically) ---
api.interceptors.request.use((config) => {
  const csrfToken = getCookie("csrftoken")
  if (csrfToken && ["post", "put", "patch", "delete"].includes(config.method)) {
    config.headers["X-CSRFToken"] = csrfToken
  }
  return config
})

// --- Response Interceptor (handle session errors globally) ---
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 404 &&
      (error.config?.url?.includes("/accounts/profile/") || error.config?.url === "/")) {
      console.warn("⚠️ Ignoring legacy 404 on", error.config.url)
      return Promise.resolve({ status: 200, data: {} })
    }

    if ([401, 403].includes(error.response?.status)) {
      console.warn("🚫 Session invalid. Redirecting to /login ...")
      window.location.href = "/login"
    }

    return Promise.reject(error)
  }
)

// ===========================
// 🔐 AUTH API
// ===========================
export const authAPI = {
  // Get and set CSRF cookie
  getCsrfToken: async () => {
    try {
      const res = await api.get("/api/csrf/")
      console.log("✅ CSRF cookie set:", res.data)
      return res
    } catch (error) {
      console.error("❌ Failed to fetch CSRF:", error)
    }
  },

  // Login with Django session
  login: async (username, password) => {
    // Get CSRF first to ensure cookie is set
    await authAPI.getCsrfToken()

    const frontendCookies = document.cookie
    console.log("🍪 Frontend cookies before login:", frontendCookies)
    localStorage.setItem("molekLogin_frontendCookies", frontendCookies)

    await debugCookies()

    const csrfToken = getCookie("csrftoken")
    if (!csrfToken) console.warn("⚠️ CSRF token not found in cookies!")

    const params = new URLSearchParams()
    params.append("username", username)
    params.append("password", password)

    localStorage.setItem("molekLogin_attempt", JSON.stringify({
      username,
      timestamp: new Date().toISOString(),
    }))

    return api.post("/admin/login/", params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-CSRFToken": csrfToken,
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
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })
  },
}

// ===========================
// 👥 USERS API
// ===========================
export const usersAPI = {
  list: (params = {}) => api.get("/api/userprofile/", { params }),
  get: (id) => api.get(`/admin/users/userprofile/${id}/`),
  update: (id, data) => api.put(`/admin/users/userprofile/${id}/change/`, data),
  delete: (id) => api.delete(`/admin/users/userprofile/${id}/delete/`),
}

// ===========================
// 🎓 STUDENTS API
// ===========================
export const studentsAPI = {
  list: (params = {}) => api.get("/api/students/", { params }),
  get: (id) => api.get(`/admin/users/student/${id}/`),
  update: (id, data) => {
    const formData = new FormData()
    Object.keys(data).forEach((key) => formData.append(key, data[key]))
    return api.put(`/admin/users/student/${id}/change/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  },
  delete: (id) => api.delete(`/admin/users/students/${id}/delete/`),
}

// ===========================
// 📚 CONTENT API
// ===========================
export const contentAPI = {
  list: (params = {}) => api.get("/api/contentitem/", { params }),
  get: (id) => api.get(`/admin/content/contentitem/${id}/`),
  create: (data) => {
    const formData = new FormData()
    Object.keys(data).forEach((key) => formData.append(key, data[key]))
    return api.post("/admin/content/contentitem/add/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  },
  update: (id, data) => {
    const formData = new FormData()
    Object.keys(data).forEach((key) => formData.append(key, data[key]))
    return api.put(`/admin/content/contentitem/${id}/change/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  },
  delete: (id) => api.delete(`/admin/content/contentitem/${id}/delete/`),
}

// ===========================
// 🙋 PROFILE CHECK
// ===========================
export const profileAPI = {
  getCurrent: async () => {
    try {
      const response = await usersAPI.list({ limit: 1 })
      return response.data
    } catch (error) {
      if ([401, 403].includes(error.response?.status)) {
        throw new Error("Session invalid - re-login required")
      }
      throw error
    }
  },
}

// --- Debug Info (localStorage) ---
console.log("🧩 Frontend cookies:", localStorage.getItem("molekLogin_frontendCookies"))
console.log("🧩 Backend cookies:", JSON.parse(localStorage.getItem("molekLogin_backendCookies") || "{}"))
console.log("🧩 Login attempt:", JSON.parse(localStorage.getItem("molekLogin_attempt") || "{}"))
console.log("🧩 Debug error:", localStorage.getItem("molekLogin_debugError"))

export default api
