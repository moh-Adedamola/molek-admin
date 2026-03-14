import { useEffect, useState, useCallback } from "react";
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
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [classFilter, setClassFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("active");
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, studentId: null });
    const [activateModal, setActivateModal] = useState({ isOpen: false, action: 'activate' });
    const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [message, setMessage] = useState(null);
    const pageSize = 25;

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 400);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => { setCurrentPage(1); }, [debouncedSearch, classFilter, statusFilter]);
    useEffect(() => { fetchStudents(); }, [debouncedSearch, classFilter, statusFilter, currentPage]);
    useEffect(() => { fetchClassLevels(); fetchStats(); }, []);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const params = { page: currentPage, page_size: pageSize };
            if (debouncedSearch) params.search = debouncedSearch;
            if (classFilter !== "all") params.class_level = classFilter;
            if (statusFilter !== "all") params.is_active = statusFilter === "active";
            const response = await studentsAPI.list(params);
            const data = response.data;
            if (data.results) { setStudents(data.results); setTotalCount(data.count || data.results.length); }
            else { const arr = Array.isArray(data) ? data : []; setStudents(arr); setTotalCount(arr.length); }
        } catch (error) { console.error("Failed to fetch students:", error); }
        finally { setLoading(false); }
    };

    const fetchClassLevels = async () => {
        try {
            const response = await classLevelsAPI.list();
            setClassLevels(response.data.results || response.data || []);
        } catch (error) { console.error("Failed to fetch class levels:", error); }
    };

    const fetchStats = async () => {
        try { const response = await studentsAPI.stats(); setStats(response.data); }
        catch (error) { console.error("Failed to fetch stats:", error); }
    };

    const handleDelete = async () => {
        try {
            await studentsAPI.delete(deleteModal.studentId);
            setStudents(students.filter((s) => s.id !== deleteModal.studentId));
            setDeleteModal({ isOpen: false, studentId: null });
            fetchStats();
        } catch (error) { console.error("Failed to delete student:", error); }
    };

    // Export CSV — filtered by class if selected
    const handleExportCSV = async () => {
        try {
            const params = {};
            if (classFilter !== "all") params.class_level = classFilter;
            const response = await studentsAPI.exportCSV(params);
            const className = classFilter !== "all" ? classLevels.find(c => c.id === parseInt(classFilter))?.name || 'class' : 'all';
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `students_${className}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) { console.error("Failed to export CSV:", error); }
    };

    // Export for CBT — filtered by class if selected
    const handleExportForCBT = async () => {
        try {
            const params = {};
            if (classFilter !== "all") {
                const cls = classLevels.find(c => c.id === parseInt(classFilter));
                if (cls) params.class_level = cls.name;
            }
            const response = await studentsAPI.exportForCBT(params);
            if (response.headers['content-type'] === 'text/csv') {
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a'); link.href = url;
                const className = classFilter !== "all" ? classLevels.find(c => c.id === parseInt(classFilter))?.name || '' : 'all';
                link.setAttribute('download', `students_cbt_${className}.csv`);
                document.body.appendChild(link); link.click(); link.remove();
            } else {
                const data = response.data;
                const csvContent = [
                    ['admission_number', 'first_name', 'middle_name', 'last_name', 'class_level', 'password_plain'].join(','),
                    ...data.map(s => [s.admission_number, s.first_name, s.middle_name || '', s.last_name, s.class_level || s.class_level_name, s.password || s.password_plain].join(','))
                ].join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a'); link.href = url;
                link.setAttribute('download', 'students_for_cbt.csv');
                document.body.appendChild(link); link.click(); link.remove();
            }
            setMessage({ type: 'success', text: 'CBT credentials exported successfully.' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to export CBT credentials.' });
        }
    };

    // Bulk activate/deactivate by class
    const handleBulkActivate = async (activate) => {
        if (classFilter === "all") {
            setMessage({ type: 'error', text: 'Please select a class first to bulk activate/deactivate.' });
            return;
        }
        try {
            const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://molek-school-backend-production.up.railway.app';
            const response = await fetch(`${baseUrl}/api/students/bulk-activate/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
                body: JSON.stringify({ class_level: parseInt(classFilter), activate })
            });
            const data = await response.json();
            if (response.ok) {
                setMessage({ type: 'success', text: data.message });
                fetchStudents();
                fetchStats();
            } else {
                setMessage({ type: 'error', text: data.error || 'Operation failed.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Could not connect to server.' });
        }
        setActivateModal({ isOpen: false, action: 'activate' });
    };

    const selectedClassName = classFilter !== "all" ? classLevels.find(c => c.id === parseInt(classFilter))?.name : null;
    const totalPages = Math.ceil(totalCount / pageSize);

    const columns = [
        {
            key: "admission_number", label: "Admission No.",
            render: (value, row) => (
                <div className="flex items-center gap-2">
                    {row.passport ? (
                        <img src={row.passport} alt="" className="w-8 h-8 rounded-full object-cover border border-gray-200" onError={(e) => { e.target.style.display = 'none'; }} />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                            {(row.first_name || '?').charAt(0)}
                        </div>
                    )}
                    <button onClick={() => navigate(`/students/${row.id}/edit`)} className="text-blue-600 hover:underline font-semibold">{value}</button>
                </div>
            ),
        },
        { key: "full_name", label: "Full Name", render: (value, row) => value || `${row.first_name} ${row.middle_name ? row.middle_name + ' ' : ''}${row.last_name}` },
        {
            key: "class_level_name", label: "Class",
            render: (value) => <span className="bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm font-semibold">{value || 'N/A'}</span>,
        },
        { key: "gender", label: "Gender", render: (value) => value === 'M' ? 'Male' : 'Female' },
        { key: "date_of_birth", label: "Date of Birth", render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A' },
        {
            key: "is_active", label: "Status",
            render: (value) => (
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {value ? 'Active' : 'Inactive'}
                </span>
            ),
        },
        {
            key: "id", label: "Actions",
            render: (value) => (
                <div className="flex gap-2">
                    <Button size="sm" onClick={() => navigate(`/students/${value}/edit`)}>Edit</Button>
                    <Button size="sm" variant="danger" onClick={() => setDeleteModal({ isOpen: true, studentId: value })}>Delete</Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Students</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {stats.total} total · {stats.active} active · {stats.inactive} inactive
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={handleExportCSV}>
                        Export CSV {selectedClassName ? `(${selectedClassName})` : ''}
                    </Button>
                    <Button variant="secondary" onClick={handleExportForCBT}>
                        Export for CBT {selectedClassName ? `(${selectedClassName})` : ''}
                    </Button>
                    <Button variant="secondary" onClick={() => navigate("/students/bulk-upload")}>Bulk Upload</Button>
                    <Button onClick={() => navigate("/students/create")}>Add Student</Button>
                </div>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-3 rounded-lg border text-sm flex justify-between ${
                    message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                    <span>{message.text}</span>
                    <button onClick={() => setMessage(null)} className="font-bold">&times;</button>
                </div>
            )}

            {/* Filters + Bulk Actions */}
            <div className="flex flex-col md:flex-row gap-3 items-start">
                <Input placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
                <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}
                    className="px-4 py-3 rounded-xl border-2 border-gray-200">
                    <option value="all">All Classes</option>
                    {classLevels.map((cls) => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
                </select>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 rounded-xl border-2 border-gray-200">
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>

                {/* Bulk Activate/Deactivate — only shows when a class is selected */}
                {classFilter !== "all" && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActivateModal({ isOpen: true, action: 'activate' })}
                            className="px-4 py-3 rounded-xl border-2 border-green-300 bg-green-50 text-green-700 text-sm font-medium hover:bg-green-100 transition-colors"
                        >
                            Activate All {selectedClassName}
                        </button>
                        <button
                            onClick={() => setActivateModal({ isOpen: true, action: 'deactivate' })}
                            className="px-4 py-3 rounded-xl border-2 border-red-300 bg-red-50 text-red-700 text-sm font-medium hover:bg-red-100 transition-colors"
                        >
                            Deactivate All
                        </button>
                    </div>
                )}
            </div>

            <Table columns={columns} data={students} loading={loading} />

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between bg-white rounded-xl p-4 border border-gray-200">
                    <p className="text-sm text-gray-500">
                        {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, totalCount)} of {totalCount}
                    </p>
                    <div className="flex gap-1">
                        {[
                            { label: 'First', action: () => setCurrentPage(1), disabled: currentPage === 1 },
                            { label: 'Prev', action: () => setCurrentPage(p => Math.max(1, p - 1)), disabled: currentPage === 1 },
                            { label: `${currentPage}/${totalPages}`, action: null, disabled: true, active: true },
                            { label: 'Next', action: () => setCurrentPage(p => Math.min(totalPages, p + 1)), disabled: currentPage >= totalPages },
                            { label: 'Last', action: () => setCurrentPage(totalPages), disabled: currentPage >= totalPages },
                        ].map((btn, i) => (
                            <button key={i} onClick={btn.action} disabled={btn.disabled}
                                className={`px-3 py-1.5 text-sm rounded font-medium transition-colors ${
                                    btn.active ? 'bg-blue-100 text-blue-700' :
                                    btn.disabled ? 'text-gray-300 cursor-not-allowed' :
                                    'text-gray-600 hover:bg-gray-100'
                                }`}>{btn.label}</button>
                        ))}
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            <Modal isOpen={deleteModal.isOpen} title="Delete Student?" onClose={() => setDeleteModal({ isOpen: false, studentId: null })}
                actions={[
                    { label: "Cancel", onClick: () => setDeleteModal({ isOpen: false, studentId: null }) },
                    { label: "Delete", variant: "danger", onClick: handleDelete },
                ]}>
                <p className="text-gray-600">This will set the student as inactive. They can be reactivated later.</p>
            </Modal>

            {/* Bulk Activate/Deactivate Modal */}
            <Modal isOpen={activateModal.isOpen}
                title={activateModal.action === 'activate' ? `Activate all ${selectedClassName} students?` : `Deactivate all ${selectedClassName} students?`}
                onClose={() => setActivateModal({ isOpen: false, action: 'activate' })}
                actions={[
                    { label: "Cancel", onClick: () => setActivateModal({ isOpen: false, action: 'activate' }) },
                    { label: activateModal.action === 'activate' ? "Activate All" : "Deactivate All",
                      variant: activateModal.action === 'activate' ? undefined : "danger",
                      onClick: () => handleBulkActivate(activateModal.action === 'activate') },
                ]}>
                <p className="text-gray-600">
                    {activateModal.action === 'activate'
                        ? `This will activate all students in ${selectedClassName}. They will appear in score uploads and results.`
                        : `This will deactivate all students in ${selectedClassName}. They won't appear in active lists.`}
                </p>
            </Modal>
        </div>
    );
}