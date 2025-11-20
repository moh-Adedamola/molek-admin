import { Link, useLocation } from "react-router-dom"
import { useState } from "react"
import { useAuth } from "../../hooks/useAuth"

export function Sidebar() {
  const location = useLocation()
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(true)

  const canAccess = (requiredRoles) => {
    return requiredRoles.includes(user?.role)
  }

  const navItems = [
    { 
      path: "/", 
      label: "Dashboard", 
      icon: "🏠", 
      roles: ["admin", "superadmin"] 
    },
    { 
      path: "/admins", 
      label: "Admins", 
      icon: "👥", 
      roles: ["admin", "superadmin"] 
    },
    { 
      path: "/content", 
      label: "Content", 
      icon: "🎥", 
      roles: ["admin", "superadmin"] 
    },
    { 
      path: "/news", 
      label: "News", 
      icon: "📰", 
      roles: ["admin", "superadmin"] 
    },
    { 
      path: "/galleries", 
      label: "Galleries", 
      icon: "🖼️", 
      roles: ["admin", "superadmin"] 
    },
  ]

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-40 md:hidden p-2 rounded-lg bg-blue-500 text-white"
      >
        ☰
      </button>

      <aside
        className={`${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } fixed md:relative md:translate-x-0 left-0 top-0 h-screen w-64 bg-white dark:bg-gray-800 border-r-2 border-gray-200 dark:border-gray-700 pt-20 md:pt-0 transition-transform duration-300 z-30`}
      >
        <nav className="p-4 space-y-2">
          {navItems.map(
            (item) =>
              canAccess(item.roles) && (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${
                    location.pathname === item.path
                      ? "bg-blue-500 text-white shadow-lg"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ),
          )}
        </nav>
      </aside>

      {isOpen && <div className="fixed inset-0 bg-black/50 md:hidden z-20" onClick={() => setIsOpen(false)} />}
    </>
  )
}