import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { caScoresAPI, academicSessionsAPI, termsAPI } from "../api/endpoints";
import { Button } from "../components/ui/Button";

export function CAScoreUpload() {
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
            // Auto-select active session
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
            // Auto-select active term
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
        formData.append("academic_session", selectedSession);
        formData.append("term", selectedTerm);

        try {
            const response = await caScoresAPI.bulkUpload(formData);
            setSuccess("CA scores uploaded successfully!");
            setUploadResults(response.data);
            setFile(null);
            document.getElementById("csv-file").value = "";
        } catch (err) {
            console.error("Bulk upload error:", err);
            const errorMsg = err.response?.data?.error ||
                err.response?.data?.detail ||
                "Failed to upload CA scores. Please check the CSV format and try again.";
            setError(errorMsg);
            if (err.response?.data?.errors) {
                setUploadResults({ errors: err.response.data.errors });
            }
        } finally {
            setLoading(false);
        }
    };

    const downloadTemplate = async () => {
        try {
            const response = await caScoresAPI.exportTemplate();
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'ca_scores_template.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Failed to download template:", error);
            // Fallback to manual template
            const csvContent = "admission_number,subject_name,ca_score\n" +
                "ADM001,Mathematics,25\n" +
                "ADM001,English,28\n" +
                "ADM002,Mathematics,30";

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'ca_scores_template.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                Upload CA Scores
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upload Form */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                        📝 Upload CA Scores
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Academic Session <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={selectedSession}
                                onChange={(e) => setSelectedSession(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                required
                            >
                                <option value="">Select Session</option>
                                {sessions.map((session) => (
                                    <option key={session.id} value={session.id}>
                                        {session.name} {session.is_active ? "(Active)" : ""}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Term <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={selectedTerm}
                                onChange={(e) => setSelectedTerm(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                required
                            >
                                <option value="">Select Term</option>
                                {terms.map((term) => (
                                    <option key={term.id} value={term.id}>
                                        {term.name} {term.is_active ? "(Active)" : ""}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Select CSV File <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="csv-file"
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                            {file && (
                                <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                                    ✓ Selected: {file.name}
                                </p>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <Button type="submit" loading={loading} disabled={!file} className="flex-1">
                                Upload Scores ✨
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => navigate("/students")}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Instructions */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                        📋 Instructions
                    </h2>

                    <div className="space-y-4 text-gray-700 dark:text-gray-300">
                        <div>
                            <h3 className="font-bold mb-2">Required CSV Format:</h3>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                                <li>admission_number</li>
                                <li>subject_name</li>
                                <li>ca_score (0-40)</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-bold mb-2">Important Notes:</h3>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                                <li>First row must be header names</li>
                                <li>CA scores must be between 0-40</li>
                                <li>Admission numbers must exist</li>
                                <li>Subject names must exist in system</li>
                                <li>One row per student-subject combination</li>
                                <li>Duplicate entries will update existing scores</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-bold mb-2">Example:</h3>
                            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-xs font-mono">
                                admission_number,subject_name,ca_score<br/>
                                ADM001,Mathematics,35<br/>
                                ADM001,English,38<br/>
                                ADM002,Mathematics,40
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            onClick={downloadTemplate}
                            className="w-full"
                        >
                            📥 Download Template
                        </Button>
                    </div>
                </div>
            </div>

            {/* Upload Results */}
            {uploadResults && (
                <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                        📊 Upload Results
                    </h2>

                    {uploadResults.created !== undefined && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl">
                                <p className="text-green-600 dark:text-green-400 font-semibold">Created</p>
                                <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                                    {uploadResults.created}
                                </p>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
                                <p className="text-blue-600 dark:text-blue-400 font-semibold">Updated</p>
                                <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                                    {uploadResults.updated}
                                </p>
                            </div>
                            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl">
                                <p className="text-red-600 dark:text-red-400 font-semibold">Errors</p>
                                <p className="text-3xl font-bold text-red-700 dark:text-red-300">
                                    {uploadResults.errors?.length || 0}
                                </p>
                            </div>
                        </div>
                    )}

                    {uploadResults.errors && uploadResults.errors.length > 0 && (
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Errors:</h3>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {uploadResults.errors.map((error, index) => (
                                    <div
                                        key={index}
                                        className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-sm text-red-700 dark:text-red-300"
                                    >
                                        Row {error.row}: {error.error}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}