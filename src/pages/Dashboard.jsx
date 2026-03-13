import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { contentAPI, galleriesAPI, adminsAPI, studentsAPI } from "../api/endpoints";
import { GraduationCap, Users, Newspaper, Film, Upload, ClipboardList, Settings, ArrowRight } from "lucide-react";

export function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({ admins: 0, students: 0, content: 0, galleries: 0, news: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchStats(); }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const [adminsRes, studentsRes, contentRes, galleriesRes] = await Promise.all([
                adminsAPI.stats(),
                studentsAPI.stats(),
                contentAPI.stats(),
                galleriesAPI.stats().catch(() => ({ data: { total: 0 } })),
            ]);
            setStats({
                admins: adminsRes.data.total || 0,
                students: studentsRes.data.total || 0,
                content: contentRes.data.total_content || 0,
                galleries: galleriesRes.data.total || galleriesRes.data.total_galleries || 0,
                news: contentRes.data.total_news || 0,
            });
        } catch (error) {
            console.error("Failed to fetch stats:", error);
        } finally { setLoading(false); }
    };

    const statCards = [
        { label: "Students", value: stats.students, icon: GraduationCap, color: "bg-blue-600", lightBg: "bg-blue-50", textColor: "text-blue-700" },
        { label: "Admins", value: stats.admins, icon: Users, color: "bg-emerald-600", lightBg: "bg-emerald-50", textColor: "text-emerald-700" },
        { label: "News", value: stats.news, icon: Newspaper, color: "bg-amber-600", lightBg: "bg-amber-50", textColor: "text-amber-700" },
        { label: "Content", value: stats.content, icon: Film, color: "bg-purple-600", lightBg: "bg-purple-50", textColor: "text-purple-700" },
    ];

    const workflowSteps = [
        { step: 1, title: "Set up academics", description: "Create sessions, terms, and class levels", path: "/academic-setup", icon: Settings, done: true },
        { step: 2, title: "Add students", description: "Upload student list via CSV or add manually", path: "/students", icon: GraduationCap },
        { step: 3, title: "Upload scores", description: "Upload CA, OBJ, and Theory scores in one CSV", path: "/upload-scores", icon: Upload },
        { step: 4, title: "View results", description: "Check grades, positions, and cumulative scores", path: "/results-manager", icon: ClipboardList },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Welcome */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    Welcome back, {user?.full_name || user?.username}
                </h1>
                <p className="text-sm text-gray-500 mt-1">Here's what's happening with your school</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                                <div className={`${card.lightBg} p-2 rounded-lg`}>
                                    <Icon size={18} className={card.textColor} />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{loading ? "—" : card.value}</p>
                            <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
                        </div>
                    );
                })}
            </div>

            {/* Workflow Guide */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Getting started</h2>
                <p className="text-sm text-gray-500 mb-5">Follow these steps to manage your school's academic records</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {workflowSteps.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.step}
                                onClick={() => navigate(item.path)}
                                className="text-left p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                                        {item.step}
                                    </span>
                                    <Icon size={16} className="text-gray-400 group-hover:text-blue-600" />
                                </div>
                                <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-700">{item.title}</p>
                                <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                    { label: "Upload scores", desc: "Upload all scores in one CSV", path: "/upload-scores", icon: Upload },
                    { label: "View results", desc: "Check grades and positions", path: "/results-manager", icon: ClipboardList },
                    { label: "Add students", desc: "Bulk upload or add manually", path: "/students", icon: GraduationCap },
                ].map((action) => {
                    const Icon = action.icon;
                    return (
                        <button
                            key={action.path}
                            onClick={() => navigate(action.path)}
                            className="bg-white rounded-xl border border-gray-200 p-5 text-left hover:border-blue-300 hover:shadow-sm transition-all group flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-gray-100 p-2.5 rounded-lg group-hover:bg-blue-50">
                                    <Icon size={18} className="text-gray-600 group-hover:text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">{action.label}</p>
                                    <p className="text-xs text-gray-500">{action.desc}</p>
                                </div>
                            </div>
                            <ArrowRight size={16} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                        </button>
                    );
                })}
            </div>
        </div>
    );
}