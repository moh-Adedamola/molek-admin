import { Link, useLocation } from "react-router-dom"
import { useEffect, useRef, useState } from "react"
import { useAuth } from "../../hooks/useAuth"
import { ChevronDown, ChevronRight, Menu, X } from "lucide-react"
import { navGroups, activeItem } from "./navItems"

export function Sidebar() {
    const location = useLocation()
    const { user } = useAuth()
    const [isOpen, setIsOpen] = useState(false)
    const [collapsedGroups, setCollapsedGroups] = useState({})
    const toggleRef = useRef(null)
    const navRef = useRef(null)
    const current = activeItem(location.pathname)

    const toggleGroup = (label) => setCollapsedGroups((prev) => ({ ...prev, [label]: !prev[label] }))

    // Phone menu: Escape closes it, focus moves into it and back to the button.
    useEffect(() => {
        if (!isOpen) return undefined
        navRef.current?.querySelector("a")?.focus()
        const onKey = (e) => { if (e.key === "Escape") { setIsOpen(false); toggleRef.current?.focus() } }
        document.addEventListener("keydown", onKey)
        return () => document.removeEventListener("keydown", onKey)
    }, [isOpen])

    return (
        <>
            {/* Mobile toggle */}
            <button
                ref={toggleRef}
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? "Close menu" : "Open menu"}
                aria-expanded={isOpen}
                aria-controls="admin-sidebar"
                className="fixed top-4 left-4 z-40 md:hidden p-2 rounded-lg bg-white shadow-md border border-gray-200"
            >
                {isOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
            </button>

            {/* Header, scrolling menu and footer stacked: the footer never covers menu items. */}
            <aside
                id="admin-sidebar"
                className={`${
                    isOpen ? "translate-x-0" : "-translate-x-full"
                } fixed md:relative md:translate-x-0 left-0 top-0 h-screen w-60 bg-white border-r border-gray-200 pt-16 md:pt-0 transition-transform duration-200 z-30 flex flex-col`}
            >
                {/* Logo area */}
                <div className="px-5 py-5 border-b border-gray-100 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <img src="/logo.webp" alt="MOLEK" className="h-10 w-auto object-contain" />
                        <div>
                            <p className="text-sm font-bold text-gray-900 leading-tight">MOLEK</p>
                            <p className="text-[11px] text-gray-600 uppercase tracking-wider">School Admin</p>
                        </div>
                    </div>
                </div>

                {/* Navigation (scrolls on its own) */}
                <nav ref={navRef} aria-label="Admin" className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-1">
                    {navGroups.map((group) => (
                        <div key={group.label} className="mb-2">
                            <button
                                type="button"
                                onClick={() => toggleGroup(group.label)}
                                aria-expanded={!collapsedGroups[group.label]}
                                className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-gray-900 transition-colors"
                            >
                                <span>{group.label}</span>
                                {collapsedGroups[group.label] ? <ChevronRight size={12} aria-hidden="true" /> : <ChevronDown size={12} aria-hidden="true" />}
                            </button>
                            {!collapsedGroups[group.label] && (
                                <div className="space-y-0.5">
                                    {group.items.map((item) => {
                                        const Icon = item.icon
                                        const active = current?.path === item.path
                                        return (
                                            <Link
                                                key={item.path}
                                                to={item.path}
                                                onClick={() => setIsOpen(false)}
                                                aria-current={active ? "page" : undefined}
                                                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                                    active
                                                        ? "bg-blue-50 text-blue-700 border-l-[3px] border-blue-600 ml-0"
                                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                                }`}
                                            >
                                                <Icon size={18} strokeWidth={active ? 2.5 : 1.8} aria-hidden="true" />
                                                <span>{item.label}</span>
                                            </Link>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </nav>

                {/* Signed-in user: part of the layout, not floating over the menu */}
                <div className="flex-shrink-0 p-4 border-t border-gray-100 bg-gray-50">
                    <p className="text-sm font-medium text-gray-900 truncate">{user?.full_name || user?.username}</p>
                    <p className="text-xs text-gray-600 capitalize">{user?.role || "admin"}</p>
                </div>
            </aside>

            {/* Mobile overlay */}
            {isOpen && <div className="fixed inset-0 bg-black/30 md:hidden z-20" onClick={() => setIsOpen(false)} aria-hidden="true" />}
        </>
    )
}
