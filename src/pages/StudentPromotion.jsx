import { useState, useEffect } from 'react';
import { studentsAPI, academicSessionsAPI, classLevelsAPI } from '../api/endpoints';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import api from '../api/endpoints';

const CLASS_PROGRESSION = {
    'JSS1': 'JSS2', 'JSS2': 'JSS3', 'JSS3': 'SS1',
    'SS1': 'SS2', 'SS2': 'SS3', 'SS3': 'GRADUATED'
};

// Helper to import api instance
function getApi() {
    try {
        // endpoints.js exports a default api instance
        return api;
    } catch {
        return null;
    }
}

export function StudentPromotion() {
    const [loading, setLoading] = useState(false);
    const [promoting, setPromoting] = useState(false);
    const [alert, setAlert] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [classLevels, setClassLevels] = useState([]);
    const [students, setStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [promotionStats, setPromotionStats] = useState(null);
    const [rulesApplied, setRulesApplied] = useState(null);
    const [expandedStudent, setExpandedStudent] = useState(null);

    const [filters, setFilters] = useState({
        classLevel: '',
        sessionId: ''
    });

    useEffect(() => {
        loadSessions();
        loadClassLevels();
    }, []);

    const loadSessions = async () => {
        try {
            const res = await academicSessionsAPI.list();
            const sessionList = res.data?.results || res.data || [];
            setSessions(sessionList);
            const currentSession = sessionList.find(s => s.is_current || s.is_active);
            if (currentSession) {
                setFilters(prev => ({ ...prev, sessionId: currentSession.id.toString() }));
            }
        } catch (error) {

        }
    };

    const loadClassLevels = async () => {
        try {
            const res = await classLevelsAPI.list();
            const classList = res.data?.results || res.data || [];
            setClassLevels(classList);
        } catch (error) {

        }
    };

    const loadPromotionData = async () => {
        if (!filters.classLevel) {
            setAlert({ type: 'error', message: 'Please select a class level' });
            return;
        }
        if (!filters.sessionId) {
            setAlert({ type: 'error', message: 'Please select a session' });
            return;
        }

        const currentClass = classLevels.find(c => c.id.toString() === filters.classLevel);
        if (!currentClass) return;

        try {
            setLoading(true);
            setStudents([]);
            setSelectedStudents([]);
            setPromotionStats(null);
            setRulesApplied(null);

            // Try the new promotion API first
            const res = await studentsAPI.getPromotionAnalysis({
                class_level: currentClass.name,
                session_id: filters.sessionId
            });

            const data = res.data;
            if (data.success && data.students) {
                setStudents(data.students);
                setPromotionStats(data.statistics);
                setRulesApplied(data.rules_applied);

                // Auto-select promoted students
                const promoted = data.students
                    .filter(s => s.promotion_status === 'Promoted' || s.promotion_status === 'Promoted with Carryover')
                    .map(s => s.student_id);
                setSelectedStudents(promoted);
            }
        } catch (error) {
            // Fallback: load students without promotion analysis
            console.warn('Promotion API not available, falling back to student list:', error.message);
            try {
                const res = await studentsAPI.list({
                    class_level: filters.classLevel,
                    is_active: true
                });
                const studentList = res.data?.results || res.data || [];
                const mapped = studentList.map(s => ({
                    student_id: s.id,
                    admission_number: s.admission_number,
                    full_name: s.full_name || `${s.first_name} ${s.last_name}`,
                    promotion_status: 'No Data',
                    promotion_status_display: 'No Data',
                    cumulative_average: 0,
                    remarks: 'Promotion analysis not available',
                    subject_details: [],
                    failed_compulsory: [],
                    failed_other: [],
                }));
                setStudents(mapped);
                setSelectedStudents(mapped.map(s => s.student_id));
            } catch (err2) {
                setAlert({ type: 'error', message: err2.response?.data?.error || 'Failed to load students' });
            }
        } finally {
            setLoading(false);
        }
    };

    const toggleStudent = (studentId) => {
        setSelectedStudents(prev =>
            prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
        );
    };

    const selectAll = () => setSelectedStudents(students.map(s => s.student_id));
    const selectNone = () => setSelectedStudents([]);
    const selectPromoted = () => {
        setSelectedStudents(
            students.filter(s => s.promotion_status === 'Promoted' || s.promotion_status === 'Promoted with Carryover')
                .map(s => s.student_id)
        );
    };

    const getNextClass = () => {
        const currentClass = classLevels.find(c => c.id.toString() === filters.classLevel);
        return currentClass ? (CLASS_PROGRESSION[currentClass.name] || 'GRADUATED') : '';
    };

    const handlePromote = async () => {
        if (selectedStudents.length === 0) {
            setAlert({ type: 'error', message: 'Please select at least one student' });
            return;
        }
        const currentClass = classLevels.find(c => c.id.toString() === filters.classLevel);
        const nextClass = getNextClass();
        try {
            setPromoting(true);
            const res = await studentsAPI.promoteStudents({
                student_ids: selectedStudents,
                from_class: currentClass?.name,
                to_class: nextClass,
                session_id: parseInt(filters.sessionId)
            });
            setAlert({
                type: 'success',
                message: `Successfully promoted ${res.data?.promoted || selectedStudents.length} student(s)${res.data?.graduated > 0 ? ` and graduated ${res.data.graduated}` : ''}`
            });
            setIsConfirmOpen(false);
            setSelectedStudents([]);
            loadPromotionData();
        } catch (error) {
            setAlert({ type: 'error', message: error.response?.data?.error || 'Promotion failed' });
        } finally {
            setPromoting(false);
        }
    };

    const getStatusColor = (status) => {
        if (!status) return 'bg-gray-100 text-gray-800';
        if (status.includes('Promoted with Carryover')) return 'bg-yellow-100 text-yellow-800';
        if (status.includes('Promoted')) return 'bg-green-100 text-green-800';
        if (status.includes('Not Promoted')) return 'bg-red-100 text-red-800';
        return 'bg-gray-100 text-gray-800';
    };

    const getStatusIcon = (status) => {
        if (!status) return '';
        if (status.includes('Promoted with Carryover')) return '';
        if (status.includes('Promoted')) return '';
        if (status.includes('Not Promoted')) return '';
        return '';
    };

    const nextClass = getNextClass();
    const currentClassName = classLevels.find(c => c.id.toString() === filters.classLevel)?.name || '';

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Student Promotion</h1>
                <p className="text-gray-600 mt-1">Analyze and promote students based on configurable rules</p>
            </div>

            {/* Alert */}
            {alert && (
                <div className={`p-4 rounded-xl border-2 flex items-center justify-between ${
                    alert.type === 'success' ? 'bg-green-50 border-green-300 text-green-800' :
                    alert.type === 'error' ? 'bg-red-50 border-red-300 text-red-800' :
                    'bg-blue-50 border-blue-300 text-blue-800'
                }`}>
                    <span>{alert.type === 'success' ? '' : alert.type === 'error' ? '' : ''} {alert.message}</span>
                    <button onClick={() => setAlert(null)} className="text-lg hover:opacity-70"></button>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4"> Select Class & Session</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Session</label>
                        <select value={filters.sessionId} onChange={(e) => setFilters(prev => ({ ...prev, sessionId: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                            <option value="">Select Session</option>
                            {sessions.map(s => (
                                <option key={s.id} value={s.id}>{s.name} {s.is_current ? '(Current)' : ''}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Class Level</label>
                        <select value={filters.classLevel} onChange={(e) => setFilters(prev => ({ ...prev, classLevel: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                            <option value="">Select Class</option>
                            {classLevels.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <Button variant="primary" onClick={loadPromotionData} loading={loading} className="w-full">
                             Analyze Promotion
                        </Button>
                    </div>
                </div>

                {currentClassName && nextClass && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                        <div className="flex items-center gap-3">
                            
                            <div>
                                <p className="font-bold text-blue-900">
                                    Promotion Path: {currentClassName} → {nextClass}
                                </p>
                                <p className="text-sm text-blue-700">
                                    {nextClass === 'GRADUATED' ? 'Students will be marked as graduated' : `Students will be moved to ${nextClass}`}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Rules Applied */}
            {rulesApplied && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-3"> Promotion Rules Applied</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-gray-500">Pass Mark</p>
                            <p className="font-bold text-gray-900 text-lg">{rulesApplied.pass_mark}%</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-gray-500">Compulsory</p>
                            <p className="font-bold text-gray-900">{rulesApplied.compulsory_subjects?.join(', ') || 'None'}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-gray-500">Min Additional</p>
                            <p className="font-bold text-gray-900 text-lg">{rulesApplied.minimum_additional}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-gray-500">Total Min Subjects</p>
                            <p className="font-bold text-gray-900 text-lg">{rulesApplied.total_minimum}</p>
                        </div>
                        {rulesApplied.allow_carryover && (
                            <div className="bg-yellow-50 p-3 rounded-lg col-span-2">
                                <p className="text-yellow-600">Carryover Allowed: max {rulesApplied.max_carryover} subjects</p>
                            </div>
                        )}
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-gray-500">Mode</p>
                            <p className="font-bold text-gray-900 capitalize">{rulesApplied.mode}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Statistics */}
            {promotionStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-green-50 rounded-2xl p-5 border-2 border-green-200 text-center">
                        <p className="text-3xl font-bold text-green-700">{promotionStats.promoted}</p>
                        <p className="text-sm text-green-600 mt-1"> Promoted</p>
                    </div>
                    <div className="bg-yellow-50 rounded-2xl p-5 border-2 border-yellow-200 text-center">
                        <p className="text-3xl font-bold text-yellow-700">{promotionStats.promoted_with_carryover || 0}</p>
                        <p className="text-sm text-yellow-600 mt-1"> With Carryover</p>
                    </div>
                    <div className="bg-red-50 rounded-2xl p-5 border-2 border-red-200 text-center">
                        <p className="text-3xl font-bold text-red-700">{promotionStats.not_promoted}</p>
                        <p className="text-sm text-red-600 mt-1"> Not Promoted</p>
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-5 border-2 border-gray-200 text-center">
                        <p className="text-3xl font-bold text-gray-700">{promotionStats.no_data || 0}</p>
                        <p className="text-sm text-gray-600 mt-1"> No Data</p>
                    </div>
                </div>
            )}

            {/* Student List */}
            {students.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">
                            Students in {currentClassName} ({students.length})
                        </h2>
                        <div className="flex gap-2 flex-wrap">
                            <Button variant="outline" size="sm" onClick={selectAll}>All</Button>
                            <Button variant="outline" size="sm" onClick={selectPromoted}>Promoted Only</Button>
                            <Button variant="outline" size="sm" onClick={selectNone}>None</Button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase">Select</th>
                                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase">Adm No.</th>
                                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase">Name</th>
                                    <th className="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase">Avg</th>
                                    <th className="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase">Passed</th>
                                    <th className="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase">Status</th>
                                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase">Remarks</th>
                                    <th className="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {students.map((student) => (
                                    <>
                                        <tr key={student.student_id}
                                            className={`hover:bg-gray-50 ${
                                                selectedStudents.includes(student.student_id) ? 'bg-blue-50' : ''
                                            }`}>
                                            <td className="px-3 py-3">
                                                <input type="checkbox"
                                                    checked={selectedStudents.includes(student.student_id)}
                                                    onChange={() => toggleStudent(student.student_id)}
                                                    className="h-4 w-4 text-blue-600 rounded border-gray-300" />
                                            </td>
                                            <td className="px-3 py-3 font-mono text-sm text-gray-900">
                                                {student.admission_number}
                                            </td>
                                            <td className="px-3 py-3 font-medium text-gray-900">
                                                {student.full_name}
                                            </td>
                                            <td className="px-3 py-3 text-center font-bold text-gray-900">
                                                {student.cumulative_average}%
                                            </td>
                                            <td className="px-3 py-3 text-center text-sm">
                                                <span className="font-semibold text-gray-900">
                                                    {student.total_subjects_passed || 0}
                                                </span>
                                                <span className="text-gray-500">/{student.total_minimum_required || '?'}</span>
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(student.promotion_status)}`}>
                                                    {getStatusIcon(student.promotion_status)} {student.promotion_status_display || student.promotion_status}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 text-sm text-gray-600 max-w-xs truncate" title={student.remarks}>
                                                {student.remarks}
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                {student.subject_details?.length > 0 && (
                                                    <button onClick={() => setExpandedStudent(expandedStudent === student.student_id ? null : student.student_id)}
                                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                                        {expandedStudent === student.student_id ? '▲ Hide' : '▼ Show'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                        {/* Expanded Subject Details */}
                                        {expandedStudent === student.student_id && student.subject_details?.length > 0 && (
                                            <tr key={`${student.student_id}-details`}>
                                                <td colSpan="8" className="px-3 py-3 bg-gray-50">
                                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                                        {student.subject_details.map((subj, i) => (
                                                            <div key={i} className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                                                                subj.passed ? 'bg-green-50' : 'bg-red-50'
                                                            }`}>
                                                                <span>{subj.passed ? '' : ''}</span>
                                                                <span className={`font-medium ${subj.passed ? 'text-green-800' : 'text-red-800'}`}>
                                                                    {subj.subject_name}
                                                                </span>
                                                                <span className="ml-auto font-bold">
                                                                    {subj.score}%
                                                                </span>
                                                                {subj.is_compulsory && (
                                                                    <span className="text-xs bg-blue-200 text-blue-800 px-1 rounded">REQ</span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {student.carryover_subjects?.length > 0 && (
                                                        <div className="mt-2 p-2 bg-yellow-50 rounded-lg text-sm text-yellow-800">
                                                             Carryover: {student.carryover_subjects.join(', ')}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Promote Button */}
                    <div className="mt-6 flex items-center justify-between border-t-2 border-gray-200 pt-4">
                        <div className="text-sm text-gray-600">
                             Selected: <strong>{selectedStudents.length}</strong> of {students.length} students
                        </div>
                        <Button variant="primary" onClick={() => setIsConfirmOpen(true)}
                            disabled={selectedStudents.length === 0 || promoting}>
                            {nextClass === 'GRADUATED'
                                ? <> Graduate Selected ({selectedStudents.length})</>
                                : <> Promote Selected ({selectedStudents.length}) to {nextClass}</>
                            }
                        </Button>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!loading && filters.classLevel && students.length === 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                    
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No Students Found</h3>
                    <p className="text-gray-600">
                        No active students found in {currentClassName}. Click "Analyze Promotion" to load data.
                    </p>
                </div>
            )}

            {/* Confirmation Modal */}
            <Modal isOpen={isConfirmOpen}
                title={nextClass === 'GRADUATED' ? 'Confirm Graduation' : 'Confirm Promotion'}
                onClose={() => setIsConfirmOpen(false)}
                actions={[
                    { label: "Cancel", onClick: () => setIsConfirmOpen(false) },
                    { label: promoting ? "Processing..." : (nextClass === 'GRADUATED' ? 'Graduate' : 'Promote'),
                      variant: "primary", onClick: handlePromote, disabled: promoting },
                ]}>
                <div className="space-y-3">
                    <p className="text-gray-600">
                        {nextClass === 'GRADUATED'
                            ? `Graduate ${selectedStudents.length} student(s)? They will be marked as graduated.`
                            : `Promote ${selectedStudents.length} student(s) from ${currentClassName} to ${nextClass}?`
                        }
                    </p>
                    {rulesApplied?.mode === 'recommend' && (
                        <div className="p-3 bg-yellow-50 rounded-lg text-sm text-yellow-800">
                             Mode: Recommend — you are overriding system recommendations for manually selected students.
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}