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
        school_resumes: "",
        is_current: false,
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

                    }
                }
            }

            await fetchAllData();
            setSuccess(` Created ${created} class levels successfully!`);
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
            setSuccess(" Academic session created successfully!");
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
            setSuccess(" Term created successfully!");
            setTermForm({ session: "", name: "First Term", start_date: "", end_date: "", school_resumes: "", is_current: false });
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
            setSuccess(" Deleted successfully!");
        } catch (err) {
            // The backend returns 409 with usage counts when a subject is in
            // use. Offer force-delete or point the admin at merge.
            const data = err.response?.data;
            if (type === "subject" && err.response?.status === 409) {
                const msg =
                    `"${subjects.find((x) => x.id === id)?.name || "Subject"}" is in use: ` +
                    `${data.exam_results} exam result(s), ${data.ca_scores} CA score(s)` +
                    (data.promotion_rules?.length ? `, and ${data.promotion_rules.length} promotion rule(s)` : "") +
                    `.\n\nOK = delete the subject AND all those records permanently.\n` +
                    `Cancel = keep it (use "Merge into…" instead to preserve the marks).`;
                if (window.confirm(msg)) {
                    try {
                        await subjectsAPI.forceDelete(id);
                        await fetchAllData();
                        setSuccess(" Subject and its records deleted.");
                    } catch (e2) {
                        setError("Force delete failed: " + (e2.response?.data?.error || e2.message));
                    }
                }
            } else {
                setError("Failed to delete: " + (data?.error || data?.detail || err.message));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleMergeSubject = async (sourceId) => {
        const source = subjects.find((x) => x.id === sourceId);
        const options = subjects.filter((x) => x.id !== sourceId);
        if (!options.length) {
            setError("Need at least one other subject to merge into.");
            return;
        }
        const list = options.map((x, i) => `${i + 1}. ${x.name} (${x.code})`).join("\n");
        const pick = window.prompt(
            `Merge "${source?.name}" INTO which subject?\n\n${list}\n\n` +
            `All of "${source?.name}"'s results move to your choice, then it is deleted.\n` +
            `Enter a number:`,
        );
        if (!pick) return;
        const idx = parseInt(pick, 10) - 1;
        if (isNaN(idx) || idx < 0 || idx >= options.length) {
            setError("Invalid choice.");
            return;
        }
        const target = options[idx];
        if (!window.confirm(`Merge "${source?.name}" into "${target.name}"? This cannot be undone.`)) return;
        setLoading(true);
        try {
            const res = await subjectsAPI.mergeInto(sourceId, target.id);
            await fetchAllData();
            const d = res.data;
            setSuccess(
                ` Merged "${d.merged_from}" into "${d.merged_into}": ` +
                `${d.exam_results_moved} result(s) moved, ${d.duplicate_rows_dropped} duplicate(s) dropped.`,
            );
        } catch (err) {
            setError("Merge failed: " + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleRenameSubject = async (subject) => {
        const newName = window.prompt(
            `Fix the subject name (e.g. correct a misspelling).\n` +
            `This only changes the name — results and class levels are kept.`,
            subject.name,
        );
        if (newName === null) return;
        const trimmed = newName.trim();
        if (!trimmed || trimmed === subject.name) return;
        setLoading(true);
        try {
            await subjectsAPI.rename(subject.id, { name: trimmed });
            await fetchAllData();
            setSuccess(` Renamed to "${trimmed}".`);
        } catch (err) {
            const d = err.response?.data;
            // Field errors come back as { name: [...] } / { code: [...] }.
            const msg =
                d?.name?.join?.(" ") ||
                d?.code?.join?.(" ") ||
                d?.error ||
                d?.detail ||
                err.message;
            setError("Rename failed: " + msg);
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
            setSuccess(" Set as active successfully!");
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
                    <h1 className="text-3xl font-bold text-gray-900">Academic Setup</h1>
                    <p className="text-gray-600 mt-1">
                        Configure your school's academic structure
                    </p>
                </div>
            </div>

            {/* Alerts */}
            {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl">
                    {error}
                </div>
            )}
            {success && (
                <div className="bg-green-50 border-2 border-green-200 text-green-700 px-4 py-3 rounded-xl">
                    {success}
                </div>
            )}

            {/* ========================================== */}
            {/* STEP 1: CLASS LEVELS */}
            {/* ========================================== */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            Step 1: Class Levels
                        </h2>
                        <p className="text-gray-600 mt-1">
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
                             Create All Class Levels
                        </Button>
                    )}
                </div>

                {classes.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {classes.map((cls) => (
                            <div
                                key={cls.id}
                                className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 text-center"
                            >
                                <div className="text-2xl font-bold text-blue-700">
                                    {cls.name}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
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
            <div className="bg-white rounded-2xl p-8 shadow-lg">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
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
                            <span className="text-sm text-gray-700">
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
                                        ? 'bg-green-50 border-green-200'
                                        : 'bg-gray-50 border-gray-200'
                                }`}
                            >
                                <div>
                                    <div className="font-bold text-gray-900">
                                        {session.name}
                                        {session.is_current && (
                                            <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded">
                                                Active
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-600">
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
            <div className="bg-white rounded-2xl p-8 shadow-lg">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Step 3: Terms <span className="text-sm text-gray-500">(Optional)</span>
                </h2>

                {sessions.length === 0 ? (
                    <p className="text-gray-600">
                        Please create an academic session first
                    </p>
                ) : (
                    <>
                        {/* Create Form */}
                        <form onSubmit={handleCreateTerm} className="mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                <div>
                                    <label className="block font-semibold text-gray-700 mb-2">
                                        Session
                                    </label>
                                    <select
                                        value={termForm.session}
                                        onChange={(e) => setTermForm({...termForm, session: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200"
                                        required
                                    >
                                        <option value="">Select Session</option>
                                        {sessions.map((s) => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-semibold text-gray-700 mb-2">
                                        Term
                                    </label>
                                    <select
                                        value={termForm.name}
                                        onChange={(e) => setTermForm({...termForm, name: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200"
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
                                <Input
                                    label="School Resumes On"
                                    type="date"
                                    value={termForm.school_resumes}
                                    onChange={(e) => setTermForm({...termForm, school_resumes: e.target.value})}
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
                                    <span className="text-sm text-gray-700">
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
                                                ? 'bg-green-50 border-green-200'
                                                : 'bg-gray-50 border-gray-200'
                                        }`}
                                    >
                                        <div>
                                            <div className="font-bold text-gray-900">
                                                {term.name} - {term.session_name}
                                                {term.is_current && (
                                                    <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded">
                                                        Active
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-600">
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
            <div className="bg-white rounded-2xl p-8 shadow-lg">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Step 4: Subjects <span className="text-sm text-gray-500">(Auto-Created)</span>
                </h2>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-4">
                    <p className="text-blue-800">
                        <strong> Subjects are automatically created</strong> when you upload CA scores or exam results.
                        No need to create them manually!
                    </p>
                </div>

                {subjects.length > 0 && (
                    <div>
                        <h3 className="font-bold text-gray-900 mb-3">
                            Auto-Created Subjects ({subjects.length})
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {subjects.map((subject) => (
                                <div
                                    key={subject.id}
                                    className="bg-purple-50 border-2 border-purple-200 rounded-xl p-3"
                                >
                                    <div className="font-bold text-purple-700">
                                        {subject.name}
                                    </div>
                                    <div className="text-xs text-gray-600 mt-1">
                                        Code: {subject.code}
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <button
                                            onClick={() => handleRenameSubject(subject)}
                                            className="text-xs px-2 py-1 rounded bg-white border border-blue-300 text-blue-700 hover:bg-blue-50"
                                            title="Fix a misspelled name (keeps results and class levels)"
                                        >
                                            Rename
                                        </button>
                                        <button
                                            onClick={() => handleMergeSubject(subject.id)}
                                            className="text-xs px-2 py-1 rounded bg-white border border-purple-300 text-purple-700 hover:bg-purple-100"
                                            title="Move this subject's results into another subject, then delete it"
                                        >
                                            Merge into…
                                        </button>
                                        <button
                                            onClick={() => handleDelete(subject.id, "subject")}
                                            className="text-xs px-2 py-1 rounded bg-white border border-red-300 text-red-600 hover:bg-red-50"
                                        >
                                            Delete
                                        </button>
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
                        <div className="text-lg font-bold"> Setup Complete!</div>
                        <div className="text-sm opacity-90 mt-1">
                            You can now register students and upload scores
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}