import { createContext, useState, useEffect, useCallback } from "react"
import { jwtDecode } from "jwt-decode"

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true"
  })

  // Initialize auth from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("access_token")
    const storedUser = localStorage.getItem("user")
    if (storedToken && storedUser) {
      const parsedUser = JSON.parse(storedUser)
      setUser(parsedUser)

      // Handle dummy admin session (no JWT decode)
      if (storedToken === 'admin-session') {
        setToken(storedToken)  // Flag only; no decode
      } else {
        // Real JWT case (if switching later)
        try {
          const decoded = jwtDecode(storedToken)
          const isExpired = decoded.exp * 1000 < Date.now()

          if (!isExpired) {
            setToken(storedToken)
          } else {
            localStorage.removeItem("access_token")
            localStorage.removeItem("user")
          }
        } catch (error) {
          console.error("Token decode error:", error)
          localStorage.removeItem("access_token")
          localStorage.removeItem("user")
        }
      }
    }
    setLoading(false)
  }, [])

  // Dark mode useEffect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
    localStorage.setItem("darkMode", darkMode)
  }, [darkMode])

  const login = useCallback((userData, accessToken) => {
    setUser(userData)
    setToken(accessToken)
    localStorage.setItem("access_token", accessToken)
    localStorage.setItem("user", JSON.stringify(userData))
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem("access_token")
    localStorage.removeItem("user")
    // Clear Django session cookie if needed
    document.cookie = "sessionid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
  }, [])

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => !prev)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        darkMode,
        login,
        logout: logout,  // Use 'logout' for consistency
        toggleDarkMode,
        isAuthenticated: !!token && !!user,  // Both token & user present
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}