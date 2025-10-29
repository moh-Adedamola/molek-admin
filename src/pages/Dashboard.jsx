import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { usersAPI, studentsAPI, contentAPI, galleriesAPI } from "../api/endpoints";

export function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    users: 0,
    students: 0,
    content: 0,
    galleries: 0, // 👈 added
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const [usersRes, studentsRes, contentRes, galleriesRes] = await Promise.all([
          usersAPI.list({ page_size: 1 }),
          studentsAPI.list({ page_size: 1 }),
          contentAPI.list({ page_size: 1 }),
          galleriesAPI.list({ page_size: 1 }), // 👈 fetch gallery count
        ]);

        setStats({
          users: usersRes.data.count || 0,
          students: studentsRes.data.count || 0,
          content: contentRes.data.count || 0,
          galleries: galleriesRes.data.count || 0, // 👈
        });
      } catch (error) {
        console.error("Failed to fetch stats:", error);
        setStats({ users: 0, students: 0, content: 0, galleries: 0 }); // 👈 include galleries
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 font-poppins mb-2">
          Hello, {user?.full_name || user?.username}! 
        </h1>
        <p className="text-gray-600">Welcome back to MOLEK Administration</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
          <div className="text-5xl mb-4">🖼️</div> {/* Updated icon */}
          <p className="text-gray-600 text-lg mb-2">Total Galleries</p>
          <p className="text-4xl font-bold text-blue-600">{loading ? "..." : stats.galleries}</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow h-48 flex flex-col justify-center">
          <div className="text-5xl mb-4">🎥</div>
          <p className="text-gray-600 text-lg mb-2">Total Content</p>
          <p className="text-4xl font-bold text-blue-600">{loading ? "..." : stats.content}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl p-8 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <a
            href="/users/create"
            className="p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors flex flex-col items-center"
          >
            <div className="text-3xl mb-2">➕</div>
            <p className="font-semibold text-gray-900 text-center">Add New User</p>
          </a>
          <a
            href="/students/create"
            className="p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors flex flex-col items-center"
          >
            <div className="text-3xl mb-2">➕</div>
            <p className="font-semibold text-gray-900 text-center">Add New Student</p>
          </a>
          <a
            href="/galleries/create" // 👈 added
            className="p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors flex flex-col items-center"
          >
            <div className="text-3xl mb-2">🖼️</div>
            <p className="font-semibold text-gray-900 text-center">Add New Gallery</p>
          </a>
          <a
            href="/content/create"
            className="p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors flex flex-col items-center"
          >
            <div className="text-3xl mb-2">➕</div>
            <p className="font-semibold text-gray-900 text-center">Add New Content</p>
          </a>
        </div>
      </div>
    </div>
  );
}