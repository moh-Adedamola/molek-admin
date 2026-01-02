import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { studentsAPI, classLevelsAPI } from "../api/endpoints";
import { Table } from "../components/ui/Table";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";

export function StudentsList() {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [classLevels, setClassLevels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [classFilter, setClassFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("active");
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, studentId: null });
    const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });

    useEffect(() => {
        fetchStudents();
        fetchClassLevels();
        fetchStats();
    }, [search, classFilter, statusFilter]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const params = {};
            if (search) params.search = search;
            if (classFilter !== "all") params.class_level = classFilter;
            if (statusFilter !== "all") params.is_active = statusFilter === "active";

            const response = await studentsAPI.list(params);
            setStudents(response.data.results || response.data || []);
        } catch (error) {
            console.error("Failed to fetch students:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchClassLevels = async () => {
        try {
            const response = await classLevelsAPI.list();
            setClassLevels(response.data.results || response.data || []);
        } catch (error) {
            console.error("Failed to fetch class levels:", error);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await studentsAPI.stats();
            setStats(response.data);
        } catch (error) {
            console.error("Failed to fetch stats:", error);
        }
    };

    const handleDelete = async () => {
        try {
            await studentsAPI.delete(deleteModal.studentId);
            setStudents(students.filter((s) => s.id !== deleteModal.studentId));
            setDeleteModal({ isOpen: false, studentId: null });
            fetchStats();
        } catch (error) {
            console.error("Failed to delete student:", error);
        }
    };

    const handleExportCSV = async () => {
        try {
            const response = await studentsAPI.exportCSV();
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'students_export.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Failed to export CSV:", error);
        }
    };

    // ✅ NEW: Export for CBT with credentials
    const handleExportForCBT = async () => {
        try {
            const response = await studentsAPI.exportForCBT();
            const credentials = response.data;

            // Create CSV with credentials
            const csvContent = [
                ['Admission Number', 'Password', 'Full Name', 'Class Level', 'Session'].join(','),
                ...credentials.map(student => [
                    student.admission_number,
                    student.password,
                    student.full_name,
                    student.class_level,
                    student.session
                ].join(','))
            ].join('\n');

            // Download as CSV
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'cbt_credentials.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Failed to export CBT credentials:", error);
            alert("Failed to export credentials. Please try again.");
        }
    };

    const columns = [
        {
            key: "admission_number",
            label: "Admission No.",
            render: (value, row) => (
                <div className="flex items-center gap-2">
                    <span className="text-2xl">🎓</span>
                    <button
                        onClick={() => navigate(`/students/${row.id}/edit`)}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                    >
                        {value}
                    </button>
                </div>
            ),
        },
        {
            key: "full_name",
            label: "Full Name",
            render: (value, row) => value || `${row.first_name} ${row.middle_name ? row.middle_name + ' ' : ''}${row.last_name}`,
        },
        {
            key: "class_level",
            label: "Class",
            render: (value, row) => (
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full px-3 py-1 text-sm font-semibold">
          {value?.name || row.class_name || row.class_display || 'N/A'}
        </span>
            ),
        },
        {
            key: "gender",
            label: "Gender",
            render: (value) => value === 'M' ? '👨 Male' : '👩 Female',
        },
        {
            key: "date_of_birth",
            label: "Date of Birth",
            render: (value) => new Date(value).toLocaleDateString(),
        },
        {
            key: "is_active",
            label: "Status",
            render: (value) => (
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${
                    value
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                }`}>
          {value ? '✓ Active' : '✗ Inactive'}
        </span>
            ),
        },
        {
            key: "id",
            label: "Actions",
            render: (value, row) => (
                <div className="flex gap-2">
                    <Button size="sm" onClick={() => navigate(`/students/${value}/edit`)}>
                        Edit
                    </Button>
                    <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setDeleteModal({ isOpen: true, studentId: value })}
                    >
                        Delete
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Student Management</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {stats.total} students • {stats.active} active • {stats.inactive} inactive
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={handleExportCSV}>
                        📥 Export CSV
                    </Button>
                    {/* ✅ NEW: CBT Export Button */}
                    <Button variant="outline" onClick={handleExportForCBT}>
                        🔑 Export for CBT
                    </Button>
                    <Button variant="secondary" onClick={() => navigate("/students/bulk-upload")}>
                        📤 Bulk Upload
                    </Button>
                    <Button onClick={() => navigate("/students/create")}>
                        Add Student +
                    </Button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <Input
                    placeholder="Search students..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1"
                />
                <select
                    value={classFilter}
                    onChange={(e) => setClassFilter(e.target.value)}
                    className="px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                    <option value="all">All Classes</option>
                    {classLevels.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                            {cls.name}
                        </option>
                    ))}
                </select>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
            </div>

            <Table columns={columns} data={students} loading={loading} />

            <Modal
                isOpen={deleteModal.isOpen}
                title="Delete Student?"
                onClose={() => setDeleteModal({ isOpen: false, studentId: null })}
                actions={[
                    { label: "Cancel", onClick: () => setDeleteModal({ isOpen: false, studentId: null }) },
                    { label: "Delete", variant: "danger", onClick: handleDelete },
                ]}
            >
                <p className="text-gray-600 dark:text-gray-400">
                    Are you sure you want to delete this student? This action will set the student as inactive.
                </p>
            </Modal>
        </div>
    );
}