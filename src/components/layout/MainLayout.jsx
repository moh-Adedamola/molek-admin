import { Suspense, useEffect } from "react"
import { useLocation } from "react-router-dom"
import { pageTitle } from "./navItems"
import { Header } from "./Header"
import { Sidebar } from "./Sidebar"

export function MainLayout({ children }) {
  const { pathname } = useLocation()
  // A different browser-tab title for every page ("Students | MOLEK Admin").
  useEffect(() => { document.title = `${pageTitle(pathname)} | MOLEK Admin` }, [pathname])
  return (
    <div className="flex h-screen bg-background dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-4 md:p-8">
          {/* Sidebar and header stay put while a page's code loads */}
          <Suspense fallback={<p role="status" className="py-16 text-center text-gray-600">Loading…</p>}>{children}</Suspense>
        </main>
      </div>
    </div>
  )
}
