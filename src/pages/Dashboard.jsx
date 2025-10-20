import { useEffect, useState } from "react"
import { useAuth } from "../hooks/useAuth"
import { usersAPI, studentsAPI, contentAPI } from "../api/endpoints"

export function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ users: 0, students: 0, content: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      try {
        const [usersRes, studentsRes, contentRes] = await Promise.all([
          usersAPI.list({ page_size: 1 }),  // Use DRF's page_size param for pagination; count will be total regardless
          studentsAPI.list({ page_size: 1 }),
          contentAPI.list({ page_size: 1 }),
        ])

        setStats({
          users: usersRes.data.count || 0,
          students: studentsRes.data.count || 0,
          content: contentRes.data.count ||  0,
        })
      } catch (error) {
        console.error("Failed to fetch stats:", error)
        setStats({ users: 0, students: 0, content: 0 })  // Fallback to 0
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 font-poppins mb-2">
          Hello, {user?.full_name || user?.username}! 
        </h1>
        <p className="text-gray-600">Welcome back to MOLEK Administration</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow h-48 flex flex-col justify-center">
          <div className="text-5xl mb-4">👥</div>
          <p className="text-gray-600 text-lg mb-2">Total Users</p>
          <p className="text-4xl font-bold text-blue-600">{loading ? "..." : stats.users}</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow h-48 flex flex-col justify-center">
          <div className="text-5xl mb-4">📚</div>
          <p className="text-gray-600 text-lg mb-2">Total Students</p>
          <p className="text-4xl font-bold text-blue-600">{loading ? "..." : stats.students}</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow h-48 flex flex-col justify-center">
          <div className="text-5xl mb-4">🎥</div>
          <p className="text-gray-600 text-lg mb-2">Total Content</p>
          <p className="text-4xl font-bold text-blue-600">{loading ? "..." : stats.content}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/users/create"
            className="p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
          >
            <div className="text-3xl mb-2">➕</div>
            <p className="font-semibold text-gray-900">Add New User</p>
          </a>
          <a
            href="/students/create"
            className="p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
          >
            <div className="text-3xl mb-2">➕</div>
            <p className="font-semibold text-gray-900">Add New Student</p>
          </a>
          <a
            href="/content/create"
            className="p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
          >
            <div className="text-3xl mb-2">➕</div>
            <p className="font-semibold text-gray-900">Add New Content</p>
          </a>
          <a
            href="/profile"
            className="p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
          >
            <div className="text-3xl mb-2">⚙️</div>
            <p className="font-semibold text-gray-900">View Profile</p>
          </a>
        </div>
      </div>
    </div>
  )
}