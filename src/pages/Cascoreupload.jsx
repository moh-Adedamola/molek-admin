/**
 * CA Score Upload (CA1 + CA2)
 * Nigerian School Grading: CA1 (15) + CA2 (15) = Total CA (30)
 * CSV Format: admission_number,student_name,subject,ca1_score,ca2_score
 */
import { useState, useEffect } from 'react';
import { caScoresAPI, academicSessionsAPI, termsAPI, classLevelsAPI, studentsAPI, subjectsAPI } from '../api/endpoints';
import { Button } from '../components/ui/Button';

export function CAScoreUpload() {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [alert, setAlert] = useState(null);
    const [result, setResult] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [terms, setTerms] = useState([]);
    const [classLevels, setClassLevels] = useState([]);
    const [formData, setFormData] = useState({ sessionId: '', termId: '' });
    const [templateClass, setTemplateClass] = useState('');
    const [downloadingTemplate, setDownloadingTemplate] = useState(false);

    useEffect(() => { loadSessions(); loadClassLevels(); }, []);
    useEffect(() => { if (formData.sessionId) loadTerms(formData.sessionId); }, [formData.sessionId]);

    const loadSessions = async () => {
        try {
            const res = await academicSessionsAPI.list();
            const sessionList = res.data?.results || res.data || [];
            setSessions(sessionList);
            const current = sessionList.find(s => s.is_current || s.is_active);
            if (current) setFormData(prev => ({ ...prev, sessionId: current.id.toString() }));
        } catch (error) { console.error('Failed to load sessions:', error); }
    };

    const loadTerms = async (sessionId) => {
        try {
            const res = await termsAPI.list({ session: sessionId });
            const termList = res.data?.results || res.data || [];
            setTerms(termList);
            const current = termList.find(t => t.is_current || t.is_active);
            if (current) setFormData(prev => ({ ...prev, termId: current.id.toString() }));
        } catch (error) { console.error('Failed to load terms:', error); }
    };

    const loadClassLevels = async () => {
        try {
            const res = await classLevelsAPI.list();
            setClassLevels(res.data?.results || res.data || []);
        } catch (error) { console.error('Failed to load class levels:', error); }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.name.endsWith('.csv')) {
            setFile(selectedFile); setResult(null); setAlert(null);
        } else { setAlert({ type: 'error', message: 'Please select a CSV file' }); }
    };

    const handleUpload = async () => {
        if (!file) { setAlert({ type: 'error', message: 'Please select a file' }); return; }
        if (!formData.sessionId || !formData.termId) { setAlert({ type: 'error', message: 'Please select session and term' }); return; }

        try {
            setUploading(true); setResult(null); setAlert(null);
            const uploadFormData = new FormData();
            uploadFormData.append('file', file);
            uploadFormData.append('session', formData.sessionId);
            uploadFormData.append('term', formData.termId);

            const res = await caScoresAPI.bulkUpload(uploadFormData);
            setResult(res.data); setFile(null);
            document.querySelector('input[type="file"]').value = '';

            if (res.data.errors?.length > 0) {
                setAlert({ type: 'warning', message: `Upload completed with ${res.data.errors.length} error(s)` });
            } else {
                setAlert({ type: 'success', message: 'CA scores uploaded successfully!' });
            }
        } catch (error) {
            setAlert({ type: 'error', message: error.response?.data?.error || 'Upload failed' });
        } finally { setUploading(false); }
    };

    const downloadTemplate = async () => {
        if (!templateClass) {
            setAlert({ type: 'error', message: 'Please select a class to download template' });
            return;
        }

        try {
            setDownloadingTemplate(true);
            setAlert(null);

            // Fetch students for the selected class
            const studentsRes = await studentsAPI.list({ class_level: templateClass, is_active: true, page_size: 500 });
            const studentsList = studentsRes.data?.results || studentsRes.data || [];

            if (studentsList.length === 0) {
                setAlert({ type: 'error', message: 'No active students found in this class' });
                return;
            }

            // Fetch subjects for this class level
            const subjectsRes = await subjectsAPI.list({ class_level: templateClass });
            const subjectsList = subjectsRes.data?.results || subjectsRes.data || [];

            // Sort students by name
            studentsList.sort((a, b) => {
                const nameA = `${a.last_name} ${a.first_name}`.toLowerCase();
                const nameB = `${b.last_name} ${b.first_name}`.toLowerCase();
                return nameA.localeCompare(nameB);
            });

            // Build CSV with BOM for UTF-8 support (Yoruba characters etc.)
            let csv = '';
            csv += 'admission_number,student_name,subject,ca1_score,ca2_score\n';

            // If we have subjects, create rows for each student x subject combo
            if (subjectsList.length > 0) {
                for (const student of studentsList) {
                    const name = `${student.first_name} ${student.last_name}`.trim();
                    for (const subject of subjectsList) {
                        csv += `${student.admission_number},${name},${subject.name},,\n`;
                    }
                }
            } else {
                // No subjects linked to class - just list students with empty subject
                for (const student of studentsList) {
                    const name = `${student.first_name} ${student.last_name}`.trim();
                    csv += `${student.admission_number},${name},,,\n`;
                }
            }

            csv += '# NOTE: student_name column is for reference only - not used during upload\n';
            csv += '# CA1 max = 15  |  CA2 max = 15\n';

            const className = classLevels.find(c => c.id === parseInt(templateClass))?.name || 'class';
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
            const a = document.createElement('a');
            a.href = window.URL.createObjectURL(blob);
            a.download = `ca_scores_${className}.csv`;
            a.click();
        } catch (error) {
            console.error('Template download error:', error);
            setAlert({ type: 'error', message: 'Failed to generate template' });
        } finally {
            setDownloadingTemplate(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">CA Score Upload (CA1 + CA2)</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Upload Continuous Assessment scores: CA1 (15) + CA2 (15) = 30 marks</p>
            </div>

            {alert && (
                <div className={`p-4 rounded-xl border-2 flex items-center justify-between ${
                    alert.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 text-red-700' :
                    alert.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 text-yellow-700' :
                    'bg-green-50 dark:bg-green-900/20 border-green-200 text-green-700'
                }`}>
                    <span>{alert.message}</span>
                    <button onClick={() => setAlert(null)} className="ml-4 font-bold">&times;</button>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                {/* Score Structure */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border-2 border-blue-200 dark:border-blue-800 mb-6">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">📊 Nigerian School Grading Structure</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div className="bg-white/50 dark:bg-gray-700/50 p-2 rounded text-center border-2 border-blue-400">
                            <div className="font-bold">CA1</div><div>15 marks</div>
                        </div>
                        <div className="bg-white/50 dark:bg-gray-700/50 p-2 rounded text-center border-2 border-blue-400">
                            <div className="font-bold">CA2</div><div>15 marks</div>
                        </div>
                        <div className="bg-white/50 dark:bg-gray-700/50 p-2 rounded text-center">
                            <div className="font-bold">OBJ/CBT</div><div>30 marks</div>
                        </div>
                        <div className="bg-white/50 dark:bg-gray-700/50 p-2 rounded text-center">
                            <div className="font-bold">Theory</div><div>40 marks</div>
                        </div>
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 text-center">Total = CA1 + CA2 + OBJ + Theory = 100 marks</p>
                </div>

                {/* Session/Term */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">Academic Session *</label>
                        <select value={formData.sessionId} onChange={(e) => setFormData({ ...formData, sessionId: e.target.value, termId: '' })}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                            <option value="">Select Session</option>
                            {sessions.map(s => <option key={s.id} value={s.id}>{s.name}{(s.is_current || s.is_active) ? ' (Current)' : ''}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">Term *</label>
                        <select value={formData.termId} onChange={(e) => setFormData({ ...formData, termId: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white" disabled={!formData.sessionId}>
                            <option value="">Select Term</option>
                            {terms.map(t => <option key={t.id} value={t.id}>{t.name}{(t.is_current || t.is_active) ? ' (Current)' : ''}</option>)}
                        </select>
                    </div>
                </div>

                {/* Template Download with Class Filter */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border-2 border-green-200 dark:border-green-800 mb-6">
                    <h3 className="font-semibold text-green-900 dark:text-green-100 mb-3">📥 Download Template (Pre-filled with Students)</h3>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <select value={templateClass} onChange={(e) => setTemplateClass(e.target.value)}
                            className="flex-1 px-4 py-3 rounded-xl border-2 border-green-300 dark:border-green-600 dark:bg-gray-700 dark:text-white">
                            <option value="">Select Class</option>
                            {classLevels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <Button variant="outline" onClick={downloadTemplate} disabled={downloadingTemplate || !templateClass}>
                            {downloadingTemplate ? '⏳ Generating...' : '📥 Download Template'}
                        </Button>
                    </div>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                        Template includes student names for easy identification. The name column is ignored during upload.
                    </p>
                </div>

                {/* CSV Format */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">📋 CSV Format</h3>
                    <code className="text-sm block bg-gray-100 dark:bg-gray-600 p-3 rounded font-mono">admission_number,student_name,subject,ca1_score,ca2_score</code>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-3 space-y-1">
                        <p>• <strong>admission_number:</strong> e.g., MOL/2026/001</p>
                        <p>• <strong>student_name:</strong> For reference only (ignored during upload)</p>
                        <p>• <strong>subject:</strong> Must match exactly (e.g., "Mathematics")</p>
                        <p>• <strong>ca1_score:</strong> 0-15</p>
                        <p>• <strong>ca2_score:</strong> 0-15</p>
                    </div>
                </div>

                {/* File Upload */}
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center mb-4 hover:border-blue-400 transition-colors">
                    <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" id="csv-upload" />
                    <label htmlFor="csv-upload" className="cursor-pointer">
                        <span className="text-5xl block mb-4">📤</span>
                        <p className="text-gray-600 dark:text-gray-400 mb-2">Click to select CSV file</p>
                    </label>
                </div>

                {file && (
                    <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 p-3 rounded-xl mb-4 border-2 border-green-200">
                        <span className="font-semibold text-green-800 dark:text-green-300">📄 {file.name}</span>
                        <button onClick={() => setFile(null)} className="text-green-600 hover:text-green-800 font-semibold">Remove</button>
                    </div>
                )}

                <div className="flex gap-3">
                    <Button variant="primary" onClick={handleUpload} disabled={!file || !formData.sessionId || !formData.termId || uploading} loading={uploading}>
                        {uploading ? 'Uploading...' : '📤 Upload CA Scores'}
                    </Button>
                </div>
            </div>

            {/* Results */}
            {result && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Upload Result</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl text-center border-2 border-green-200">
                            <p className="text-sm text-green-600">Created</p>
                            <p className="text-2xl font-bold text-green-700">{result.created || 0}</p>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-center border-2 border-blue-200">
                            <p className="text-sm text-blue-600">Updated</p>
                            <p className="text-2xl font-bold text-blue-700">{result.updated || 0}</p>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl text-center border-2 border-purple-200">
                            <p className="text-sm text-purple-600">Subjects Created</p>
                            <p className="text-2xl font-bold text-purple-700">{result.subjects_created || 0}</p>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl text-center border-2 border-red-200">
                            <p className="text-sm text-red-600">Errors</p>
                            <p className="text-2xl font-bold text-red-700">{result.errors?.length || result.failed || 0}</p>
                        </div>
                    </div>
                    {result.errors?.length > 0 && (
                        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border-2 border-red-200">
                            <h3 className="font-semibold text-red-800 mb-2">⚠️ Errors ({result.errors.length})</h3>
                            <div className="max-h-48 overflow-y-auto text-sm text-red-700">
                                {result.errors.map((err, idx) => <div key={idx}>Row {err.row}: {JSON.stringify(err.error || err)}</div>)}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Instructions */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">📖 Instructions</h2>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                    <li>Select the class and download the pre-filled CSV template</li>
                    <li>Fill in CA1 and CA2 scores for each student/subject</li>
                    <li>The student_name column is just for reference — do not remove it</li>
                    <li>CA1 and CA2 scores must be 0-15 each</li>
                    <li>Upload <strong>before</strong> importing CBT results</li>
                </ol>
            </div>
        </div>
    );
}

export default CAScoreUpload;