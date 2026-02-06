/**
 * Exam Results Import - OBJ/CBT (30 marks) and Theory (40 marks)
 * Nigerian School Format: CA1(15) + CA2(15) + OBJ(30) + Theory(40) = 100
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { academicSessionsAPI, termsAPI } from "../api/endpoints";
import { Button } from "../components/ui/Button";

export function ExamResultsImport() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('obj');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [uploadResults, setUploadResults] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [terms, setTerms] = useState([]);
    const [selectedSession, setSelectedSession] = useState("");
    const [selectedTerm, setSelectedTerm] = useState("");

    useEffect(() => { fetchSessions(); }, []);
    useEffect(() => { if (selectedSession) fetchTerms(selectedSession); }, [selectedSession]);

    const fetchSessions = async () => {
        try {
            const response = await academicSessionsAPI.list();
            const data = response.data.results || response.data || [];
            setSessions(data);
            const active = data.find(s => s.is_active || s.is_current);
            if (active) setSelectedSession(active.id.toString());
        } catch (err) { console.error("Failed to fetch sessions:", err); }
    };

    const fetchTerms = async (sessionId) => {
        try {
            const response = await termsAPI.list({ session: sessionId });
            const data = response.data.results || response.data || [];
            setTerms(data);
            const active = data.find(t => t.is_active || t.is_current);
            if (active) setSelectedTerm(active.id.toString());
        } catch (err) { console.error("Failed to fetch terms:", err); }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.name.endsWith('.csv')) {
            setFile(selectedFile); setError("");
        } else { setError("Please select a valid CSV file"); setFile(null); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) { setError("Please select a CSV file"); return; }
        if (!selectedSession || !selectedTerm) { setError("Please select session and term"); return; }

        setLoading(true); setError(""); setSuccess(""); setUploadResults(null);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("session", selectedSession);
        formData.append("term", selectedTerm);

        try {
            const endpoint = activeTab === 'obj' ? 'import-obj-scores' : 'import-theory-scores';
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://molek-school-backend-production.up.railway.app'}/api/exam-results/${endpoint}/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
                body: formData
            });

            const data = await response.json();
            if (response.ok) {
                setSuccess(`${activeTab === 'obj' ? 'OBJ/CBT' : 'Theory'} scores imported successfully!`);
                setUploadResults(data);
                setFile(null);
                document.getElementById("csv-file").value = "";
            } else {
                setError(data.error || data.detail || "Import failed");
                if (data.errors) setUploadResults({ errors: data.errors });
            }
        } catch (err) { setError("Failed to import scores"); }
        finally { setLoading(false); }
    };

    const downloadTemplate = (type) => {
        const content = type === 'obj' 
            ? `admission_number,subject,obj_score,total_questions
MOL/2026/001,Mathematics,25,30
MOL/2026/001,English Language,28,30
# NOTE: obj_score max = 30`
            : `admission_number,subject,theory_score
MOL/2026/001,Mathematics,35
MOL/2026/001,English Language,32
# NOTE: theory_score max = 40`;
        
        const blob = new Blob([content], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = window.URL.createObjectURL(blob);
        a.download = `${type}_scores_template.csv`;
        a.click();
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Import Exam Results</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Import OBJ/CBT (30 marks) or Theory (40 marks) scores</p>

            {/* Score Structure */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border-2 border-blue-200 mb-6">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">📊 Score Structure</h3>
                <div className="grid grid-cols-4 gap-2 text-sm text-center">
                    <div className="bg-white/50 p-2 rounded"><strong>CA1</strong><br/>15</div>
                    <div className="bg-white/50 p-2 rounded"><strong>CA2</strong><br/>15</div>
                    <div className={`bg-white/50 p-2 rounded ${activeTab === 'obj' ? 'border-2 border-blue-500' : ''}`}><strong>OBJ</strong><br/>30</div>
                    <div className={`bg-white/50 p-2 rounded ${activeTab === 'theory' ? 'border-2 border-purple-500' : ''}`}><strong>Theory</strong><br/>40</div>
                </div>
            </div>

            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>}
            {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">{success}</div>}

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                    <button onClick={() => { setActiveTab('obj'); setFile(null); setError(''); setSuccess(''); setUploadResults(null); }}
                        className={`flex-1 py-4 px-6 font-semibold ${activeTab === 'obj' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                        📝 OBJ/CBT Import (30)
                    </button>
                    <button onClick={() => { setActiveTab('theory'); setFile(null); setError(''); setSuccess(''); setUploadResults(null); }}
                        className={`flex-1 py-4 px-6 font-semibold ${activeTab === 'theory' ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                        ✍️ Theory Import (40)
                    </button>
                </div>

                <div className="p-6">
                    {/* CSV Format */}
                    <div className={`mb-6 p-4 rounded-lg border ${activeTab === 'obj' ? 'bg-blue-50 border-blue-200' : 'bg-purple-50 border-purple-200'}`}>
                        <h3 className="font-semibold mb-2">📋 CSV Format:</h3>
                        <code className="text-sm block bg-white p-2 rounded font-mono mb-2">
                            {activeTab === 'obj' ? 'admission_number,subject,obj_score,total_questions' : 'admission_number,subject,theory_score'}
                        </code>
                        <button onClick={() => downloadTemplate(activeTab)} className={`text-sm ${activeTab === 'obj' ? 'text-blue-600' : 'text-purple-600'} hover:underline`}>
                            📥 Download Template
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Session */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Academic Session *</label>
                            <select value={selectedSession} onChange={(e) => { setSelectedSession(e.target.value); setSelectedTerm(''); }}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" required>
                                <option value="">Select Session</option>
                                {sessions.map(s => <option key={s.id} value={s.id}>{s.name} {(s.is_current || s.is_active) && "(Current)"}</option>)}
                            </select>
                        </div>

                        {/* Term */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Term *</label>
                            <select value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" required disabled={!selectedSession}>
                                <option value="">Select Term</option>
                                {terms.map(t => <option key={t.id} value={t.id}>{t.name} {(t.is_current || t.is_active) && "(Current)"}</option>)}
                            </select>
                        </div>

                        {/* File */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">CSV File *</label>
                            <input id="csv-file" type="file" accept=".csv" onChange={handleFileChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" required />
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3">
                            <Button type="submit" disabled={loading || !file || !selectedSession || !selectedTerm}
                                className={`flex-1 ${activeTab === 'obj' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'}`}>
                                {loading ? "Uploading..." : `Upload ${activeTab === 'obj' ? 'OBJ/CBT' : 'Theory'} Scores`}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
                        </div>
                    </form>

                    {/* Results */}
                    {uploadResults && (
                        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 rounded-lg">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Upload Results:</h3>
                            <div className="text-sm space-y-1">
                                {uploadResults.created !== undefined && <p className="text-green-600">✅ Created: {uploadResults.created}</p>}
                                {uploadResults.updated !== undefined && <p className="text-blue-600">🔄 Updated: {uploadResults.updated}</p>}
                                {uploadResults.subjects_created > 0 && <p className="text-purple-600">➕ Subjects: {uploadResults.subjects_created}</p>}
                                {uploadResults.missing_ca_scores?.length > 0 && (
                                    <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                                        <p className="text-yellow-700 font-medium">⚠️ Missing CA ({uploadResults.missing_ca_scores.length})</p>
                                        <p className="text-xs text-yellow-600">Upload CA scores first for accurate totals.</p>
                                    </div>
                                )}
                                {uploadResults.errors?.length > 0 && (
                                    <div className="mt-2">
                                        <p className="text-red-600 font-medium">❌ Errors:</p>
                                        <ul className="text-xs text-red-600 max-h-32 overflow-y-auto">
                                            {uploadResults.errors.slice(0, 10).map((err, idx) => <li key={idx}>Row {err.row}: {err.error}</li>)}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Workflow */}
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">📋 Recommended Order</h3>
                <ol className="list-decimal list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    <li><strong>First:</strong> Upload CA Scores (CA1 + CA2)</li>
                    <li><strong>Second:</strong> Import OBJ/CBT scores from CBT export</li>
                    <li><strong>Third:</strong> Upload Theory scores</li>
                    <li><strong>Finally:</strong> Verify in Results Manager</li>
                </ol>
            </div>
        </div>
    );
}

export default ExamResultsImport;