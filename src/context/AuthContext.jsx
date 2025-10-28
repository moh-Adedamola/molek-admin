import { createContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initAuth = () => {
      try {
        const token = localStorage.getItem("accessToken");

        if (token && token !== "undefined" && token.includes(".")) {
          const decoded = jwtDecode(token); // no need for { header: true }
          const storedUser = localStorage.getItem("user");

          // Prefer detailed stored user data from login if available
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          } else {
            setUser(decoded);
          }

          setIsAuthenticated(true);
        } else {
          // Invalid token, clear
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Token decode error:", error);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = (userData) => {
    // persist user immediately
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    isAuthenticated,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
