import { useState, useEffect } from 'react';
import { caScoresAPI, academicSessionsAPI, termsAPI } from '../api/endpoints';
import { Button } from '../components/ui/Button';

export function CAScoreUpload() {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [alert, setAlert] = useState(null);
    const [result, setResult] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [terms, setTerms] = useState([]);

    const [formData, setFormData] = useState({
        sessionId: '',
        termId: ''
    });

    useEffect(() => {
        loadSessions();
    }, []);

    useEffect(() => {
        if (formData.sessionId) {
            loadTerms(formData.sessionId);
        }
    }, [formData.sessionId]);

    const loadSessions = async () => {
        try {
            const res = await academicSessionsAPI.list();
            const sessionList = res.data?.results || res.data || [];
            setSessions(sessionList);

            // Auto-select current session
            const currentSession = sessionList.find(s => s.is_current || s.is_active);
            if (currentSession) {
                setFormData(prev => ({ ...prev, sessionId: currentSession.id.toString() }));
            }
        } catch (error) {
            console.error('Failed to load sessions:', error);
        }
    };

    const loadTerms = async (sessionId) => {
        try {
            const res = await termsAPI.list({ session: sessionId });
            const termList = res.data?.results || res.data || [];
            setTerms(termList);

            // Auto-select current term
            const currentTerm = termList.find(t => t.is_current || t.is_active);
            if (currentTerm) {
                setFormData(prev => ({ ...prev, termId: currentTerm.id.toString() }));
            }
        } catch (error) {
            console.error('Failed to load terms:', error);
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.name.endsWith('.csv')) {
            setFile(selectedFile);
            setResult(null);
            setAlert(null);
        } else {
            setAlert({ type: 'error', message: 'Please select a CSV file' });
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setAlert({ type: 'error', message: 'Please select a file' });
            return;
        }

        if (!formData.sessionId || !formData.termId) {
            setAlert({ type: 'error', message: 'Please select session and term' });
            return;
        }

        try {
            setUploading(true);
            setResult(null);
            setAlert(null);

            const uploadFormData = new FormData();
            uploadFormData.append('file', file);
            uploadFormData.append('session', formData.sessionId);
            uploadFormData.append('term', formData.termId);

            const res = await caScoresAPI.bulkUpload(uploadFormData);

            setResult(res.data);
            setFile(null);

            // Reset file input
            const fileInput = document.querySelector('input[type="file"]');
            if (fileInput) fileInput.value = '';

            if (res.data.errors?.length > 0) {
                setAlert({
                    type: 'warning',
                    message: `Upload completed with ${res.data.errors.length} error(s)`
                });
            } else {
                setAlert({ type: 'success', message: 'CA scores uploaded successfully!' });
            }

        } catch (error) {
            console.error('Upload error:', error);
            setAlert({
                type: 'error',
                message: error.response?.data?.error || error.response?.data?.detail || 'Upload failed'
            });
        } finally {
            setUploading(false);
        }
    };

    const downloadTemplate = () => {
        const template = `admission_number,subject,ca_score,theory_score
MOL/2026/001,Mathematics,25,18
MOL/2026/001,English,28,22
MOL/2026/002,Mathematics,22,15
MOL/2026/002,English,25,20`;

        const blob = new Blob([template], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ca_theory_scores_template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">CA & Theory Score Upload</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Upload Continuous Assessment and Theory scores for students
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

            {/* Info Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border-2 border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                        <span className="text-2xl">ℹ️</span>
                        <div>
                            <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-1">Score Upload Guide</h3>
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                Upload CA and Theory scores using CSV format. The system will automatically 
                                combine these with CBT exam scores to calculate final grades.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Upload Form */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Upload CA & Theory Scores</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Academic Session <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.sessionId}
                            onChange={(e) => setFormData({ ...formData, sessionId: e.target.value, termId: '' })}
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
                            Term <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.termId}
                            onChange={(e) => setFormData({ ...formData, termId: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            disabled={!formData.sessionId}
                        >
                            <option value="">Select Term</option>
                            {terms.map(t => (
                                <option key={t.id} value={t.id}>
                                    {t.name}{(t.is_current || t.is_active) ? ' (Current)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* CSV Format Info */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">CSV Format</h3>
                    <code className="text-sm text-gray-700 dark:text-gray-300 block bg-gray-100 dark:bg-gray-600 p-2 rounded">
                        admission_number,subject,ca_score,theory_score
                    </code>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        • <strong>admission_number:</strong> Student's admission number (e.g., MOL/2026/001)<br />
                        • <strong>subject:</strong> Subject name (must match exactly, e.g., "Mathematics")<br />
                        • <strong>ca_score:</strong> CA score (0-30)<br />
                        • <strong>theory_score:</strong> Theory/essay score (varies)
                    </p>
                </div>

                {/* File Input */}
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center mb-4 hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="hidden"
                        id="csv-upload"
                    />
                    <label htmlFor="csv-upload" className="cursor-pointer">
                        <span className="text-5xl block mb-4">📤</span>
                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                            Click to select or drag and drop your CSV file
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">Only .csv files are accepted</p>
                    </label>
                </div>

                {file && (
                    <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 p-3 rounded-xl mb-4 border-2 border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">📄</span>
                            <span className="font-semibold text-green-800 dark:text-green-300">{file.name}</span>
                        </div>
                        <button
                            onClick={() => setFile(null)}
                            className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 font-semibold"
                        >
                            Remove
                        </button>
                    </div>
                )}

                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={downloadTemplate}
                    >
                        📥 Download Template
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleUpload}
                        disabled={!file || !formData.sessionId || !formData.termId || uploading}
                        loading={uploading}
                    >
                        {uploading ? 'Uploading...' : '📤 Upload Scores'}
                    </Button>
                </div>
            </div>

            {/* Upload Result */}
            {result && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Upload Result</h2>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl text-center border-2 border-green-200 dark:border-green-800">
                            <p className="text-sm text-green-600 dark:text-green-400">Created</p>
                            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{result.created || 0}</p>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-center border-2 border-blue-200 dark:border-blue-800">
                            <p className="text-sm text-blue-600 dark:text-blue-400">Updated</p>
                            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{result.updated || 0}</p>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl text-center border-2 border-purple-200 dark:border-purple-800">
                            <p className="text-sm text-purple-600 dark:text-purple-400">Total Processed</p>
                            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{result.total_processed || (result.created || 0) + (result.updated || 0)}</p>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl text-center border-2 border-red-200 dark:border-red-800">
                            <p className="text-sm text-red-600 dark:text-red-400">Errors</p>
                            <p className="text-2xl font-bold text-red-700 dark:text-red-300">{result.errors?.length || result.failed || 0}</p>
                        </div>
                    </div>

                    {result.errors?.length > 0 && (
                        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border-2 border-red-200 dark:border-red-800">
                            <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2 flex items-center gap-2">
                                ⚠️ Errors ({result.errors.length})
                            </h3>
                            <div className="max-h-48 overflow-y-auto">
                                {result.errors.map((err, idx) => (
                                    <div key={idx} className="text-sm text-red-700 dark:text-red-400 mb-1">
                                        Row {err.row}: {err.admission_number || ''} - {JSON.stringify(err.errors || err.error || err)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Instructions */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Instructions</h2>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                    <li>Download the CSV template</li>
                    <li>Fill in student admission numbers and their CA + Theory scores</li>
                    <li>Make sure subject names match exactly with the subjects in the system</li>
                    <li>CA score should be between 0-30</li>
                    <li>Theory score varies based on the exam (typically 0-40)</li>
                    <li>Select the correct session and term before uploading</li>
                    <li>Upload the completed CSV file</li>
                    <li>After uploading CBT results, the system will combine CA + Theory + Exam scores</li>
                </ol>
            </div>
        </div>
    );
}