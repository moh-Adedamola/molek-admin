import { useAuth } from "../../hooks/useAuth"
import { useNavigate } from "react-router-dom"
import { useState } from "react"

export function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showDropdown, setShowDropdown] = useState(false)

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <header className="bg-white border-b-2 border-gray-200 shadow-md">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <img src="/logo.webp" alt="Logo" className="h-12 w-auto" />
          <h1 className="text-2xl font-bold text-blue-600 font-poppins">MOLEK ADMINISTRATION</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-2xl">👤</span>
              <span className="font-semibold text-gray-700">
                {user?.full_name || user?.username}
              </span>
              <span className="text-lg">▼</span>
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                <button
                  onClick={() => {
                    navigate("/profile")
                    setShowDropdown(false)
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors"
                >
                  ⚙️ Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-600 transition-colors"
                >
                  👋 Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
