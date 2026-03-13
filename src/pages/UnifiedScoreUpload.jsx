import { useState, useEffect } from 'react';
import { academicSessionsAPI, termsAPI, classLevelsAPI, studentsAPI } from '../api/endpoints';
import { Upload, Download, FileText, CheckCircle, AlertCircle, Info } from 'lucide-react';

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
                academicSessionsAPI.list(), classLevelsAPI.list()
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
        } else { setAlert({ type: 'error', message: 'Please select a CSV file.' }); }
    };

    const handleUpload = async () => {
        if (!file) { setAlert({ type: 'error', message: 'Please select a file first.' }); return; }
        if (!formData.sessionId || !formData.termId) { setAlert({ type: 'error', message: 'Please select a session and term.' }); return; }

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
                const input = document.getElementById('csv-upload-input');
                if (input) input.value = '';
                setAlert({
                    type: data.errors?.length > 0 ? 'warning' : 'success',
                    message: data.errors?.length > 0
                        ? `Done with ${data.errors.length} issue(s). ${data.created} new, ${data.updated} updated.`
                        : `All scores uploaded successfully! ${data.created} new, ${data.updated} updated.`
                });
            } else {
                setAlert({ type: 'error', message: data.error || 'Something went wrong. Please try again.' });
                if (data.errors) setResult({ errors: data.errors });
            }
        } catch (error) {
            setAlert({ type: 'error', message: 'Could not connect to the server. Check your internet connection.' });
        } finally { setUploading(false); }
    };

    const downloadTemplate = async () => {
        if (!templateClass) { setAlert({ type: 'error', message: 'Please pick a class first.' }); return; }
        try {
            setDownloadingTemplate(true); setAlert(null);
            const studentsRes = await studentsAPI.list({ class_level: templateClass, is_active: true, page_size: 500 });
            const studentsList = studentsRes.data?.results || studentsRes.data || [];
            if (studentsList.length === 0) { setAlert({ type: 'error', message: 'No students found in this class.' }); return; }
            studentsList.sort((a, b) => (a.admission_number || '').localeCompare(b.admission_number || ''));

            let csv = 'admission_number,student_name,subject,ca1_score,ca2_score,obj_score,theory_score\n';
            for (const student of studentsList) {
                const name = `${student.first_name} ${student.middle_name || ''} ${student.last_name}`.replace(/\s+/g, ' ').trim();
                csv += `${student.admission_number},${name},,,,, \n`;
            }

            const className = classLevels.find(c => c.id === parseInt(templateClass))?.name || 'class';
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
            const a = document.createElement('a'); a.href = window.URL.createObjectURL(blob);
            a.download = `scores_${className}.csv`; a.click();
        } catch (error) {
            setAlert({ type: 'error', message: 'Could not generate template.' });
        } finally { setDownloadingTemplate(false); }
    };

    const AlertBanner = ({ type, message, onClose }) => {
        const styles = {
            success: 'bg-green-50 border-green-200 text-green-800',
            error: 'bg-red-50 border-red-200 text-red-800',
            warning: 'bg-amber-50 border-amber-200 text-amber-800',
        };
        const icons = {
            success: <CheckCircle size={16} />,
            error: <AlertCircle size={16} />,
            warning: <Info size={16} />,
        };
        return (
            <div className={`flex items-center justify-between p-3 rounded-lg border text-sm ${styles[type]}`}>
                <div className="flex items-center gap-2">{icons[type]}<span>{message}</span></div>
                <button onClick={onClose} className="font-bold ml-4">&times;</button>
            </div>
        );
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Upload Scores</h1>
                <p className="text-sm text-gray-500 mt-1">Upload all scores (CA1, CA2, OBJ, Theory) in a single CSV file</p>
            </div>

            {alert && <AlertBanner {...alert} onClose={() => setAlert(null)} />}

            {/* Step 1: Download template */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">1</span>
                    <h2 className="text-sm font-semibold text-gray-900">Download template</h2>
                </div>
                <p className="text-sm text-gray-500 mb-4">Pick a class to get a CSV pre-filled with student names and admission numbers.</p>
                <div className="flex gap-3">
                    <select value={templateClass} onChange={(e) => setTemplateClass(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                        <option value="">Select class...</option>
                        {classLevels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <button onClick={downloadTemplate} disabled={downloadingTemplate || !templateClass}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                        <Download size={16} />
                        {downloadingTemplate ? 'Generating...' : 'Download'}
                    </button>
                </div>
            </div>

            {/* Step 2: Fill and upload */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">2</span>
                    <h2 className="text-sm font-semibold text-gray-900">Fill scores and upload</h2>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Session</label>
                        <select value={formData.sessionId} onChange={(e) => setFormData({ ...formData, sessionId: e.target.value, termId: '' })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                            <option value="">Select session...</option>
                            {sessions.map(s => <option key={s.id} value={s.id}>{s.name}{(s.is_current || s.is_active) ? ' (Current)' : ''}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Term</label>
                        <select value={formData.termId} onChange={(e) => setFormData({ ...formData, termId: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" disabled={!formData.sessionId}>
                            <option value="">Select term...</option>
                            {terms.map(t => <option key={t.id} value={t.id}>{t.name}{(t.is_current || t.is_active) ? ' (Current)' : ''}</option>)}
                        </select>
                    </div>
                </div>

                {/* File drop zone */}
                <label htmlFor="csv-upload-input"
                    className={`block border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                        file ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/30'
                    }`}>
                    <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" id="csv-upload-input" />
                    {file ? (
                        <div className="flex items-center justify-center gap-2 text-green-700">
                            <FileText size={20} />
                            <span className="text-sm font-medium">{file.name}</span>
                            <button onClick={(e) => { e.preventDefault(); setFile(null); const input = document.getElementById('csv-upload-input'); if (input) input.value = ''; }}
                                className="text-green-600 hover:text-green-800 ml-2 text-xs underline">Remove</button>
                        </div>
                    ) : (
                        <div>
                            <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">Click to select your CSV file</p>
                        </div>
                    )}
                </label>

                <button onClick={handleUpload} disabled={!file || !formData.sessionId || !formData.termId || uploading}
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                    {uploading ? 'Uploading and processing...' : 'Upload scores'}
                </button>
            </div>

            {/* Results */}
            {result && result.created !== undefined && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-sm font-semibold text-gray-900 mb-4">Upload summary</h2>
                    <div className="grid grid-cols-4 gap-3 mb-4">
                        {[
                            { label: 'Created', value: result.created || 0, color: 'text-green-700' },
                            { label: 'Updated', value: result.updated || 0, color: 'text-blue-700' },
                            { label: 'Subjects', value: result.subjects_created || 0, color: 'text-purple-700' },
                            { label: 'Issues', value: result.errors?.length || 0, color: 'text-red-700' },
                        ].map(s => (
                            <div key={s.label} className="text-center p-3 rounded-lg bg-gray-50">
                                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {result.errors?.length > 0 && (
                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                            {result.errors.map((err, idx) => (
                                <div key={idx} className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded-lg">
                                    <span className="font-medium">Row {err.row}:</span> {err.error}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Help */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">How it works</h3>
                <ul className="text-sm text-gray-600 space-y-1.5">
                    <li>1. Download the template for your class — it has student names pre-filled</li>
                    <li>2. Fill in the <strong>subject</strong> name and scores for each student</li>
                    <li>3. For multiple subjects, copy each student's row and change the subject</li>
                    <li>4. CA columns can be left blank for SS3 students</li>
                    <li>5. The total (CA1 + CA2 + OBJ + Theory) must not exceed 100</li>
                    <li>6. Grades, positions, and cumulative scores are calculated automatically</li>
                </ul>
            </div>
        </div>
    );
}

export default UnifiedScoreUpload;