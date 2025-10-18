import { Header } from "./Header"
import { Sidebar } from "./Sidebar"

export function MainLayout({ children }) {
  return (
    <div className="flex h-screen bg-background dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  )
}
