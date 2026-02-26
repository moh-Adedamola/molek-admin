/**
 * Exam Results Manager - Nigerian School Format
 * CA1(15) + CA2(15) + OBJ(30) + Theory(40) = 100
 * Grades: A(75-100), B(70-74), C(60-69), D(50-59), E(45-49), F(0-44)
 */
import { useState, useEffect } from 'react';
import { examResultsAPI, academicSessionsAPI, termsAPI, classLevelsAPI, subjectsAPI, studentsAPI } from '../api/endpoints';

export function ExamResultsManager() {
    const [results, setResults] = useState([]);
    const [students, setStudents] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [terms, setTerms] = useState([]);
    const [classLevels, setClassLevels] = useState([]);
    const [filters, setFilters] = useState({ session: '', term: '', class_level: '', student: '', subject: '' });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [editingResult, setEditingResult] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [newResult, setNewResult] = useState({ student: '', subject: '', session: '', term: '', ca1_score: '', ca2_score: '', obj_score: '', theory_score: '' });

    useEffect(() => { fetchDropdownData(); }, []);
    useEffect(() => { if (filters.session && filters.term) fetchResults(); }, [filters.session, filters.term, filters.class_level]);

    const fetchDropdownData = async () => {
        try {
            const [sessionsRes, termsRes, classesRes, subjectsRes, studentsRes] = await Promise.all([
                academicSessionsAPI.list(), termsAPI.list(), classLevelsAPI.list(), subjectsAPI.list(), studentsAPI.list({ is_active: true })
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
        } catch (err) { setMessage({ type: 'error', text: 'Failed to load data' }); }
    };

    const fetchResults = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filters.session) params.session = filters.session;
            if (filters.term) params.term = filters.term;
            if (filters.class_level) params.class_level = filters.class_level;
            if (filters.student) params.student = filters.student;
            if (filters.subject) params.subject = filters.subject;
            const response = await examResultsAPI.list(params);
            setResults(response.data.results || response.data || []);
        } catch (err) { setMessage({ type: 'error', text: 'Failed to load results' }); }
        finally { setLoading(false); }
    };

    const handleAddResult = async (e) => {
        e.preventDefault();
        const ca1 = parseFloat(newResult.ca1_score) || 0, ca2 = parseFloat(newResult.ca2_score) || 0;
        const obj = parseFloat(newResult.obj_score) || 0, theory = parseFloat(newResult.theory_score) || 0;
        if (ca1 > 15 || ca2 > 15 || obj > 30 || theory > 40) {
            setMessage({ type: 'error', text: 'Score exceeds maximum allowed' }); return;
        }
        setLoading(true);
        try {
            await examResultsAPI.create({ student: parseInt(newResult.student), subject: parseInt(newResult.subject),
                session: parseInt(newResult.session), term: parseInt(newResult.term), ca1_score: ca1, ca2_score: ca2, obj_score: obj, theory_score: theory });
            setMessage({ type: 'success', text: 'Result added!' }); setShowAddModal(false);
            setNewResult({ student: '', subject: '', session: filters.session, term: filters.term, ca1_score: '', ca2_score: '', obj_score: '', theory_score: '' });
            fetchResults();
        } catch (err) { setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to add' }); }
        finally { setLoading(false); }
    };

    const handleUpdateResult = async (e) => {
        e.preventDefault();
        const ca1 = parseFloat(editingResult.ca1_score) || 0, ca2 = parseFloat(editingResult.ca2_score) || 0;
        const obj = parseFloat(editingResult.obj_score) || 0, theory = parseFloat(editingResult.theory_score) || 0;
        if (ca1 > 15 || ca2 > 15 || obj > 30 || theory > 40) {
            setMessage({ type: 'error', text: 'Score exceeds maximum allowed' }); return;
        }
        setLoading(true);
        try {
            await examResultsAPI.update(editingResult.id, { ca1_score: ca1, ca2_score: ca2, obj_score: obj, theory_score: theory });
            setMessage({ type: 'success', text: 'Result updated!' }); setShowEditModal(false); setEditingResult(null); fetchResults();
        } catch (err) { setMessage({ type: 'error', text: 'Failed to update' }); }
        finally { setLoading(false); }
    };

    const handleDeleteResult = async (id) => {
        if (!window.confirm('Delete this result?')) return;
        setLoading(true);
        try { await examResultsAPI.delete(id); setMessage({ type: 'success', text: 'Deleted!' }); fetchResults(); }
        catch (err) { setMessage({ type: 'error', text: 'Failed to delete' }); }
        finally { setLoading(false); }
    };

    const handleRecalculatePositions = async () => {
        if (!filters.session || !filters.term) { setMessage({ type: 'error', text: 'Select session and term first' }); return; }
        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://molek-school-backend-production.up.railway.app'}/api/exam-results/recalculate-positions/`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
                body: JSON.stringify({ session: parseInt(filters.session), term: parseInt(filters.term), class_level: filters.class_level ? parseInt(filters.class_level) : null })
            });
            const data = await response.json();
            if (response.ok) { setMessage({ type: 'success', text: `Positions recalculated! ${data.subjects_processed} subjects.` }); fetchResults(); }
            else { setMessage({ type: 'error', text: data.error || 'Failed' }); }
        } catch (err) { setMessage({ type: 'error', text: 'Failed to recalculate' }); }
        finally { setLoading(false); }
    };

    const getGradeColor = (grade) => ({
        A: 'bg-green-100 text-green-800', B: 'bg-blue-100 text-blue-800', C: 'bg-yellow-100 text-yellow-800',
        D: 'bg-orange-100 text-orange-800', E: 'bg-red-100 text-red-700', F: 'bg-red-200 text-red-900'
    }[grade] || 'bg-gray-100 text-gray-800');

    const calcTotal = (ca1, ca2, obj, theory) => (parseFloat(ca1) || 0) + (parseFloat(ca2) || 0) + (parseFloat(obj) || 0) + (parseFloat(theory) || 0);
    const filteredTerms = terms.filter(t => !filters.session || t.session === parseInt(filters.session));
    const filteredStudents = students.filter(s => !filters.class_level || s.class_level === parseInt(filters.class_level));

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Exam Results Manager</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">CA1(15) + CA2(15) + OBJ(30) + Theory(40) = 100</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleRecalculatePositions} disabled={loading} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium">🔄 Recalculate</button>
                    <button onClick={() => { setNewResult({ student: '', subject: '', session: filters.session, term: filters.term, ca1_score: '', ca2_score: '', obj_score: '', theory_score: '' }); setShowAddModal(true); }}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium">➕ Add Result</button>
                </div>
            </div>

            {/* Message */}
            {message.text && (
                <div className={`mb-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message.text} <button onClick={() => setMessage({ type: '', text: '' })} className="float-right font-bold">×</button>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">🔍 Filters</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <select value={filters.session} onChange={(e) => setFilters({ ...filters, session: e.target.value })}
                        className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white">
                        <option value="">All Sessions</option>
                        {sessions.map(s => <option key={s.id} value={s.id}>{s.name} {s.is_current ? '(Current)' : ''}</option>)}
                    </select>
                    <select value={filters.term} onChange={(e) => setFilters({ ...filters, term: e.target.value })}
                        className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white">
                        <option value="">All Terms</option>
                        {filteredTerms.map(t => <option key={t.id} value={t.id}>{t.name} {t.is_current ? '(Current)' : ''}</option>)}
                    </select>
                    <select value={filters.class_level} onChange={(e) => setFilters({ ...filters, class_level: e.target.value })}
                        className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white">
                        <option value="">All Classes</option>
                        {classLevels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select value={filters.subject} onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
                        className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white">
                        <option value="">All Subjects</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <div className="flex gap-2">
                        <button onClick={fetchResults} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                            {loading ? '...' : '🔍 Search'}
                        </button>
                        <button onClick={() => setFilters({ session: '', term: '', class_level: '', student: '', subject: '' })}
                            className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg text-sm">Clear</button>
                    </div>
                </div>
            </div>

            {/* Results Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">📊 Results ({results.length})</h2>
                </div>
                {loading ? (
                    <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div></div>
                ) : results.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No results found. Select session and term.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">Student</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">Subject</th>
                                    <th className="text-center py-3 px-3 font-semibold text-gray-700 dark:text-gray-300 text-sm">CA1<br/><span className="text-xs font-normal">(15)</span></th>
                                    <th className="text-center py-3 px-3 font-semibold text-gray-700 dark:text-gray-300 text-sm">CA2<br/><span className="text-xs font-normal">(15)</span></th>
                                    <th className="text-center py-3 px-3 font-semibold text-gray-700 dark:text-gray-300 text-sm">OBJ<br/><span className="text-xs font-normal">(30)</span></th>
                                    <th className="text-center py-3 px-3 font-semibold text-gray-700 dark:text-gray-300 text-sm">Theory<br/><span className="text-xs font-normal">(40)</span></th>
                                    <th className="text-center py-3 px-3 font-semibold text-gray-700 dark:text-gray-300 text-sm">Total<br/><span className="text-xs font-normal">(100)</span></th>
                                    <th className="text-center py-3 px-3 font-semibold text-gray-700 dark:text-gray-300 text-sm">Grade</th>
                                    <th className="text-center py-3 px-3 font-semibold text-gray-700 dark:text-gray-300 text-sm">Pos</th>
                                    <th className="text-center py-3 px-2 font-semibold text-blue-700 dark:text-blue-400 text-sm bg-blue-50 dark:bg-blue-900/20">1st<br/><span className="text-xs font-normal">B/F</span></th>
                                    <th className="text-center py-3 px-2 font-semibold text-blue-700 dark:text-blue-400 text-sm bg-blue-50 dark:bg-blue-900/20">2nd<br/><span className="text-xs font-normal">B/F</span></th>
                                    <th className="text-center py-3 px-2 font-semibold text-blue-700 dark:text-blue-400 text-sm bg-blue-50 dark:bg-blue-900/20">3rd<br/><span className="text-xs font-normal">B/F</span></th>
                                    <th className="text-center py-3 px-2 font-semibold text-blue-700 dark:text-blue-400 text-sm bg-blue-50 dark:bg-blue-900/20">Cum.<br/><span className="text-xs font-normal">Avg</span></th>
                                    <th className="text-center py-3 px-3 font-semibold text-gray-700 dark:text-gray-300 text-sm">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((r, idx) => (
                                    <tr key={r.id} className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 ${idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-800/50'}`}>
                                        <td className="py-3 px-4">
                                            <div className="font-medium text-gray-800 dark:text-white">{r.student_name || r.admission_number}</div>
                                            <div className="text-xs text-gray-500">{r.admission_number}</div>
                                        </td>
                                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{r.subject_name}</td>
                                        <td className="py-3 px-3 text-center font-medium">{r.ca1_score || 0}</td>
                                        <td className="py-3 px-3 text-center font-medium">{r.ca2_score || 0}</td>
                                        <td className="py-3 px-3 text-center font-medium">{r.obj_score || 0}</td>
                                        <td className="py-3 px-3 text-center font-medium">{r.theory_score || 0}</td>
                                        <td className="py-3 px-3 text-center font-bold text-blue-600">{r.total_score || 0}</td>
                                        <td className="py-3 px-3 text-center"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${getGradeColor(r.grade)}`}>{r.grade || '-'}</span></td>
                                        <td className="py-3 px-3 text-center text-gray-600 dark:text-gray-400">{r.position ? `${r.position}/${r.total_students || '-'}` : '-'}</td>
                                        <td className="py-3 px-2 text-center text-sm bg-blue-50/50 dark:bg-blue-900/10">{r.first_term_total != null ? Math.round(r.first_term_total) : '-'}</td>
                                        <td className="py-3 px-2 text-center text-sm bg-blue-50/50 dark:bg-blue-900/10">{r.second_term_total != null ? Math.round(r.second_term_total) : '-'}</td>
                                        <td className="py-3 px-2 text-center text-sm bg-blue-50/50 dark:bg-blue-900/10">{r.third_term_total != null ? Math.round(r.third_term_total) : '-'}</td>
                                        <td className="py-3 px-2 text-center text-sm font-bold text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10">{r.cumulative_score != null ? parseFloat(r.cumulative_score).toFixed(1) : '-'}</td>
                                        <td className="py-3 px-3 text-center">
                                            <button onClick={() => { setEditingResult({ ...r, ca1_score: r.ca1_score || 0, ca2_score: r.ca2_score || 0, obj_score: r.obj_score || 0, theory_score: r.theory_score || 0 }); setShowEditModal(true); }}
                                                className="text-blue-600 hover:text-blue-800 p-1" title="Edit">✏️</button>
                                            <button onClick={() => handleDeleteResult(r.id)} className="text-red-600 hover:text-red-800 p-1" title="Delete">🗑️</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg mx-4">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">➕ Add Result</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                        </div>
                        <form onSubmit={handleAddResult} className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <select value={newResult.student} onChange={(e) => setNewResult({ ...newResult, student: e.target.value })}
                                    className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white" required>
                                    <option value="">Select Student</option>
                                    {students.map(s => <option key={s.id} value={s.id}>{s.admission_number} - {s.first_name}</option>)}
                                </select>
                                <select value={newResult.subject} onChange={(e) => setNewResult({ ...newResult, subject: e.target.value })}
                                    className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white" required>
                                    <option value="">Select Subject</option>
                                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <select value={newResult.session} onChange={(e) => setNewResult({ ...newResult, session: e.target.value })}
                                    className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white" required>
                                    <option value="">Session</option>
                                    {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                                <select value={newResult.term} onChange={(e) => setNewResult({ ...newResult, term: e.target.value })}
                                    className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white" required>
                                    <option value="">Term</option>
                                    {terms.filter(t => !newResult.session || t.session === parseInt(newResult.session)).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-4 gap-3">
                                <div><label className="block text-sm font-medium mb-1">CA1 (15)</label>
                                    <input type="number" min="0" max="15" step="0.5" value={newResult.ca1_score} onChange={(e) => setNewResult({ ...newResult, ca1_score: e.target.value })}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white" required /></div>
                                <div><label className="block text-sm font-medium mb-1">CA2 (15)</label>
                                    <input type="number" min="0" max="15" step="0.5" value={newResult.ca2_score} onChange={(e) => setNewResult({ ...newResult, ca2_score: e.target.value })}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white" required /></div>
                                <div><label className="block text-sm font-medium mb-1">OBJ (30)</label>
                                    <input type="number" min="0" max="30" step="0.5" value={newResult.obj_score} onChange={(e) => setNewResult({ ...newResult, obj_score: e.target.value })}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white" required /></div>
                                <div><label className="block text-sm font-medium mb-1">Theory (40)</label>
                                    <input type="number" min="0" max="40" step="0.5" value={newResult.theory_score} onChange={(e) => setNewResult({ ...newResult, theory_score: e.target.value })}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white" required /></div>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                <p className="text-sm text-blue-800 dark:text-blue-200"><strong>Total:</strong> {calcTotal(newResult.ca1_score, newResult.ca2_score, newResult.obj_score, newResult.theory_score)} / 100</p>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium">Cancel</button>
                                <button type="submit" disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium">{loading ? 'Adding...' : 'Add'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && editingResult && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg mx-4">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">✏️ Edit Result</h3>
                            <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                        </div>
                        <form onSubmit={handleUpdateResult} className="p-4 space-y-4">
                            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                                <p className="text-sm text-gray-600 dark:text-gray-300"><strong>Student:</strong> {editingResult.student_name || editingResult.admission_number}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-300"><strong>Subject:</strong> {editingResult.subject_name}</p>
                            </div>
                            <div className="grid grid-cols-4 gap-3">
                                <div><label className="block text-sm font-medium mb-1">CA1 (15)</label>
                                    <input type="number" min="0" max="15" step="0.5" value={editingResult.ca1_score} onChange={(e) => setEditingResult({ ...editingResult, ca1_score: e.target.value })}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white" required /></div>
                                <div><label className="block text-sm font-medium mb-1">CA2 (15)</label>
                                    <input type="number" min="0" max="15" step="0.5" value={editingResult.ca2_score} onChange={(e) => setEditingResult({ ...editingResult, ca2_score: e.target.value })}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white" required /></div>
                                <div><label className="block text-sm font-medium mb-1">OBJ (30)</label>
                                    <input type="number" min="0" max="30" step="0.5" value={editingResult.obj_score} onChange={(e) => setEditingResult({ ...editingResult, obj_score: e.target.value })}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white" required /></div>
                                <div><label className="block text-sm font-medium mb-1">Theory (40)</label>
                                    <input type="number" min="0" max="40" step="0.5" value={editingResult.theory_score} onChange={(e) => setEditingResult({ ...editingResult, theory_score: e.target.value })}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white" required /></div>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                <p className="text-sm text-blue-800 dark:text-blue-200"><strong>New Total:</strong> {calcTotal(editingResult.ca1_score, editingResult.ca2_score, editingResult.obj_score, editingResult.theory_score)} / 100</p>
                                <p className="text-xs text-blue-600 dark:text-blue-400">Previous: {editingResult.total_score || 0}</p>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium">Cancel</button>
                                <button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium">{loading ? 'Updating...' : 'Update'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ExamResultsManager;