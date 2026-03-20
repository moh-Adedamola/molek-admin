/**
 * Exam Results Manager
 * View, edit, add, and delete exam results
 * Grades: A(75-100), B(70-74), C(60-69), D(50-59), E(45-49), F(0-44)
 */
import { useState, useEffect } from 'react';
import { examResultsAPI, academicSessionsAPI, termsAPI, classLevelsAPI, subjectsAPI, studentsAPI } from '../api/endpoints';
import { RefreshCw, Plus, Pencil, Trash2, Search, X } from 'lucide-react';

export function ExamResultsManager() {
    const [results, setResults] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 25;
    const [students, setStudents] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [terms, setTerms] = useState([]);
    const [classLevels, setClassLevels] = useState([]);
    const [filters, setFilters] = useState({ session: '', term: '', class_level: '', student: '', subject: '' });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [editingResult, setEditingResult] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [newResult, setNewResult] = useState({ student: '', subject: '', session: '', term: '', ca1_score: '', ca2_score: '', obj_score: '', theory_score: '' });

    useEffect(() => { fetchDropdownData(); }, []);
    useEffect(() => { if (filters.session && filters.term && filters.subject) fetchResults(); }, [filters.session, filters.term, filters.class_level, filters.subject, currentPage]);
    useEffect(() => { setCurrentPage(1); }, [filters.session, filters.term, filters.class_level, filters.student, filters.subject]);

    const fetchDropdownData = async () => {
        try {
            const [sessionsRes, termsRes, classesRes, subjectsRes, studentsRes] = await Promise.all([
                academicSessionsAPI.list(), termsAPI.list(), classLevelsAPI.list(), subjectsAPI.list(), studentsAPI.list({ is_active: true, page_size: 500 })
            ]);
            setSessions(sessionsRes.data.results || sessionsRes.data || []);
            setTerms(termsRes.data.results || termsRes.data || []);
            setClassLevels(classesRes.data.results || classesRes.data || []);
            setSubjects(subjectsRes.data.results || subjectsRes.data || []);
            setStudents(studentsRes.data.results || studentsRes.data || []);
            const currentSession = (sessionsRes.data.results || sessionsRes.data || []).find(s => s.is_current);
            const currentTerm = (termsRes.data.results || termsRes.data || []).find(t => t.is_current);
            if (currentSession) setFilters(f => ({ ...f, session: currentSession.id.toString() }));
            if (currentTerm) setFilters(f => ({ ...f, term: currentTerm.id.toString() }));
        } catch (err) {
            setMessage({ type: 'error', text: 'Could not load data. Please refresh the page.' });
        }
    };

    const fetchResults = async () => {
        setLoading(true);
        try {
            const params = { page: currentPage, page_size: pageSize };
            if (filters.session) params.session = filters.session;
            if (filters.term) params.term = filters.term;
            if (filters.class_level) params.class_level = filters.class_level;
            if (filters.student) params.student = filters.student;
            if (filters.subject) params.subject = filters.subject;
            const response = await examResultsAPI.list(params);
            const data = response.data;
            if (data.results) { setResults(data.results); setTotalCount(data.count || data.results.length); }
            else { const arr = Array.isArray(data) ? data : []; setResults(arr); setTotalCount(arr.length); }
        } catch (err) {
            setMessage({ type: 'error', text: 'Could not load results.' });
        } finally { setLoading(false); }
    };

    const handleAddResult = async (e) => {
        e.preventDefault();
        const total = calcTotal(newResult.ca1_score, newResult.ca2_score, newResult.obj_score, newResult.theory_score);
        if (total > 100) { setMessage({ type: 'error', text: `Total score (${total}) exceeds 100.` }); return; }
        setLoading(true);
        try {
            await examResultsAPI.create({
                student: parseInt(newResult.student), subject: parseInt(newResult.subject),
                session: parseInt(newResult.session), term: parseInt(newResult.term),
                ca1_score: parseFloat(newResult.ca1_score) || 0, ca2_score: parseFloat(newResult.ca2_score) || 0,
                obj_score: parseFloat(newResult.obj_score) || 0, theory_score: parseFloat(newResult.theory_score) || 0
            });
            setMessage({ type: 'success', text: 'Result added successfully.' }); setShowAddModal(false);
            setNewResult({ student: '', subject: '', session: filters.session, term: filters.term, ca1_score: '', ca2_score: '', obj_score: '', theory_score: '' });
            fetchResults();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.detail || 'Could not add result. Please try again.' });
        } finally { setLoading(false); }
    };

    const handleUpdateResult = async (e) => {
        e.preventDefault();
        const total = calcTotal(editingResult.ca1_score, editingResult.ca2_score, editingResult.obj_score, editingResult.theory_score);
        if (total > 100) { setMessage({ type: 'error', text: `Total score (${total}) exceeds 100.` }); return; }
        setLoading(true);
        try {
            await examResultsAPI.update(editingResult.id, {
                ca1_score: parseFloat(editingResult.ca1_score) || 0, ca2_score: parseFloat(editingResult.ca2_score) || 0,
                obj_score: parseFloat(editingResult.obj_score) || 0, theory_score: parseFloat(editingResult.theory_score) || 0
            });
            setMessage({ type: 'success', text: 'Result updated.' }); setShowEditModal(false); setEditingResult(null); fetchResults();
        } catch (err) {
            setMessage({ type: 'error', text: 'Could not update result.' });
        } finally { setLoading(false); }
    };

    const handleDeleteResult = async (id) => {
        if (!window.confirm('Are you sure you want to delete this result?')) return;
        try {
            await examResultsAPI.delete(id);
            setMessage({ type: 'success', text: 'Result deleted.' }); fetchResults();
        } catch (err) { setMessage({ type: 'error', text: 'Could not delete result.' }); }
    };

    const handleRecalculate = async () => {
        if (!filters.session || !filters.term) { setMessage({ type: 'error', text: 'Select a session and term first.' }); return; }
        setLoading(true);
        try {
            const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://molek-school-backend-production.up.railway.app';
            const response = await fetch(`${baseUrl}/api/exam-results/recalculate-positions/`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
                body: JSON.stringify({ session: parseInt(filters.session), term: parseInt(filters.term), class_level: filters.class_level ? parseInt(filters.class_level) : null })
            });
            const data = await response.json();
            if (response.ok) { setMessage({ type: 'success', text: `Recalculated! ${data.totals_fixed || 0} scores updated, ${data.subjects_processed || 0} subjects processed.` }); fetchResults(); }
            else { setMessage({ type: 'error', text: data.error || 'Recalculation failed.' }); }
        } catch (err) { setMessage({ type: 'error', text: 'Could not recalculate. Check your connection.' }); }
        finally { setLoading(false); }
    };

    const getGradeColor = (grade) => ({
        A: 'bg-green-100 text-green-700', B: 'bg-blue-100 text-blue-700', C: 'bg-amber-100 text-amber-700',
        D: 'bg-orange-100 text-orange-700', E: 'bg-red-100 text-red-600', F: 'bg-red-200 text-red-800'
    }[grade] || 'bg-gray-100 text-gray-600');

    const calcTotal = (ca1, ca2, obj, theory) => (parseFloat(ca1) || 0) + (parseFloat(ca2) || 0) + (parseFloat(obj) || 0) + (parseFloat(theory) || 0);
    const filteredTerms = terms.filter(t => !filters.session || t.session === parseInt(filters.session));
    const totalPages = Math.ceil(totalCount / pageSize);

    const ScoreInput = ({ label, value, onChange }) => (
        <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
            <input type="number" min="0" max="100" step="0.5" value={value} onChange={onChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-5">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Results Manager</h1>
                    <p className="text-sm text-gray-500 mt-0.5">View and manage student exam results</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleRecalculate} disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 disabled:opacity-50 transition-colors">
                        <RefreshCw size={14} /> Recalculate
                    </button>
                    <button onClick={() => { setNewResult({ student: '', subject: '', session: filters.session, term: filters.term, ca1_score: '', ca2_score: '', obj_score: '', theory_score: '' }); setShowAddModal(true); }}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                        <Plus size={14} /> Add Result
                    </button>
                </div>
            </div>

            {/* Message */}
            {message && (
                <div className={`flex items-center justify-between p-3 rounded-lg border text-sm ${
                    message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                    <span>{message.text}</span>
                    <button onClick={() => setMessage(null)} className="ml-4"><X size={14} /></button>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <select value={filters.session} onChange={(e) => setFilters({ ...filters, session: e.target.value })}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                        <option value="">Session</option>
                        {sessions.map(s => <option key={s.id} value={s.id}>{s.name}{s.is_current ? ' (Current)' : ''}</option>)}
                    </select>
                    <select value={filters.term} onChange={(e) => setFilters({ ...filters, term: e.target.value })}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                        <option value="">Term</option>
                        {filteredTerms.map(t => <option key={t.id} value={t.id}>{t.name}{t.is_current ? ' (Current)' : ''}</option>)}
                    </select>
                    <select value={filters.class_level} onChange={(e) => setFilters({ ...filters, class_level: e.target.value })}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                        <option value="">Class</option>
                        {classLevels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select value={filters.subject} onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                        <option value="">Subject</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <div className="flex gap-2">
                        <button onClick={fetchResults} disabled={loading}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                            <Search size={14} /> Search
                        </button>
                        <button onClick={() => setFilters({ session: '', term: '', class_level: '', student: '', subject: '' })}
                            className="px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Clear</button>
                    </div>
                </div>
            </div>

            {/* Results Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-700">{totalCount} result{totalCount !== 1 ? 's' : ''} found</p>
                </div>

                {loading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mx-auto"></div>
                        <p className="text-sm text-gray-500 mt-3">Loading results...</p>
                    </div>
                ) : results.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-sm text-gray-500">{!filters.subject ? 'Select a subject to view results.' : 'No results found for the selected filters.'}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="text-left py-3 px-4 font-medium text-gray-600">Student</th>
                                    <th className="text-left py-3 px-3 font-medium text-gray-600">Subject</th>
                                    <th className="text-center py-3 px-2 font-medium text-gray-600">CA1</th>
                                    <th className="text-center py-3 px-2 font-medium text-gray-600">CA2</th>
                                    <th className="text-center py-3 px-2 font-medium text-gray-600">OBJ</th>
                                    <th className="text-center py-3 px-2 font-medium text-gray-600">Theory</th>
                                    <th className="text-center py-3 px-2 font-medium text-gray-900">Total</th>
                                    <th className="text-center py-3 px-2 font-medium text-gray-600">Grade</th>
                                    <th className="text-center py-3 px-2 font-medium text-gray-600">Pos</th>
                                    <th className="text-center py-3 px-2 font-medium text-blue-600 bg-blue-50/60">1st</th>
                                    <th className="text-center py-3 px-2 font-medium text-blue-600 bg-blue-50/60">2nd</th>
                                    <th className="text-center py-3 px-2 font-medium text-blue-600 bg-blue-50/60">3rd</th>
                                    <th className="text-center py-3 px-2 font-medium text-blue-600 bg-blue-50/60">Cum</th>
                                    <th className="text-center py-3 px-2 font-medium text-gray-600 w-20"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {results.map((r) => (
                                    <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-2.5 px-4">
                                            <p className="font-medium text-gray-900 text-sm">{r.student_name || r.admission_number}</p>
                                            <p className="text-xs text-gray-400">{r.admission_number}</p>
                                        </td>
                                        <td className="py-2.5 px-3 text-gray-700">{r.subject_name}</td>
                                        <td className="py-2.5 px-2 text-center">{r.ca1_score || 0}</td>
                                        <td className="py-2.5 px-2 text-center">{r.ca2_score || 0}</td>
                                        <td className="py-2.5 px-2 text-center">{r.obj_score || 0}</td>
                                        <td className="py-2.5 px-2 text-center">{r.theory_score || 0}</td>
                                        <td className="py-2.5 px-2 text-center font-bold text-gray-900">{r.total_score || 0}</td>
                                        <td className="py-2.5 px-2 text-center">
                                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${getGradeColor(r.grade)}`}>{r.grade || '-'}</span>
                                        </td>
                                        <td className="py-2.5 px-2 text-center text-gray-500 text-xs">{r.position ? `${r.position}/${r.total_students || ''}` : '-'}</td>
                                        <td className="py-2.5 px-2 text-center text-xs bg-blue-50/40">{r.first_term_total != null ? Math.round(r.first_term_total) : '-'}</td>
                                        <td className="py-2.5 px-2 text-center text-xs bg-blue-50/40">{r.second_term_total != null ? Math.round(r.second_term_total) : '-'}</td>
                                        <td className="py-2.5 px-2 text-center text-xs bg-blue-50/40">{r.third_term_total != null ? Math.round(r.third_term_total) : '-'}</td>
                                        <td className="py-2.5 px-2 text-center text-xs font-semibold text-blue-700 bg-blue-50/40">{r.cumulative_score != null ? parseFloat(r.cumulative_score).toFixed(1) : '-'}</td>
                                        <td className="py-2.5 px-2 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button onClick={() => { setEditingResult({ ...r }); setShowEditModal(true); }}
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Pencil size={14} /></button>
                                                <button onClick={() => handleDeleteResult(r.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                                <p className="text-xs text-gray-500">
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
                                            className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                                                btn.active ? 'bg-blue-100 text-blue-700' :
                                                btn.disabled ? 'text-gray-300 cursor-not-allowed' :
                                                'text-gray-600 hover:bg-gray-100'
                                            }`}>{btn.label}</button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <Modal title="Add Result" onClose={() => setShowAddModal(false)}>
                    <form onSubmit={handleAddResult} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Student</label>
                                <select value={newResult.student} onChange={(e) => setNewResult({ ...newResult, student: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" required>
                                    <option value="">Select student...</option>
                                    {students.map(s => <option key={s.id} value={s.id}>{s.admission_number} - {s.first_name} {s.last_name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
                                <select value={newResult.subject} onChange={(e) => setNewResult({ ...newResult, subject: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" required>
                                    <option value="">Select subject...</option>
                                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                            <ScoreInput label="CA1" value={newResult.ca1_score} onChange={(e) => setNewResult({ ...newResult, ca1_score: e.target.value })} />
                            <ScoreInput label="CA2" value={newResult.ca2_score} onChange={(e) => setNewResult({ ...newResult, ca2_score: e.target.value })} />
                            <ScoreInput label="OBJ" value={newResult.obj_score} onChange={(e) => setNewResult({ ...newResult, obj_score: e.target.value })} />
                            <ScoreInput label="Theory" value={newResult.theory_score} onChange={(e) => setNewResult({ ...newResult, theory_score: e.target.value })} />
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg text-sm">
                            <span className="font-medium">Total:</span> {calcTotal(newResult.ca1_score, newResult.ca2_score, newResult.obj_score, newResult.theory_score)} / 100
                        </div>
                        <div className="flex gap-3">
                            <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                            <button type="submit" disabled={loading} className="flex-1 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">{loading ? 'Adding...' : 'Add result'}</button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Edit Modal */}
            {showEditModal && editingResult && (
                <Modal title="Edit Result" onClose={() => setShowEditModal(false)}>
                    <form onSubmit={handleUpdateResult} className="space-y-4">
                        <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
                            <p><span className="font-medium">Student:</span> {editingResult.student_name || editingResult.admission_number}</p>
                            <p><span className="font-medium">Subject:</span> {editingResult.subject_name}</p>
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                            <ScoreInput label="CA1" value={editingResult.ca1_score} onChange={(e) => setEditingResult({ ...editingResult, ca1_score: e.target.value })} />
                            <ScoreInput label="CA2" value={editingResult.ca2_score} onChange={(e) => setEditingResult({ ...editingResult, ca2_score: e.target.value })} />
                            <ScoreInput label="OBJ" value={editingResult.obj_score} onChange={(e) => setEditingResult({ ...editingResult, obj_score: e.target.value })} />
                            <ScoreInput label="Theory" value={editingResult.theory_score} onChange={(e) => setEditingResult({ ...editingResult, theory_score: e.target.value })} />
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg text-sm">
                            <span className="font-medium">New total:</span> {calcTotal(editingResult.ca1_score, editingResult.ca2_score, editingResult.obj_score, editingResult.theory_score)} / 100
                            <span className="text-gray-400 ml-2">(was {editingResult.total_score || 0})</span>
                        </div>
                        <div className="flex gap-3">
                            <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                            <button type="submit" disabled={loading} className="flex-1 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">{loading ? 'Updating...' : 'Update'}</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}

function Modal({ title, onClose, children }) {
    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h3 className="text-base font-semibold text-gray-900">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
                <div className="px-5 py-4">{children}</div>
            </div>
        </div>
    );
}

export default ExamResultsManager;