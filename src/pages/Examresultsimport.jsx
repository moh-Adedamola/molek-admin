import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { examResultsAPI, academicSessionsAPI, termsAPI } from "../api/endpoints";
import { Button } from "../components/ui/Button";

export function ExamResultsImport() {
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [uploadResults, setUploadResults] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [terms, setTerms] = useState([]);
    const [selectedSession, setSelectedSession] = useState("");
    const [selectedTerm, setSelectedTerm] = useState("");

    useEffect(() => {
        fetchSessions();
        fetchTerms();
    }, []);

    const fetchSessions = async () => {
        try {
            const response = await academicSessionsAPI.list();
            const sessionData = response.data.results || response.data || [];
            setSessions(sessionData);
            const activeSession = sessionData.find(s => s.is_active);
            if (activeSession) {
                setSelectedSession(activeSession.id.toString());
            }
        } catch (error) {
            console.error("Failed to fetch sessions:", error);
        }
    };

    const fetchTerms = async () => {
        try {
            const response = await termsAPI.list();
            const termData = response.data.results || response.data || [];
            setTerms(termData);
            const activeTerm = termData.find(t => t.is_active);
            if (activeTerm) {
                setSelectedTerm(activeTerm.id.toString());
            }
        } catch (error) {
            console.error("Failed to fetch terms:", error);
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === "text/csv") {
            setFile(selectedFile);
            setError("");
        } else {
            setError("Please select a valid CSV file");
            setFile(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!file) {
            setError("Please select a CSV file");
            return;
        }

        if (!selectedSession || !selectedTerm) {
            setError("Please select academic session and term");
            return;
        }

        setLoading(true);
        setError("");
        setSuccess("");
        setUploadResults(null);

        const formData = new FormData();
        formData.append("file", file);
        // ✅ FIXED: Django expects "session" and "term", not "academic_session"
        formData.append("session", selectedSession);
        formData.append("term", selectedTerm);

        console.log("📤 Uploading exam results:", {
            file: file.name,
            session: selectedSession,
            term: selectedTerm
        });

        try {
            const response = await examResultsAPI.bulkImport(formData);
            setSuccess("Exam results imported successfully!");
            setUploadResults(response.data);
            setFile(null);
            document.getElementById("csv-file").value = "";

            console.log("✅ Upload successful:", response.data);
        } catch (err) {
            console.error("Bulk import error:", err);
            const errorMsg = err.response?.data?.error ||
                err.response?.data?.detail ||
                "Failed to import exam results. Please check the CSV format and try again.";
            setError(errorMsg);
            if (err.response?.data?.errors) {
                setUploadResults({ errors: err.response.data.errors });
            }
        } finally {
            setLoading(false);
        }
    };

    const downloadTemplate = () => {
        // ✅ FIXED: Template with correct column names
        const csvContent = "admission_number,subject_code,subject_name,exam_score,submitted_at\n" +
            "MOL/2026/001,GNS101,General Studies,25,2026-01-13 14:30:00\n" +
            "MOL/2026/002,GNS101,General Studies,30,2026-01-13 14:32:00\n" +
            "MOL/2026/001,MAT101,Mathematics,28,2026-01-13 15:00:00";

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'exam_results_template.csv');
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                Import Exam Results
            </h1>

            {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg">
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-lg">
                    {success}
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                        📋 CSV Format Requirements:
                    </h3>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                        <li>• <strong>admission_number</strong> - Student admission number (e.g., MOL/2026/001)</li>
                        <li>• <strong>subject_code</strong> - Subject code (e.g., GNS101)</li>
                        <li>• <strong>subject_name</strong> - Full subject name (e.g., General Studies)</li>
                        <li>• <strong>exam_score</strong> - Exam score out of 70 (e.g., 25)</li>
                        <li>• <strong>submitted_at</strong> - Timestamp (e.g., 2026-01-13 14:30:00)</li>
                    </ul>
                    <button
                        onClick={downloadTemplate}
                        className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        📥 Download Template CSV
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Academic Session Selection */}
                    <div>
                        <label htmlFor="session" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Academic Session *
                        </label>
                        <select
                            id="session"
                            value={selectedSession}
                            onChange={(e) => setSelectedSession(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            required
                        >
                            <option value="">Select Academic Session</option>
                            {sessions.map((session) => (
                                <option key={session.id} value={session.id}>
                                    {session.name} {session.is_current && "(Current)"}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Term Selection */}
                    <div>
                        <label htmlFor="term" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Term *
                        </label>
                        <select
                            id="term"
                            value={selectedTerm}
                            onChange={(e) => setSelectedTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            required
                        >
                            <option value="">Select Term</option>
                            {terms.map((term) => (
                                <option key={term.id} value={term.id}>
                                    {term.name} ({term.session_name}) {term.is_current && "(Current)"}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* File Upload */}
                    <div>
                        <label htmlFor="csv-file" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            CSV File *
                        </label>
                        <input
                            id="csv-file"
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            required
                        />
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Upload a CSV file with exam results (max 10MB)
                        </p>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3">
                        <Button
                            type="submit"
                            disabled={loading || !file || !selectedSession || !selectedTerm}
                            className="flex-1"
                        >
                            {loading ? "Uploading..." : "Upload Exam Results"}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate(-1)}
                        >
                            Cancel
                        </Button>
                    </div>
                </form>

                {/* Upload Results */}
                {uploadResults && (
                    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                            Upload Results:
                        </h3>
                        <div className="space-y-1 text-sm">
                            {uploadResults.created !== undefined && (
                                <p className="text-green-600 dark:text-green-400">
                                    ✅ Created: {uploadResults.created} exam results
                                </p>
                            )}
                            {uploadResults.updated !== undefined && (
                                <p className="text-blue-600 dark:text-blue-400">
                                    🔄 Updated: {uploadResults.updated} exam results
                                </p>
                            )}
                            {uploadResults.subjects_created !== undefined && uploadResults.subjects_created > 0 && (
                                <p className="text-purple-600 dark:text-purple-400">
                                    ➕ Created: {uploadResults.subjects_created} new subjects
                                </p>
                            )}
                            {uploadResults.failed !== undefined && uploadResults.failed > 0 && (
                                <p className="text-red-600 dark:text-red-400">
                                    ❌ Failed: {uploadResults.failed} rows
                                </p>
                            )}
                        </div>

                        {/* Show errors if any */}
                        {uploadResults.errors && uploadResults.errors.length > 0 && (
                            <div className="mt-3">
                                <h4 className="font-semibold text-red-600 dark:text-red-400 mb-2">
                                    Errors (showing first 10):
                                </h4>
                                <ul className="text-xs space-y-1 text-red-600 dark:text-red-400">
                                    {uploadResults.errors.map((err, idx) => (
                                        <li key={idx}>
                                            Row {err.row}: {err.error || JSON.stringify(err.errors)}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}