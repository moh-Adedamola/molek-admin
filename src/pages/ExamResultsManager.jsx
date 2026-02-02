/**
 * Exam Results Manager Component
 * Full CRUD operations for student exam results
 * - View all results with filtering
 * - Edit individual scores (CA, Theory, Exam)
 * - Delete results
 * - Add new results manually
 * - Recalculate positions
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { examResultsAPI, academicSessionsAPI, termsAPI, classLevelsAPI, subjectsAPI, studentsAPI } from '../api/endpoints';

export function ExamResultsManager() {
    // Data state
    const [results, setResults] = useState([]);
    const [students, setStudents] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [terms, setTerms] = useState([]);
    const [classLevels, setClassLevels] = useState([]);

    // Filter state
    const [filters, setFilters] = useState({
        session: '',
        term: '',
        class_level: '',
        student: '',
        subject: '',
    });

    // UI state
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [editingResult, setEditingResult] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    // New result form
    const [newResult, setNewResult] = useState({
        student: '',
        subject: '',
        session: '',
        term: '',
        ca_score: '',
        theory_score: '',
        exam_score: '',
    });

    // Fetch initial data
    useEffect(() => {
        fetchDropdownData();
    }, []);

    // Fetch results when filters change
    useEffect(() => {
        if (filters.session && filters.term) {
            fetchResults();
        }
    }, [filters.session, filters.term, filters.class_level]);

    const fetchDropdownData = async () => {
        try {
            const [sessionsRes, termsRes, classesRes, subjectsRes, studentsRes] = await Promise.all([
                academicSessionsAPI.list(),
                termsAPI.list(),
                classLevelsAPI.list(),
                subjectsAPI.list(),
                studentsAPI.list({ is_active: true }),
            ]);

            setSessions(sessionsRes.data.results || sessionsRes.data || []);
            setTerms(termsRes.data.results || termsRes.data || []);
            setClassLevels(classesRes.data.results || classesRes.data || []);
            setSubjects(subjectsRes.data.results || subjectsRes.data || []);
            setStudents(studentsRes.data.results || studentsRes.data || []);

            // Auto-select current session and term
            const currentSession = (sessionsRes.data.results || sessionsRes.data || []).find(s => s.is_current);
            const currentTerm = (termsRes.data.results || termsRes.data || []).find(t => t.is_current);

            if (currentSession) setFilters(f => ({ ...f, session: currentSession.id.toString() }));
            if (currentTerm) setFilters(f => ({ ...f, term: currentTerm.id.toString() }));
        } catch (err) {
            console.error('Failed to fetch dropdown data:', err);
            setMessage({ type: 'error', text: 'Failed to load data' });
        }
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
        } catch (err) {
            console.error('Failed to fetch results:', err);
            setMessage({ type: 'error', text: 'Failed to load results' });
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    // Get filtered terms based on selected session
    const filteredTerms = terms.filter(t => 
        !filters.session || t.session === parseInt(filters.session)
    );

    // Get filtered students based on selected class
    const filteredStudents = students.filter(s =>
        !filters.class_level || s.class_level === parseInt(filters.class_level)
    );

    // ============ CREATE ============
    const handleAddResult = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validate scores
            const ca = parseFloat(newResult.ca_score) || 0;
            const theory = parseFloat(newResult.theory_score) || 0;
            const exam = parseFloat(newResult.exam_score) || 0;

            if (ca > 30) {
                setMessage({ type: 'error', text: 'CA score cannot exceed 30' });
                setLoading(false);
                return;
            }
            if (theory + exam > 70) {
                setMessage({ type: 'error', text: 'Theory + Exam cannot exceed 70' });
                setLoading(false);
                return;
            }

            await examResultsAPI.create({
                student: parseInt(newResult.student),
                subject: parseInt(newResult.subject),
                session: parseInt(newResult.session),
                term: parseInt(newResult.term),
                ca_score: ca,
                theory_score: theory,
                exam_score: exam,
            });

            setMessage({ type: 'success', text: 'Result added successfully!' });
            setShowAddModal(false);
            setNewResult({
                student: '',
                subject: '',
                session: filters.session,
                term: filters.term,
                ca_score: '',
                theory_score: '',
                exam_score: '',
            });
            fetchResults();
        } catch (err) {
            const errorMsg = err.response?.data?.detail || err.response?.data?.error || 'Failed to add result';
            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setLoading(false);
        }
    };

    // ============ UPDATE ============
    const handleEditClick = (result) => {
        setEditingResult({
            ...result,
            ca_score: result.ca_score || 0,
            theory_score: result.theory_score || 0,
            exam_score: result.exam_score || 0,
        });
        setShowEditModal(true);
    };

    const handleUpdateResult = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const ca = parseFloat(editingResult.ca_score) || 0;
            const theory = parseFloat(editingResult.theory_score) || 0;
            const exam = parseFloat(editingResult.exam_score) || 0;

            if (ca > 30) {
                setMessage({ type: 'error', text: 'CA score cannot exceed 30' });
                setLoading(false);
                return;
            }
            if (theory + exam > 70) {
                setMessage({ type: 'error', text: 'Theory + Exam cannot exceed 70' });
                setLoading(false);
                return;
            }

            await examResultsAPI.update(editingResult.id, {
                ca_score: ca,
                theory_score: theory,
                exam_score: exam,
            });

            setMessage({ type: 'success', text: 'Result updated successfully!' });
            setShowEditModal(false);
            setEditingResult(null);
            fetchResults();
        } catch (err) {
            const errorMsg = err.response?.data?.detail || 'Failed to update result';
            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setLoading(false);
        }
    };

    // ============ DELETE ============
    const handleDeleteResult = async (resultId) => {
        if (!window.confirm('Are you sure you want to delete this result? This cannot be undone.')) {
            return;
        }

        setLoading(true);
        try {
            await examResultsAPI.delete(resultId);
            setMessage({ type: 'success', text: 'Result deleted successfully!' });
            fetchResults();
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to delete result' });
        } finally {
            setLoading(false);
        }
    };

    // ============ RECALCULATE POSITIONS ============
    const handleRecalculatePositions = async () => {
        if (!filters.session || !filters.term) {
            setMessage({ type: 'error', text: 'Please select session and term first' });
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://molek-school-backend-production.up.railway.app'}/api/exam-results/recalculate-positions/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                },
                body: JSON.stringify({
                    session: parseInt(filters.session),
                    term: parseInt(filters.term),
                    class_level: filters.class_level ? parseInt(filters.class_level) : null,
                }),
            });

            const data = await response.json();
            
            if (response.ok) {
                setMessage({ type: 'success', text: `Positions recalculated! ${data.subjects_processed} subjects processed.` });
                fetchResults();
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to recalculate positions' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to recalculate positions' });
        } finally {
            setLoading(false);
        }
    };

    // Grade color helper
    const getGradeColor = (grade) => {
        const colors = {
            A: 'bg-green-100 text-green-800',
            B: 'bg-blue-100 text-blue-800',
            C: 'bg-yellow-100 text-yellow-800',
            D: 'bg-orange-100 text-orange-800',
            F: 'bg-red-100 text-red-800',
        };
        return colors[grade] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Exam Results Manager</h1>
                    <p className="text-sm text-gray-600">View, edit, and manage student exam results</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleRecalculatePositions}
                        disabled={loading}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                        🔄 Recalculate Positions
                    </button>
                    <button
                        onClick={() => {
                            setNewResult({
                                student: '',
                                subject: '',
                                session: filters.session,
                                term: filters.term,
                                ca_score: '',
                                theory_score: '',
                                exam_score: '',
                            });
                            setShowAddModal(true);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                        ➕ Add Result
                    </button>
                </div>
            </div>

            {/* Message */}
            {message.text && (
                <div className={`mb-4 p-4 rounded-lg ${
                    message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
                    'bg-red-100 text-red-800 border border-red-200'
                }`}>
                    {message.text}
                    <button onClick={() => setMessage({ type: '', text: '' })} className="float-right font-bold">×</button>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">🔍 Filter Results</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Session</label>
                        <select
                            value={filters.session}
                            onChange={(e) => handleFilterChange('session', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All Sessions</option>
                            {sessions.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.name} {s.is_current ? '(Current)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Term</label>
                        <select
                            value={filters.term}
                            onChange={(e) => handleFilterChange('term', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All Terms</option>
                            {filteredTerms.map(t => (
                                <option key={t.id} value={t.id}>
                                    {t.name} {t.is_current ? '(Current)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Class</label>
                        <select
                            value={filters.class_level}
                            onChange={(e) => handleFilterChange('class_level', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All Classes</option>
                            {classLevels.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
                        <select
                            value={filters.subject}
                            onChange={(e) => handleFilterChange('subject', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All Subjects</option>
                            {subjects.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Student</label>
                        <select
                            value={filters.student}
                            onChange={(e) => handleFilterChange('student', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All Students</option>
                            {filteredStudents.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.admission_number} - {s.first_name} {s.last_name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex gap-3 mt-4">
                    <button
                        onClick={fetchResults}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        {loading ? 'Loading...' : '🔍 Search'}
                    </button>
                    <button
                        onClick={() => setFilters({ session: '', term: '', class_level: '', student: '', subject: '' })}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Results Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-800">
                        📊 Results ({results.length})
                    </h2>
                </div>

                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Loading results...</p>
                    </div>
                ) : results.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <svg className="mx-auto h-12 w-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p>No results found. Select session and term to view results.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Student</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Subject</th>
                                    <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">CA<br/>(30)</th>
                                    <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">Theory<br/>(40)</th>
                                    <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">Exam<br/>(30)</th>
                                    <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">Total<br/>(100)</th>
                                    <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">Grade</th>
                                    <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">Position</th>
                                    <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((result, idx) => (
                                    <tr key={result.id} className={`border-b border-gray-100 hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                        <td className="py-3 px-4">
                                            <div className="font-medium text-gray-800">{result.student_name || result.admission_number}</div>
                                            <div className="text-xs text-gray-500">{result.admission_number}</div>
                                        </td>
                                        <td className="py-3 px-4 text-gray-700">{result.subject_name}</td>
                                        <td className="py-3 px-4 text-center font-medium">{result.ca_score || 0}</td>
                                        <td className="py-3 px-4 text-center font-medium">{result.theory_score || 0}</td>
                                        <td className="py-3 px-4 text-center font-medium">{result.exam_score || 0}</td>
                                        <td className="py-3 px-4 text-center font-bold text-blue-600">{result.total_score || 0}</td>
                                        <td className="py-3 px-4 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getGradeColor(result.grade)}`}>
                                                {result.grade || '-'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-center text-gray-600">
                                            {result.position ? `${result.position}/${result.total_students || '-'}` : '-'}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => handleEditClick(result)}
                                                    className="text-blue-600 hover:text-blue-800 p-1"
                                                    title="Edit"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteResult(result.id)}
                                                    className="text-red-600 hover:text-red-800 p-1"
                                                    title="Delete"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Result Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-800">➕ Add New Result</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                        </div>
                        <form onSubmit={handleAddResult} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                                <select
                                    value={newResult.student}
                                    onChange={(e) => setNewResult({ ...newResult, student: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                >
                                    <option value="">Select Student</option>
                                    {students.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.admission_number} - {s.first_name} {s.last_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                <select
                                    value={newResult.subject}
                                    onChange={(e) => setNewResult({ ...newResult, subject: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                >
                                    <option value="">Select Subject</option>
                                    {subjects.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Session</label>
                                    <select
                                        value={newResult.session}
                                        onChange={(e) => setNewResult({ ...newResult, session: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    >
                                        <option value="">Select</option>
                                        {sessions.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
                                    <select
                                        value={newResult.term}
                                        onChange={(e) => setNewResult({ ...newResult, term: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    >
                                        <option value="">Select</option>
                                        {terms.filter(t => !newResult.session || t.session === parseInt(newResult.session)).map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">CA Score (30)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="30"
                                        step="0.5"
                                        value={newResult.ca_score}
                                        onChange={(e) => setNewResult({ ...newResult, ca_score: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Theory (40)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="40"
                                        step="0.5"
                                        value={newResult.theory_score}
                                        onChange={(e) => setNewResult({ ...newResult, theory_score: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Exam (30)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="30"
                                        step="0.5"
                                        value={newResult.exam_score}
                                        onChange={(e) => setNewResult({ ...newResult, exam_score: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="bg-blue-50 p-3 rounded-lg">
                                <p className="text-sm text-blue-800">
                                    <strong>Total:</strong> {(parseFloat(newResult.ca_score) || 0) + (parseFloat(newResult.theory_score) || 0) + (parseFloat(newResult.exam_score) || 0)} / 100
                                </p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition-colors"
                                >
                                    {loading ? 'Adding...' : 'Add Result'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Result Modal */}
            {showEditModal && editingResult && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-800">✏️ Edit Result</h3>
                            <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                        </div>
                        <form onSubmit={handleUpdateResult} className="p-4 space-y-4">
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-sm text-gray-600">
                                    <strong>Student:</strong> {editingResult.student_name || editingResult.admission_number}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <strong>Subject:</strong> {editingResult.subject_name}
                                </p>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">CA Score (30)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="30"
                                        step="0.5"
                                        value={editingResult.ca_score}
                                        onChange={(e) => setEditingResult({ ...editingResult, ca_score: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Theory (40)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="40"
                                        step="0.5"
                                        value={editingResult.theory_score}
                                        onChange={(e) => setEditingResult({ ...editingResult, theory_score: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Exam (30)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="30"
                                        step="0.5"
                                        value={editingResult.exam_score}
                                        onChange={(e) => setEditingResult({ ...editingResult, exam_score: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="bg-blue-50 p-3 rounded-lg">
                                <p className="text-sm text-blue-800">
                                    <strong>New Total:</strong> {(parseFloat(editingResult.ca_score) || 0) + (parseFloat(editingResult.theory_score) || 0) + (parseFloat(editingResult.exam_score) || 0)} / 100
                                </p>
                                <p className="text-xs text-blue-600 mt-1">
                                    Previous Total: {editingResult.total_score || 0}
                                </p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors"
                                >
                                    {loading ? 'Updating...' : 'Update Result'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ExamResultsManager;