import { useEffect, useState } from "react";
import {
    academicSessionsAPI,
    termsAPI,
    classLevelsAPI,
    subjectsAPI
} from "../api/endpoints";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

export function AcademicSetup() {
    // State
    const [sessions, setSessions] = useState([]);
    const [terms, setTerms] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Session Form
    const [sessionForm, setSessionForm] = useState({
        name: "",
        start_date: "",
        end_date: "",
        is_current: false
    });

    // Term Form
    const [termForm, setTermForm] = useState({
        session: "",
        name: "First Term",
        start_date: "",
        end_date: "",
        is_current: false
    });

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            const [sessionsRes, termsRes, classesRes, subjectsRes] = await Promise.all([
                academicSessionsAPI.list(),
                termsAPI.list(),
                classLevelsAPI.list(),
                subjectsAPI.list()
            ]);

            setSessions(sessionsRes.data.results || sessionsRes.data || []);
            setTerms(termsRes.data.results || termsRes.data || []);
            setClasses(classesRes.data.results || classesRes.data || []);
            setSubjects(subjectsRes.data.results || subjectsRes.data || []);
        } catch (err) {
            console.error("Failed to fetch data:", err);
        }
    };

    // ============================================
    // CREATE ALL CLASS LEVELS AT ONCE
    // ============================================
    const createAllClassLevels = async () => {
        setLoading(true);
        setError("");
        setSuccess("");

        const classLevelsData = [
            { name: "JSS1", order: 1 },
            { name: "JSS2", order: 2 },
            { name: "JSS3", order: 3 },
            { name: "SS1", order: 4 },
            { name: "SS2", order: 5 },
            { name: "SS3", order: 6 }
        ];

        try {
            let created = 0;
            for (const classData of classLevelsData) {
                try {
                    await classLevelsAPI.create(classData);
                    created++;
                } catch (err) {
                    // Skip if already exists
                    if (!err.response?.data?.name?.includes("already exists")) {
                        console.error(`Failed to create ${classData.name}:`, err);
                    }
                }
            }

            await fetchAllData();
            setSuccess(`✓ Created ${created} class levels successfully!`);
        } catch (err) {
            setError("Failed to create class levels: " + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // CREATE ACADEMIC SESSION
    // ============================================
    const handleCreateSession = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            await academicSessionsAPI.create(sessionForm);
            setSuccess("✓ Academic session created successfully!");
            setSessionForm({ name: "", start_date: "", end_date: "", is_current: false });
            await fetchAllData();
        } catch (err) {
            setError("Failed to create session: " + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // CREATE TERM
    // ============================================
    const handleCreateTerm = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            await termsAPI.create(termForm);
            setSuccess("✓ Term created successfully!");
            setTermForm({ session: "", name: "First Term", start_date: "", end_date: "", is_current: false });
            await fetchAllData();
        } catch (err) {
            setError("Failed to create term: " + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // DELETE HANDLERS
    // ============================================
    const handleDelete = async (id, type) => {
        if (!window.confirm("Are you sure you want to delete this?")) return;

        setLoading(true);
        try {
            if (type === "session") await academicSessionsAPI.delete(id);
            if (type === "term") await termsAPI.delete(id);
            if (type === "class") await classLevelsAPI.delete(id);
            if (type === "subject") await subjectsAPI.delete(id);

            await fetchAllData();
            setSuccess("✓ Deleted successfully!");
        } catch (err) {
            setError("Failed to delete: " + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleSetActive = async (id, type) => {
        setLoading(true);
        try {
            if (type === "session") await academicSessionsAPI.setActive(id);
            if (type === "term") await termsAPI.setActive(id);

            await fetchAllData();
            setSuccess("✓ Set as active successfully!");
        } catch (err) {
            setError("Failed to set active: " + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Academic Setup</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Configure your school's academic structure
                    </p>
                </div>
            </div>

            {/* Alerts */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl">
                    {error}
                </div>
            )}
            {success && (
                <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-xl">
                    {success}
                </div>
            )}

            {/* ========================================== */}
            {/* STEP 1: CLASS LEVELS */}
            {/* ========================================== */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Step 1: Class Levels
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {classes.length === 0 ?
                                "Create all 6 class levels with one click" :
                                `${classes.length} class levels configured`
                            }
                        </p>
                    </div>
                    {classes.length === 0 && (
                        <Button
                            onClick={createAllClassLevels}
                            loading={loading}
                            size="lg"
                        >
                            ✨ Create All Class Levels
                        </Button>
                    )}
                </div>

                {classes.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {classes.map((cls) => (
                            <div
                                key={cls.id}
                                className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4 text-center"
                            >
                                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                    {cls.name}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    Order: {cls.order}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ========================================== */}
            {/* STEP 2: ACADEMIC SESSIONS */}
            {/* ========================================== */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Step 2: Academic Sessions
                </h2>

                {/* Create Form */}
                <form onSubmit={handleCreateSession} className="mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Input
                            label="Session Name"
                            placeholder="2024/2025"
                            value={sessionForm.name}
                            onChange={(e) => setSessionForm({...sessionForm, name: e.target.value})}
                            required
                        />
                        <Input
                            label="Start Date"
                            type="date"
                            value={sessionForm.start_date}
                            onChange={(e) => setSessionForm({...sessionForm, start_date: e.target.value})}
                            required
                        />
                        <Input
                            label="End Date"
                            type="date"
                            value={sessionForm.end_date}
                            onChange={(e) => setSessionForm({...sessionForm, end_date: e.target.value})}
                            required
                        />
                        <div className="flex items-end">
                            <Button type="submit" loading={loading} className="w-full">
                                + Add Session
                            </Button>
                        </div>
                    </div>
                    <div className="mt-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={sessionForm.is_current}
                                onChange={(e) => setSessionForm({...sessionForm, is_current: e.target.checked})}
                                className="w-4 h-4"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                Set as current session
                            </span>
                        </label>
                    </div>
                </form>

                {/* Sessions List */}
                {sessions.length > 0 && (
                    <div className="space-y-2">
                        {sessions.map((session) => (
                            <div
                                key={session.id}
                                className={`flex items-center justify-between p-4 rounded-xl border-2 ${
                                    session.is_current
                                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                        : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                                }`}
                            >
                                <div>
                                    <div className="font-bold text-gray-900 dark:text-white">
                                        {session.name}
                                        {session.is_current && (
                                            <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded">
                                                Active
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        {session.start_date} to {session.end_date}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {!session.is_current && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleSetActive(session.id, "session")}
                                        >
                                            Set Active
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        variant="danger"
                                        onClick={() => handleDelete(session.id, "session")}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ========================================== */}
            {/* STEP 3: TERMS (OPTIONAL) */}
            {/* ========================================== */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Step 3: Terms <span className="text-sm text-gray-500">(Optional)</span>
                </h2>

                {sessions.length === 0 ? (
                    <p className="text-gray-600 dark:text-gray-400">
                        Please create an academic session first
                    </p>
                ) : (
                    <>
                        {/* Create Form */}
                        <form onSubmit={handleCreateTerm} className="mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                <div>
                                    <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Session
                                    </label>
                                    <select
                                        value={termForm.session}
                                        onChange={(e) => setTermForm({...termForm, session: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        required
                                    >
                                        <option value="">Select Session</option>
                                        {sessions.map((s) => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Term
                                    </label>
                                    <select
                                        value={termForm.name}
                                        onChange={(e) => setTermForm({...termForm, name: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    >
                                        <option value="First Term">First Term</option>
                                        <option value="Second Term">Second Term</option>
                                        <option value="Third Term">Third Term</option>
                                    </select>
                                </div>
                                <Input
                                    label="Start Date"
                                    type="date"
                                    value={termForm.start_date}
                                    onChange={(e) => setTermForm({...termForm, start_date: e.target.value})}
                                    required
                                />
                                <Input
                                    label="End Date"
                                    type="date"
                                    value={termForm.end_date}
                                    onChange={(e) => setTermForm({...termForm, end_date: e.target.value})}
                                    required
                                />
                                <div className="flex items-end">
                                    <Button type="submit" loading={loading} className="w-full">
                                        + Add Term
                                    </Button>
                                </div>
                            </div>
                            <div className="mt-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={termForm.is_current}
                                        onChange={(e) => setTermForm({...termForm, is_current: e.target.checked})}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                        Set as current term
                                    </span>
                                </label>
                            </div>
                        </form>

                        {/* Terms List */}
                        {terms.length > 0 && (
                            <div className="space-y-2">
                                {terms.map((term) => (
                                    <div
                                        key={term.id}
                                        className={`flex items-center justify-between p-4 rounded-xl border-2 ${
                                            term.is_current
                                                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                                : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                                        }`}
                                    >
                                        <div>
                                            <div className="font-bold text-gray-900 dark:text-white">
                                                {term.name} - {term.session_name}
                                                {term.is_current && (
                                                    <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded">
                                                        Active
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                                {term.start_date} to {term.end_date}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {!term.is_current && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleSetActive(term.id, "term")}
                                                >
                                                    Set Active
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="danger"
                                                onClick={() => handleDelete(term.id, "term")}
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ========================================== */}
            {/* STEP 4: SUBJECTS (AUTO-CREATED) */}
            {/* ========================================== */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Step 4: Subjects <span className="text-sm text-gray-500">(Auto-Created)</span>
                </h2>

                <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4">
                    <p className="text-blue-800 dark:text-blue-300">
                        <strong>✨ Subjects are automatically created</strong> when you upload CA scores or exam results.
                        No need to create them manually!
                    </p>
                </div>

                {subjects.length > 0 && (
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white mb-3">
                            Auto-Created Subjects ({subjects.length})
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {subjects.map((subject) => (
                                <div
                                    key={subject.id}
                                    className="bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-xl p-3"
                                >
                                    <div className="font-bold text-purple-700 dark:text-purple-300">
                                        {subject.name}
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                        Code: {subject.code}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ========================================== */}
            {/* QUICK STATS */}
            {/* ========================================== */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
                <h2 className="text-2xl font-bold mb-4">Setup Status</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/20 backdrop-blur rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold">{classes.length}</div>
                        <div className="text-sm opacity-90">Class Levels</div>
                    </div>
                    <div className="bg-white/20 backdrop-blur rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold">{sessions.length}</div>
                        <div className="text-sm opacity-90">Sessions</div>
                    </div>
                    <div className="bg-white/20 backdrop-blur rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold">{terms.length}</div>
                        <div className="text-sm opacity-90">Terms</div>
                    </div>
                    <div className="bg-white/20 backdrop-blur rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold">{subjects.length}</div>
                        <div className="text-sm opacity-90">Subjects</div>
                    </div>
                </div>

                {classes.length >= 6 && sessions.length >= 1 && (
                    <div className="mt-4 bg-white/20 backdrop-blur rounded-xl p-4 text-center">
                        <div className="text-lg font-bold">✅ Setup Complete!</div>
                        <div className="text-sm opacity-90 mt-1">
                            You can now register students and upload scores
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}