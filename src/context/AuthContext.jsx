import { createContext, useState, useEffect } from "react";
import jwt_decode from "jwt-decode";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (token && token !== "undefined" && token.includes(".")) {  // Basic JWT check: has dots
          const decoded = jwt_decode(token, { header: true });  // header: true for safety (from search results)
          setUser(decoded);  // Assumes token payload has user info (e.g., { username, role, ... })
        } else {
          // Invalid token: clear it
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          setUser(null);
        }
      } catch (error) {
        console.error("Token decode error:", error);
        // Clear invalid token on decode failure
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = (userData, tokenType) => {
    setUser(userData);
    // Token handling already done in endpoints.js
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  const value = {
    user,
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