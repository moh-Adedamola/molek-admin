import { useAuth } from "../../hooks/useAuth"
import { useNavigate } from "react-router-dom"
import { useState, useRef, useEffect } from "react"
import { LogOut, User, ChevronDown } from "lucide-react"

export function Header() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [showDropdown, setShowDropdown] = useState(false)
    const dropdownRef = useRef(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleLogout = () => {
        logout()
        navigate("/login")
    }

    return (
        <header className="bg-white border-b border-gray-200 h-14 flex-shrink-0">
            <div className="flex items-center justify-between h-full px-6">
                <div className="md:hidden" /> {/* Spacer for mobile hamburger */}

                <div className="flex-1" />

                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-xs font-bold text-blue-700">
                                {(user?.full_name || user?.username || "A").charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <span className="text-sm font-medium text-gray-700 hidden sm:block">
                            {user?.full_name || user?.username}
                        </span>
                        <ChevronDown size={14} className="text-gray-400" />
                    </button>

                    {showDropdown && (
                        <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1">
                            <button
                                onClick={() => { navigate("/profile"); setShowDropdown(false); }}
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                            >
                                <User size={14} />
                                Profile
                            </button>
                            <hr className="my-1 border-gray-100" />
                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                            >
                                <LogOut size={14} />
                                Sign out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}