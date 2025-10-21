import axios from "axios"

// --- Utility: get cookie value ---
export function getCookie(name) {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop().split(";").shift()
  return null
}

// --- Base URL ---
const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://molek-school-backend-production.up.railway.app"
console.log("🌐 API_BASE URL:", API_BASE)

// --- Axios instance ---
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // Important: send cookies with each request
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
})

// --- Request Interceptor: attach CSRF dynamically ---
api.interceptors.request.use((config) => {
  const token = getCookie("csrftoken")
  if (token && ["post", "put", "patch", "delete"].includes(config.method)) {
    config.headers["X-CSRFToken"] = token
  }
  return config
})

// --- Response Interceptor: handle auth/session errors globally ---
api.interceptors.response.use(
  (response) => response,
  (error) => {
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
  // --- Get CSRF Token ---
  getCsrfToken: async () => {
    try {
      const res = await api.get("/api/csrf/")
      console.log("✅ CSRF cookie set:", res.data)
      return res
    } catch (error) {
      console.error("❌ Failed to fetch CSRF:", error)
    }
  },

  // --- Login ---
  login: async (username, password) => {
    // Step 1: Clear old login data
    localStorage.removeItem("molekLogin_backendCookies")
    localStorage.removeItem("molekLogin_frontendCookies")
    localStorage.removeItem("molekLogin_attempt")
    localStorage.removeItem("molekLogin_debugError")

    // Step 2: Ensure CSRF cookie is set
    await authAPI.getCsrfToken()

    // Step 3: Fetch the token from cookies
    const csrfToken = getCookie("csrftoken")
    console.log("🧩 CSRF Token to send:", csrfToken)
    if (!csrfToken) console.warn("⚠️ CSRF token not found in cookies!")

    // Step 4: Prepare credentials
    const params = new URLSearchParams()
    params.append("username", username)
    params.append("password", password)

    // Step 5: Log cookies before sending (for debug)
    const frontendCookies = document.cookie
    console.log("🍪 Frontend cookies before login:", frontendCookies)
    localStorage.setItem("molekLogin_frontendCookies", frontendCookies)

    // Step 6: Perform login
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
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
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

export default api
