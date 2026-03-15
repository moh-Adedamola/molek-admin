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
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [classFilter, setClassFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("active");
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, studentId: null });
    const [bulkDeleteModal, setBulkDeleteModal] = useState({ isOpen: false, permanent: false });
    const [activateModal, setActivateModal] = useState({ isOpen: false, action: 'activate' });
    const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [message, setMessage] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const pageSize = 25;

    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://molek-school-backend-production.up.railway.app';
    const authHeader = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` };

    useEffect(() => { const timer = setTimeout(() => setDebouncedSearch(search), 400); return () => clearTimeout(timer); }, [search]);
    useEffect(() => { setCurrentPage(1); }, [debouncedSearch, classFilter, statusFilter]);
    useEffect(() => { fetchStudents(); }, [debouncedSearch, classFilter, statusFilter, currentPage]);
    useEffect(() => { fetchClassLevels(); fetchStats(); }, []);
    useEffect(() => { setSelectedIds([]); }, [currentPage, classFilter, statusFilter, debouncedSearch]);

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
        try { const response = await classLevelsAPI.list(); setClassLevels(response.data.results || response.data || []); }
        catch (error) { console.error("Failed to fetch class levels:", error); }
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

    const handleExportCSV = async () => {
        try {
            const params = {};
            if (classFilter !== "all") params.class_level = classFilter;
            const response = await studentsAPI.exportCSV(params);
            const className = classFilter !== "all" ? classLevels.find(c => c.id === parseInt(classFilter))?.name || 'class' : 'all';
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a'); link.href = url;
            link.setAttribute('download', `students_${className}.csv`);
            document.body.appendChild(link); link.click(); link.remove();
        } catch (error) { setMessage({ type: 'error', text: 'Failed to export CSV.' }); }
    };

    const handleExportForCBT = async () => {
        try {
            const params = {};
            if (classFilter !== "all") {
                const cls = classLevels.find(c => c.id === parseInt(classFilter));
                if (cls) params.class_level = cls.name;
            }
            const response = await studentsAPI.exportForCBT(params);
            const className = classFilter !== "all" ? classLevels.find(c => c.id === parseInt(classFilter))?.name || '' : 'all';
            const blob = response.data instanceof Blob ? response.data : new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a'); link.href = url;
            link.setAttribute('download', `students_cbt_${className}.csv`);
            document.body.appendChild(link); link.click(); link.remove();
            setMessage({ type: 'success', text: 'CBT credentials exported.' });
        } catch (error) { setMessage({ type: 'error', text: 'Failed to export CBT credentials.' }); }
    };

    const handleBulkActivate = async (activate) => {
        if (classFilter === "all") { setMessage({ type: 'error', text: 'Select a class first.' }); return; }
        try {
            const response = await fetch(`${baseUrl}/api/students/bulk-activate/`, {
                method: 'POST', headers: authHeader,
                body: JSON.stringify({ class_level: parseInt(classFilter), activate })
            });
            const data = await response.json();
            if (response.ok) { setMessage({ type: 'success', text: data.message }); fetchStudents(); fetchStats(); }
            else { setMessage({ type: 'error', text: data.error || 'Failed.' }); }
        } catch (error) { setMessage({ type: 'error', text: 'Could not connect to server.' }); }
        setActivateModal({ isOpen: false, action: 'activate' });
    };

    const handleBulkDelete = async (permanent) => {
        if (selectedIds.length === 0) { setMessage({ type: 'error', text: 'No students selected.' }); return; }
        try {
            const response = await fetch(`${baseUrl}/api/students/bulk-delete/`, {
                method: 'POST', headers: authHeader,
                body: JSON.stringify({ student_ids: selectedIds, permanent })
            });
            const data = await response.json();
            if (response.ok) { setMessage({ type: 'success', text: data.message }); setSelectedIds([]); fetchStudents(); fetchStats(); }
            else { setMessage({ type: 'error', text: data.error || 'Failed.' }); }
        } catch (error) { setMessage({ type: 'error', text: 'Could not connect to server.' }); }
        setBulkDeleteModal({ isOpen: false, permanent: false });
    };

    const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    const toggleSelectAll = () => { if (selectedIds.length === students.length) setSelectedIds([]); else setSelectedIds(students.map(s => s.id)); };
    const allSelected = students.length > 0 && selectedIds.length === students.length;
    const selectedClassName = classFilter !== "all" ? classLevels.find(c => c.id === parseInt(classFilter))?.name : null;
    const totalPages = Math.ceil(totalCount / pageSize);

    const columns = [
        {
            key: "_select",
            label: (<input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer" />),
            render: (_, row) => (<input type="checkbox" checked={selectedIds.includes(row.id)} onChange={() => toggleSelect(row.id)} className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer" />),
        },
        {
            key: "admission_number", label: "Admission No.",
            render: (value, row) => (
                <div className="flex items-center gap-2">
                    {row.passport ? (<img src={row.passport} alt="" className="w-8 h-8 rounded-full object-cover border border-gray-200" onError={(e) => { e.target.style.display = 'none'; }} />)
                    : (<div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">{(row.first_name || '?').charAt(0)}</div>)}
                    <button onClick={() => navigate(`/students/${row.id}/edit`)} className="text-blue-600 hover:underline font-semibold">{value}</button>
                </div>
            ),
        },
        { key: "full_name", label: "Full Name", render: (value, row) => value || `${row.first_name} ${row.middle_name ? row.middle_name + ' ' : ''}${row.last_name}` },
        { key: "class_level_name", label: "Class", render: (value) => <span className="bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm font-semibold">{value || 'N/A'}</span> },
        { key: "gender", label: "Gender", render: (value) => value === 'M' ? 'Male' : 'Female' },
        { key: "date_of_birth", label: "Date of Birth", render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A' },
        { key: "is_active", label: "Status", render: (value) => (<span className={`rounded-full px-3 py-1 text-sm font-semibold ${value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{value ? 'Active' : 'Inactive'}</span>) },
        { key: "id", label: "Actions", render: (value) => (
            <div className="flex gap-2">
                <Button size="sm" onClick={() => navigate(`/students/${value}/edit`)}>Edit</Button>
                <Button size="sm" variant="danger" onClick={() => setDeleteModal({ isOpen: true, studentId: value })}>Delete</Button>
            </div>
        )},
    ];

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Students</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{stats.total} total · {stats.active} active · {stats.inactive} inactive</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={handleExportCSV}>Export CSV {selectedClassName ? `(${selectedClassName})` : ''}</Button>
                    <Button variant="secondary" onClick={handleExportForCBT}>Export for CBT {selectedClassName ? `(${selectedClassName})` : ''}</Button>
                    <Button variant="secondary" onClick={() => navigate("/students/bulk-upload")}>Bulk Upload</Button>
                    <Button onClick={() => navigate("/students/create")}>Add Student</Button>
                </div>
            </div>

            {message && (
                <div className={`p-3 rounded-lg border text-sm flex justify-between ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    <span>{message.text}</span>
                    <button onClick={() => setMessage(null)} className="font-bold ml-4">&times;</button>
                </div>
            )}

            <div className="flex flex-col md:flex-row gap-3 items-start">
                <Input placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
                <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="px-4 py-3 rounded-xl border-2 border-gray-200">
                    <option value="all">All Classes</option>
                    {classLevels.map((cls) => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
                </select>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-3 rounded-xl border-2 border-gray-200">
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
                {classFilter !== "all" && (
                    <div className="flex gap-2">
                        <button onClick={() => setActivateModal({ isOpen: true, action: 'activate' })}
                            className="px-4 py-3 rounded-xl border-2 border-green-300 bg-green-50 text-green-700 text-sm font-medium hover:bg-green-100">Activate All {selectedClassName}</button>
                        <button onClick={() => setActivateModal({ isOpen: true, action: 'deactivate' })}
                            className="px-4 py-3 rounded-xl border-2 border-red-300 bg-red-50 text-red-700 text-sm font-medium hover:bg-red-100">Deactivate All</button>
                    </div>
                )}
            </div>

            {selectedIds.length > 0 && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <span className="text-sm font-medium text-blue-800">{selectedIds.length} selected</span>
                    <button onClick={() => setBulkDeleteModal({ isOpen: true, permanent: false })}
                        className="px-3 py-1.5 text-sm font-medium bg-orange-100 text-orange-700 border border-orange-300 rounded-lg hover:bg-orange-200">Deactivate Selected</button>
                    <button onClick={() => setBulkDeleteModal({ isOpen: true, permanent: true })}
                        className="px-3 py-1.5 text-sm font-medium bg-red-100 text-red-700 border border-red-300 rounded-lg hover:bg-red-200">Delete Permanently</button>
                    <button onClick={() => setSelectedIds([])} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800">Clear</button>
                </div>
            )}

            <Table columns={columns} data={students} loading={loading} />

            {totalPages > 1 && (
                <div className="flex items-center justify-between bg-white rounded-xl p-4 border border-gray-200">
                    <p className="text-sm text-gray-500">{((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, totalCount)} of {totalCount}</p>
                    <div className="flex gap-1">
                        {[
                            { label: 'First', action: () => setCurrentPage(1), disabled: currentPage === 1 },
                            { label: 'Prev', action: () => setCurrentPage(p => Math.max(1, p - 1)), disabled: currentPage === 1 },
                            { label: `${currentPage}/${totalPages}`, action: null, disabled: true, active: true },
                            { label: 'Next', action: () => setCurrentPage(p => Math.min(totalPages, p + 1)), disabled: currentPage >= totalPages },
                            { label: 'Last', action: () => setCurrentPage(totalPages), disabled: currentPage >= totalPages },
                        ].map((btn, i) => (
                            <button key={i} onClick={btn.action} disabled={btn.disabled}
                                className={`px-3 py-1.5 text-sm rounded font-medium ${btn.active ? 'bg-blue-100 text-blue-700' : btn.disabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}>{btn.label}</button>
                        ))}
                    </div>
                </div>
            )}

            <Modal isOpen={deleteModal.isOpen} title="Delete Student?" onClose={() => setDeleteModal({ isOpen: false, studentId: null })}
                actions={[{ label: "Cancel", onClick: () => setDeleteModal({ isOpen: false, studentId: null }) }, { label: "Delete", variant: "danger", onClick: handleDelete }]}>
                <p className="text-gray-600">This will set the student as inactive.</p>
            </Modal>

            <Modal isOpen={bulkDeleteModal.isOpen}
                title={bulkDeleteModal.permanent ? `Permanently delete ${selectedIds.length} students?` : `Deactivate ${selectedIds.length} students?`}
                onClose={() => setBulkDeleteModal({ isOpen: false, permanent: false })}
                actions={[{ label: "Cancel", onClick: () => setBulkDeleteModal({ isOpen: false, permanent: false }) },
                    { label: bulkDeleteModal.permanent ? "Delete Permanently" : "Deactivate", variant: "danger", onClick: () => handleBulkDelete(bulkDeleteModal.permanent) }]}>
                <p className="text-gray-600">{bulkDeleteModal.permanent ? `This will permanently remove ${selectedIds.length} students. This cannot be undone.` : `This will deactivate ${selectedIds.length} students.`}</p>
            </Modal>

            <Modal isOpen={activateModal.isOpen}
                title={activateModal.action === 'activate' ? `Activate all ${selectedClassName}?` : `Deactivate all ${selectedClassName}?`}
                onClose={() => setActivateModal({ isOpen: false, action: 'activate' })}
                actions={[{ label: "Cancel", onClick: () => setActivateModal({ isOpen: false, action: 'activate' }) },
                    { label: activateModal.action === 'activate' ? "Activate All" : "Deactivate All", variant: activateModal.action === 'activate' ? undefined : "danger", onClick: () => handleBulkActivate(activateModal.action === 'activate') }]}>
                <p className="text-gray-600">{activateModal.action === 'activate' ? `All students in ${selectedClassName} will be activated.` : `All students in ${selectedClassName} will be deactivated.`}</p>
            </Modal>
        </div>
    );
}