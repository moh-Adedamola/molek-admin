import { useState, useEffect } from 'react';
import { studentsAPI, academicSessionsAPI, classLevelsAPI } from '../api/endpoints';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';

const CLASS_PROGRESSION = {
    'JSS1': 'JSS2',
    'JSS2': 'JSS3',
    'JSS3': 'SS1',
    'SS1': 'SS2',
    'SS2': 'SS3',
    'SS3': 'GRADUATED'
};

export function StudentPromotion() {
    const [loading, setLoading] = useState(false);
    const [promoting, setPromoting] = useState(false);
    const [alert, setAlert] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [classLevels, setClassLevels] = useState([]);
    const [students, setStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

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

            // Auto-select current session
            const currentSession = sessionList.find(s => s.is_current || s.is_active);
            if (currentSession) {
                setFilters(prev => ({ ...prev, sessionId: currentSession.id.toString() }));
            }
        } catch (error) {
            console.error('Failed to load sessions:', error);
        }
    };

    const loadClassLevels = async () => {
        try {
            const res = await classLevelsAPI.list();
            const classList = res.data?.results || res.data || [];
            setClassLevels(classList);
        } catch (error) {
            console.error('Failed to load class levels:', error);
        }
    };

    const loadStudents = async () => {
        if (!filters.classLevel) {
            setAlert({ type: 'error', message: 'Please select a class level' });
            return;
        }

        try {
            setLoading(true);
            setStudents([]);
            setSelectedStudents([]);

            const res = await studentsAPI.list({
                class_level: filters.classLevel,
                is_active: true
            });

            const studentList = res.data?.results || res.data || [];
            setStudents(studentList);

            // Auto-select all students by default
            setSelectedStudents(studentList.map(s => s.id));

        } catch (error) {
            setAlert({
                type: 'error',
                message: error.response?.data?.error || 'Failed to load students'
            });
        } finally {
            setLoading(false);
        }
    };

    const toggleStudent = (studentId) => {
        setSelectedStudents(prev => {
            if (prev.includes(studentId)) {
                return prev.filter(id => id !== studentId);
            } else {
                return [...prev, studentId];
            }
        });
    };

    const selectAll = () => {
        setSelectedStudents(students.map(s => s.id));
    };

    const selectNone = () => {
        setSelectedStudents([]);
    };

    const getNextClass = () => {
        const currentClass = classLevels.find(c => c.id.toString() === filters.classLevel);
        if (currentClass) {
            return CLASS_PROGRESSION[currentClass.name] || 'GRADUATED';
        }
        return '';
    };

    const handlePromote = async () => {
        if (selectedStudents.length === 0) {
            setAlert({ type: 'error', message: 'Please select at least one student to promote' });
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
                message: `Successfully promoted ${res.data?.promoted || selectedStudents.length} student(s)${res.data?.graduated > 0 ? ` and graduated ${res.data.graduated} student(s)` : ''}`
            });

            setIsConfirmOpen(false);
            setSelectedStudents([]);

            // Reload students
            loadStudents();

        } catch (error) {
            setAlert({
                type: 'error',
                message: error.response?.data?.error || error.response?.data?.detail || 'Promotion failed'
            });
        } finally {
            setPromoting(false);
        }
    };

    const nextClass = getNextClass();
    const currentClassName = classLevels.find(c => c.id.toString() === filters.classLevel)?.name || '';

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Student Promotion</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Promote students to the next class level
                </p>
            </div>

            {/* Alert */}
            {alert && (
                <div className={`p-4 rounded-xl border-2 flex items-center justify-between ${
                    alert.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300' :
                    alert.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300' :
                    'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
                }`}>
                    <span>{alert.message}</span>
                    <button onClick={() => setAlert(null)} className="ml-4 text-lg font-bold">&times;</button>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Select Class to Promote</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Academic Session
                        </label>
                        <select
                            value={filters.sessionId}
                            onChange={(e) => setFilters({ ...filters, sessionId: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        >
                            <option value="">Select Session</option>
                            {sessions.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.name}{(s.is_current || s.is_active) ? ' (Current)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Class Level <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={filters.classLevel}
                            onChange={(e) => setFilters({ ...filters, classLevel: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        >
                            <option value="">Select Class</option>
                            {classLevels.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <Button
                            variant="primary"
                            onClick={loadStudents}
                            disabled={!filters.classLevel || loading}
                            loading={loading}
                            className="w-full"
                        >
                            🔍 Load Students
                        </Button>
                    </div>
                </div>

                {currentClassName && nextClass && (
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl">📈</span>
                            <div>
                                <p className="font-bold text-blue-900 dark:text-blue-100">
                                    Promotion Path: {currentClassName} → {nextClass}
                                </p>
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    {nextClass === 'GRADUATED' 
                                        ? 'These students will be marked as graduated' 
                                        : `Students will be moved to ${nextClass}`
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Student List */}
            {students.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            Students in {currentClassName} ({students.length})
                        </h2>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={selectAll}>
                                Select All
                            </Button>
                            <Button variant="outline" size="sm" onClick={selectNone}>
                                Select None
                            </Button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                                        Select
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                                        Admission No.
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                                        Full Name
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                                        Gender
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {students.map((student) => (
                                    <tr
                                        key={student.id}
                                        className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                                            selectedStudents.includes(student.id)
                                                ? 'bg-blue-50 dark:bg-blue-900/20'
                                                : ''
                                        }`}
                                    >
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedStudents.includes(student.id)}
                                                onChange={() => toggleStudent(student.id)}
                                                className="h-4 w-4 text-blue-600 rounded border-gray-300"
                                            />
                                        </td>
                                        <td className="px-4 py-3 font-mono text-sm text-gray-900 dark:text-white">
                                            {student.admission_number}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                {student.passport ? (
                                                    <img
                                                        src={student.passport}
                                                        alt={student.full_name || student.first_name}
                                                        className="w-8 h-8 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-xl">🎓</span>
                                                )}
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {student.full_name || `${student.first_name} ${student.middle_name || ''} ${student.last_name}`.trim()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {student.gender === 'M' ? '👨' : '👩'}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full px-3 py-1 text-xs font-semibold">
                                                Active
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Promote Button */}
                    <div className="mt-6 flex items-center justify-between border-t-2 border-gray-200 dark:border-gray-700 pt-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            ⚠️ Selected: <strong>{selectedStudents.length}</strong> of {students.length} students
                        </div>
                        <Button
                            variant="primary"
                            onClick={() => setIsConfirmOpen(true)}
                            disabled={selectedStudents.length === 0 || promoting}
                        >
                            {nextClass === 'GRADUATED' ? (
                                <>🎓 Graduate Selected ({selectedStudents.length})</>
                            ) : (
                                <>📈 Promote Selected ({selectedStudents.length}) to {nextClass}</>
                            )}
                        </Button>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!loading && filters.classLevel && students.length === 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
                    <span className="text-5xl block mb-4">🎓</span>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Students Found</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                        No active students found in {currentClassName} for the selected session.
                    </p>
                </div>
            )}

            {/* Confirmation Modal */}
            <Modal
                isOpen={isConfirmOpen}
                title={nextClass === 'GRADUATED' ? 'Confirm Graduation' : 'Confirm Promotion'}
                onClose={() => setIsConfirmOpen(false)}
                actions={[
                    { label: "Cancel", onClick: () => setIsConfirmOpen(false) },
                    { 
                        label: promoting ? "Processing..." : (nextClass === 'GRADUATED' ? 'Graduate' : 'Promote'),
                        variant: "primary",
                        onClick: handlePromote,
                        disabled: promoting
                    },
                ]}
            >
                <p className="text-gray-600 dark:text-gray-400">
                    {nextClass === 'GRADUATED'
                        ? `Are you sure you want to graduate ${selectedStudents.length} student(s)? They will be marked as graduated and removed from the active student list.`
                        : `Are you sure you want to promote ${selectedStudents.length} student(s) from ${currentClassName} to ${nextClass}?`
                    }
                </p>
            </Modal>
        </div>
    );
}