/**
 * Unified Score Upload
 * Single CSV upload for all score components: CA1, CA2, OBJ, Theory
 * - CA columns optional for SS3
 * - Only Total ≤ 100 enforced
 * - Class-filtered template with student names pre-filled
 */
import { useState, useEffect } from 'react';
import { academicSessionsAPI, termsAPI, classLevelsAPI, studentsAPI } from '../api/endpoints';
import { Button } from '../components/ui/Button';

export function UnifiedScoreUpload() {
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

    useEffect(() => { loadData(); }, []);
    useEffect(() => { if (formData.sessionId) loadTerms(formData.sessionId); }, [formData.sessionId]);

    const loadData = async () => {
        try {
            const [sessionsRes, classesRes] = await Promise.all([
                academicSessionsAPI.list(),
                classLevelsAPI.list()
            ]);
            const sessionList = sessionsRes.data?.results || sessionsRes.data || [];
            setSessions(sessionList);
            setClassLevels(classesRes.data?.results || classesRes.data || []);
            const current = sessionList.find(s => s.is_current || s.is_active);
            if (current) setFormData(prev => ({ ...prev, sessionId: current.id.toString() }));
        } catch (error) { console.error('Failed to load data:', error); }
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

            const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://molek-school-backend-production.up.railway.app';
            const response = await fetch(`${baseUrl}/api/exam-results/unified-upload/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
                body: uploadFormData
            });

            const data = await response.json();
            if (response.ok) {
                setResult(data);
                setFile(null);
                document.getElementById('csv-upload-input').value = '';
                if (data.errors?.length > 0) {
                    setAlert({ type: 'warning', message: `Upload completed with ${data.errors.length} error(s). ${data.created} created, ${data.updated} updated.` });
                } else {
                    setAlert({ type: 'success', message: `Upload successful! ${data.created} created, ${data.updated} updated.` });
                }
            } else {
                setAlert({ type: 'error', message: data.error || 'Upload failed' });
                if (data.errors) setResult({ errors: data.errors });
            }
        } catch (error) {
            setAlert({ type: 'error', message: 'Failed to upload. Check your connection.' });
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

            const studentsRes = await studentsAPI.list({ class_level: templateClass, is_active: true, page_size: 500 });
            const studentsList = studentsRes.data?.results || studentsRes.data || [];

            if (studentsList.length === 0) {
                setAlert({ type: 'error', message: 'No active students found in this class' });
                return;
            }

            studentsList.sort((a, b) => (a.admission_number || '').localeCompare(b.admission_number || ''));

            let csv = 'admission_number,student_name,subject,ca1_score,ca2_score,obj_score,theory_score\n';

            for (const student of studentsList) {
                const name = `${student.first_name} ${student.middle_name || ''} ${student.last_name}`.replace(/\s+/g, ' ').trim();
                csv += `${student.admission_number},${name},,,,, \n`;
            }

            csv += '# student_name is for reference only (ignored during upload)\n';
            csv += '# CA columns are optional (leave blank for SS3)\n';
            csv += '# Only rule: ca1 + ca2 + obj + theory must be ≤ 100\n';

            const className = classLevels.find(c => c.id === parseInt(templateClass))?.name || 'class';
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
            const a = document.createElement('a');
            a.href = window.URL.createObjectURL(blob);
            a.download = `scores_${className}.csv`;
            a.click();
        } catch (error) {
            setAlert({ type: 'error', message: 'Failed to generate template' });
        } finally {
            setDownloadingTemplate(false);
        }
    };

    const selectedClassName = classLevels.find(c => c.id === parseInt(templateClass))?.name || '';
    const isSS3 = selectedClassName.toUpperCase() === 'SS3';

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Upload Scores</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Single CSV upload for all score components — CA1, CA2, OBJ, and Theory
                </p>
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
                {/* Score Info */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border-2 border-blue-200 dark:border-blue-800 mb-6">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">📊 Score Structure</h3>
                    <p className="text-sm text-blue-800 dark:text-blue-400">
                        CA1 + CA2 + OBJ + Theory = <strong>Total (max 100)</strong>
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                        Individual component limits are flexible — only the total must be ≤ 100. CA is optional for SS3.
                    </p>
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

                {/* Template Download */}
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
                        Template includes student names for reference (ignored during upload).
                        {isSS3 && ' SS3 students can leave CA columns blank.'}
                    </p>
                </div>

                {/* CSV Format */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">📋 CSV Format</h3>
                    <code className="text-sm block bg-gray-100 dark:bg-gray-600 p-3 rounded font-mono">
                        admission_number,student_name,subject,ca1_score,ca2_score,obj_score,theory_score
                    </code>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-3 space-y-1">
                        <p>• <strong>student_name:</strong> For reference only (ignored during upload)</p>
                        <p>• <strong>subject:</strong> Auto-created if it doesn't exist</p>
                        <p>• <strong>ca1 + ca2 + obj + theory</strong> must be ≤ 100</p>
                        <p>• CA columns can be left blank (especially for SS3)</p>
                        <p>• Duplicate rows for same student = different subjects</p>
                    </div>
                </div>

                {/* File Upload */}
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center mb-4 hover:border-blue-400 transition-colors">
                    <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" id="csv-upload-input" />
                    <label htmlFor="csv-upload-input" className="cursor-pointer">
                        <span className="text-5xl block mb-4">📤</span>
                        <p className="text-gray-600 dark:text-gray-400 mb-2">Click to select CSV file</p>
                    </label>
                </div>

                {file && (
                    <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 p-3 rounded-xl mb-4 border-2 border-green-200">
                        <span className="font-semibold text-green-800 dark:text-green-300">📄 {file.name}</span>
                        <button onClick={() => { setFile(null); document.getElementById('csv-upload-input').value = ''; }} className="text-green-600 hover:text-green-800 font-semibold">Remove</button>
                    </div>
                )}

                <Button variant="primary" onClick={handleUpload} disabled={!file || !formData.sessionId || !formData.termId || uploading} loading={uploading} className="w-full">
                    {uploading ? 'Uploading & Processing...' : '📤 Upload All Scores'}
                </Button>
            </div>

            {/* Results */}
            {result && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Upload Results</h2>
                    
                    {result.created !== undefined && (
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
                    )}

                    {result.errors?.length > 0 && (
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white mb-3">Errors:</h3>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {result.errors.map((err, idx) => {
                                    let readableError = err.error || '';
                                    readableError = readableError
                                        .replace(/Validation failed:\s*/gi, '')
                                        .replace(/\{/g, '').replace(/\}/g, '')
                                        .replace(/\[ErrorDetail\(string='([^']+)',\s*code='[^']+'\)\]/g, '$1')
                                        .replace(/'([^']+)':\s*/g, '$1: ')
                                        .replace(/first_name/g, 'First Name')
                                        .replace(/admission_number/g, 'Admission Number');
                                    
                                    return (
                                        <div key={idx} className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
                                            <span className="text-red-500 font-bold shrink-0">Row {err.row}:</span>
                                            <span>{readableError}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Instructions */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">📖 How It Works</h2>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                    <li>Select the <strong>class</strong> and download the pre-filled template</li>
                    <li>Fill in <strong>subject</strong> name and all scores for each student</li>
                    <li>For multiple subjects, duplicate each student's row and change the subject</li>
                    <li>For <strong>SS3</strong>, leave CA1 and CA2 blank — only OBJ and Theory are required</li>
                    <li>The <strong>student_name</strong> column is just for your reference — it's ignored during upload</li>
                    <li>Select session and term, then upload the CSV</li>
                    <li>Totals, grades, positions, and cumulative scores are <strong>auto-calculated</strong></li>
                </ol>
            </div>
        </div>
    );
}

export default UnifiedScoreUpload;