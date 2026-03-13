import { Link, useLocation } from "react-router-dom"
import { useState } from "react"
import { useAuth } from "../../hooks/useAuth"
import {
    LayoutDashboard, Users, GraduationCap, ArrowUpCircle, Settings,
    Upload, ClipboardList, Film, Newspaper, Image, ChevronDown, ChevronRight, Menu, X
} from "lucide-react"

const navGroups = [
    {
        label: "Overview",
        items: [
            { path: "/", label: "Dashboard", icon: LayoutDashboard },
        ]
    },
    {
        label: "People",
        items: [
            { path: "/admins", label: "Admins", icon: Users },
            { path: "/students", label: "Students", icon: GraduationCap },
            { path: "/students/promote", label: "Promotion", icon: ArrowUpCircle },
        ]
    },
    {
        label: "Academics",
        items: [
            { path: "/academic-setup", label: "Setup", icon: Settings },
            { path: "/upload-scores", label: "Upload Scores", icon: Upload },
            { path: "/results-manager", label: "Results", icon: ClipboardList },
        ]
    },
    {
        label: "Website",
        items: [
            { path: "/content", label: "Content", icon: Film },
            { path: "/news", label: "News", icon: Newspaper },
            { path: "/galleries", label: "Galleries", icon: Image },
        ]
    },
]

export function Sidebar() {
    const location = useLocation()
    const { user } = useAuth()
    const [isOpen, setIsOpen] = useState(false)
    const [collapsedGroups, setCollapsedGroups] = useState({})

    const toggleGroup = (label) => {
        setCollapsedGroups(prev => ({ ...prev, [label]: !prev[label] }))
    }

    const isActive = (path) => {
        if (path === "/") return location.pathname === "/"
        return location.pathname.startsWith(path)
    }

    return (
        <>
            {/* Mobile toggle */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed top-4 left-4 z-40 md:hidden p-2 rounded-lg bg-white shadow-md border border-gray-200"
            >
                {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <aside
                className={`${
                    isOpen ? "translate-x-0" : "-translate-x-full"
                } fixed md:relative md:translate-x-0 left-0 top-0 h-screen w-60 bg-white border-r border-gray-200 pt-16 md:pt-0 transition-transform duration-200 z-30 overflow-y-auto`}
            >
                {/* Logo area */}
                <div className="px-5 py-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <img src="/logo.webp" alt="MOLEK" className="h-9 w-9 rounded-lg" />
                        <div>
                            <p className="text-sm font-bold text-gray-900 leading-tight">MOLEK</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">School Admin</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="px-3 py-4 space-y-1">
                    {navGroups.map((group) => (
                        <div key={group.label} className="mb-2">
                            {/* Group header */}
                            <button
                                onClick={() => toggleGroup(group.label)}
                                className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors"
                            >
                                <span>{group.label}</span>
                                {collapsedGroups[group.label] ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                            </button>

                            {/* Group items */}
                            {!collapsedGroups[group.label] && (
                                <div className="space-y-0.5">
                                    {group.items.map((item) => {
                                        const Icon = item.icon
                                        const active = isActive(item.path)
                                        return (
                                            <Link
                                                key={item.path}
                                                to={item.path}
                                                onClick={() => setIsOpen(false)}
                                                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                                    active
                                                        ? "bg-blue-50 text-blue-700 border-l-[3px] border-blue-600 ml-0"
                                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                                }`}
                                            >
                                                <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
                                                <span>{item.label}</span>
                                            </Link>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </nav>

                {/* User info at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-bold text-blue-700">
                                {(user?.full_name || user?.username || "A").charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{user?.full_name || user?.username}</p>
                            <p className="text-[11px] text-gray-500 capitalize">{user?.role || "admin"}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile overlay */}
            {isOpen && <div className="fixed inset-0 bg-black/30 md:hidden z-20" onClick={() => setIsOpen(false)} />}
        </>
    )
}