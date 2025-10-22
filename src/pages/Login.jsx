import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"
import { authAPI, profileAPI } from "../api/endpoints"
import { Button } from "../components/ui/Button"

export function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({ username: "", password: "" })

  const handleAdminLogin = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    console.log("Login attempt:", formData.username)
    console.log("Password length:", formData.password.length)

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters.")
      setLoading(false)
      return
    }

    try {
      // Step 1: GET /admin/login/ to set csrftoken cookie
      console.log("Fetching CSRF token...")
      await authAPI.getCsrfToken()
      
      // Step 2: POST to authenticate (Axios follows 302 to /admin/, returns 200 HTML)
      console.log("Sending login POST...")
      const response = await authAPI.login(formData.username, formData.password)
      
      console.log("Response status:", response.status)
      console.log("Response snippet:", response.data.substring(0, 500))  // For debugging HTML

      // Basic success check: 200 status (post-redirect from Django)
      if (response.status !== 200) {
        throw new Error(`Login failed with status ${response.status}`)
      }

      // Step 3: Verify session with a protected admin endpoint (replaces /accounts/profile/)
      console.log("Verifying session...")
      await profileAPI.getCurrent()  // GET /admin/users/userprofile/?limit=1 — succeeds if logged in
      
      console.log("Session verified! Setting auth state...")
      
      // Step 4: Update auth state and navigate (before any hook-side fetches)
      const user = { username: formData.username, role: 'admin' }
      login(user, 'admin-session')
      navigate("/")  // To Dashboard via routes.jsx — backend session cookie persists
    } catch (err) {
      console.error("Login error:", err)
      
      // Bypass legacy 404s (root / or /accounts/profile/)
      const isLegacy404 = err.response?.status === 404 && 
        (err.config?.url === '/' || err.config?.url?.includes('/accounts/profile/'));
      if (isLegacy404) {
        console.log("Bypassing legacy 404 on", err.config?.url || 'unknown' + "; proceeding to Dashboard.");
        const user = { username: formData.username, role: 'admin' }
        login(user, 'admin-session')
        navigate("/")
        setLoading(false)
        return
      }
      
      let errorMsg = "Login failed. Please check your credentials."
      
      if (err.response?.status === 403 || err.response?.status === 401) {
        errorMsg = "Invalid username or password."
      } else if (err.response?.status === 404 && !isLegacy404) {
        errorMsg = "Server endpoint not found. Check admin setup."
      } else if (err.message.includes("Network Error") || err.code === "ERR_NETWORK") {
        errorMsg = "Network error. Check your connection."
      } else if (typeof err.response?.data === 'string') {
        // Fallback: Scan Django HTML for errors
        const errorPhrases = [
          'Please enter a correct username and password',
          'Invalid username or password',
          'This password did not match'
        ]
        const found = errorPhrases.find(phrase => err.response.data.includes(phrase))
        if (found) errorMsg = found
      }
      
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm sm:max-w-md p-4 sm:p-6 md:p-8 border border-gray-200 dark:border-gray-700">
        <div className="text-center mb-6 sm:mb-8">
          <img src="/logo.webp" alt="Logo" className="h-12 sm:h-16 w-auto mx-auto mb-3 sm:mb-4" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white font-sans mb-1 sm:mb-2">
            MOLEK
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Admin Portal</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="space-y-3 sm:space-y-4">
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-gray-700 dark:text-gray-300">
              Username
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter admin username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              autoComplete="username"
              className="text-sm sm:text-base px-4 py-4 rounded-2xl border-2 transition-all shadow-sm hover:shadow-md dark:bg-gray-700 dark:text-white dark:border-gray-600 border-gray-200 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-gray-700 dark:text-gray-300">
              Password
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="password"
              placeholder="Enter password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              autoComplete="current-password"
              className="text-sm sm:text-base px-4 py-4 rounded-2xl border-2 transition-all shadow-sm hover:shadow-md dark:bg-gray-700 dark:text-white dark:border-gray-600 border-gray-200 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <Button type="submit" loading={loading} className="w-full text-sm sm:text-base py-2.5 sm:py-3">
            Admin Sign In 🚀
          </Button>
        </form>
      </div>
    </div>
  )
}