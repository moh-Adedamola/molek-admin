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
  e.preventDefault();
  setError("");
  setLoading(true);

  if (formData.password.length < 8) {
    setError("Password must be at least 8 characters.");
    setLoading(false);
    return;
  }

  try {
    const response = await authAPI.login(formData.username, formData.password);
    console.log("Stored accessToken:", localStorage.getItem("accessToken"));  // Temporary log to verify storage
    
    const profileResponse = await profileAPI.getCurrent();
    // Handle both array and single object response from Django
    const profile = Array.isArray(profileResponse) ? profileResponse[0] : profileResponse;

    const user = {
      username: formData.username,
      full_name: profile?.full_name || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || formData.username,
      role: profile?.role || "admin",
      id: profile?.id,
      email: profile?.email,
    };

    login(user, "jwt-session");
    navigate("/");
  } catch (err) {
    console.error("Login error:", err);
    let errorMsg = "Login failed. Please check your credentials.";

    if (err.response?.status === 403 || err.response?.status === 401) {
      errorMsg = "Invalid username or password.";
    } else if (err.message.includes("Network Error")) {
      errorMsg = "Network error. Check your connection.";
    } else if (err.message.includes("Invalid access token")) {
      errorMsg = "Server returned invalid token. Contact support.";
    }

    setError(errorMsg);
  } finally {
    setLoading(false);
  }
};



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm sm:max-w-md p-4 sm:p-6 md:p-8 border border-gray-200 dark:border-gray-700">
        <div className="text-center mb-6 sm:mb-8">
          <img src="/logo.webp" alt="Logo" className="h-12 sm:h-16 w-auto mx-auto mb-3 sm:mb-4" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white font-sans mb-1 sm:mb-2">
            MOLEK SCHOOLS
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