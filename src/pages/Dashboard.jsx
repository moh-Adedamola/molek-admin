import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { contentAPI, galleriesAPI, adminsAPI } from "../api/endpoints";

export function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    admins: 0,
    content: 0,
    galleries: 0,
    news: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [adminsRes, contentRes, galleriesRes] = await Promise.all([
        adminsAPI.stats(),
        contentAPI.stats(),
        galleriesAPI.list({ page_size: 1 }),
      ]);

      setStats({
        admins: adminsRes.data.total || 0,
        content: contentRes.data.total_content || 0,
        galleries: (galleriesRes.data || []).length,
        news: contentRes.data.total_news || 0,
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      setStats({ admins: 0, content: 0, galleries: 0, news: 0 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white font-poppins mb-2">
          Welcome back, {user?.full_name || user?.username}! 👋
        </h1>
        <p className="text-gray-600 dark:text-gray-400">MOLEK Administration Dashboard</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow h-48 flex flex-col justify-center text-white">
          <div className="text-5xl mb-4">👥</div>
          <p className="text-blue-100 text-lg mb-2">Total Admins</p>
          <p className="text-4xl font-bold">{loading ? "..." : stats.admins}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow h-48 flex flex-col justify-center text-white">
          <div className="text-5xl mb-4">📰</div>
          <p className="text-purple-100 text-lg mb-2">Total News</p>
          <p className="text-4xl font-bold">{loading ? "..." : stats.news}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow h-48 flex flex-col justify-center text-white">
          <div className="text-5xl mb-4">🖼️</div>
          <p className="text-green-100 text-lg mb-2">Total Galleries</p>
          <p className="text-4xl font-bold">{loading ? "..." : stats.galleries}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow h-48 flex flex-col justify-center text-white">
          <div className="text-5xl mb-4">🎥</div>
          <p className="text-orange-100 text-lg mb-2">Total Content</p>
          <p className="text-4xl font-bold">{loading ? "..." : stats.content}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <a
            href="/admins/create"
            className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors flex flex-col items-center"
          >
            <div className="text-3xl mb-2">➕</div>
            <p className="font-semibold text-gray-900 dark:text-white text-center">Add New Admin</p>
          </a>
          <a
            href="/content/create"
            className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors flex flex-col items-center"
          >
            <div className="text-3xl mb-2">📰</div>
            <p className="font-semibold text-gray-900 dark:text-white text-center">Add News Article</p>
          </a>
          <a
            href="/galleries/create"
            className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors flex flex-col items-center"
          >
            <div className="text-3xl mb-2">🖼️</div>
            <p className="font-semibold text-gray-900 dark:text-white text-center">Add New Gallery</p>
          </a>
          <a
            href="/content/create"
            className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors flex flex-col items-center"
          >
            <div className="text-3xl mb-2">🎥</div>
            <p className="font-semibold text-gray-900 dark:text-white text-center">Add Media Content</p>
          </a>
        </div>
      </div>
    </div>
  );
}