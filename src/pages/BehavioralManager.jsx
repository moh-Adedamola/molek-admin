import { useEffect, useState } from "react";
import { behavioralAPI, classLevelsAPI, academicSessionsAPI, termsAPI } from "../api/endpoints";
import { Button } from "../components/ui/Button";
import { HeartHandshake, Download, Upload } from "lucide-react";

export function BehavioralManager() {
    const [classLevels, setClassLevels] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [terms, setTerms] = useState([]);
    const [classFilter, setClassFilter] = useState("all");
    const [sessionId, setSessionId] = useState("");
    const [termId, setTermId] = useState("");
    const [uploadFile, setUploadFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [message, setMessage] = useState(null);
    const [uploadResult, setUploadResult] = useState(null);
    const [assessments, setAssessments] = useState([]);
    const [loadingList, setLoadingList] = useState(false);

    useEffect(() => { fetchClassLevels(); fetchSessions(); }, []);
    useEffect(() => { if (sessionId) fetchTerms(); }, [sessionId]);
    useEffect(() => { if (sessionId && termId) fetchAssessments(); }, [sessionId, termId, classFilter]);

    const fetchClassLevels = async () => {
        try { const res = await classLevelsAPI.list(); setClassLevels(res.data || []); } catch {}
    };

    const fetchSessions = async () => {
        try {
            const res = await academicSessionsAPI.list();
            const list = res.data || [];
            setSessions(list);
            const current = list.find(s => s.is_current) || list[0];
            if (current) setSessionId(current.id);
        } catch {}
    };

    const fetchTerms = async () => {
        try {
            const res = await termsAPI.list({ session: sessionId });
            const list = res.data || [];
            setTerms(list);
            const current = list.find(t => t.is_current) || list[0];
            if (current) setTermId(current.id);
        } catch {}
    };

    const fetchAssessments = async () => {
        setLoadingList(true);
        try {
            const params = { session: sessionId, term: termId };
            if (classFilter !== "all") params.student__class_level = classFilter;
            const res = await behavioralAPI.list(params);
            setAssessments(res.data?.results || res.data || []);
        } catch {
            setMessage({ type: 'error', text: 'Could not load assessments.' });
        } finally {
            setLoadingList(false);
        }
    };

    const handleDownloadTemplate = async () => {
        if (!sessionId || !termId) {
            setMessage({ type: 'error', text: 'Select session and term first.' });
            return;
        }
        setDownloading(true);
        try {
            const params = { session: sessionId, term: termId };
            if (classFilter !== "all") params.class_level = classFilter;
            const res = await behavioralAPI.downloadTemplate(params);
            const blob = new Blob([res.data], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const className = classFilter !== "all"
                ? classLevels.find(c => c.id === parseInt(classFilter))?.name || 'class'
                : 'all';
            link.download = `behavioral_template_${className}.csv`;
            link.click();
            URL.revokeObjectURL(url);
        } catch {
            setMessage({ type: 'error', text: 'Could not download template.' });
        } finally {
            setDownloading(false);
        }
    };

    const handleUpload = async () => {
        if (!uploadFile || !sessionId || !termId) {
            setMessage({ type: 'error', text: 'Select file, session, and term.' });
            return;
        }
        setUploading(true);
        setUploadResult(null);
        try {
            const formData = new FormData();
            formData.append('file', uploadFile);
            formData.append('session_id', sessionId);
            formData.append('term_id', termId);
            const res = await behavioralAPI.bulkUpload(formData);
            setUploadResult(res.data);
            setMessage({ type: 'success', text: res.data.message });
            setUploadFile(null);
            fetchAssessments();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Upload failed.' });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><HeartHandshake size={26} /> Behavioral Assessments</h1>
                <p className="text-sm text-gray-500 mt-0.5">Manage student behavioral ratings per term</p>
            </div>

            {message && (
                <div className={`p-3 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                    {message.text}
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase">Session</label>
                    <select value={sessionId} onChange={(e) => setSessionId(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border-2 border-gray-200">
                        <option value="">— Select —</option>
                        {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}{s.is_current ? ' (Current)' : ''}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase">Term</label>
                    <select value={termId} onChange={(e) => setTermId(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border-2 border-gray-200" disabled={!sessionId}>
                        <option value="">— Select —</option>
                        {terms.map((t) => <option key={t.id} value={t.id}>{t.name}{t.is_current ? ' (Current)' : ''}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase">Class</label>
                    <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border-2 border-gray-200">
                        <option value="all">All Classes</option>
                        {classLevels.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Step 1: Download */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">1</span>
                    Download template
                </h3>
                <p className="text-sm text-gray-600 mb-3">CSV pre-filled with student names and admission numbers. Existing assessments for this session/term will be pre-filled too. Rate each attribute 1-5 (5=Excellent, 1=Weak).</p>
                <Button onClick={handleDownloadTemplate} disabled={downloading || !sessionId || !termId}>
                    <Download size={16} className="mr-1" /> {downloading ? 'Preparing...' : 'Download Template'}
                </Button>
            </div>

            {/* Step 2: Upload */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">2</span>
                    Upload completed CSV
                </h3>
                <p className="text-sm text-gray-600 mb-3">Re-uploading updates existing assessments for the same student/session/term.</p>
                <div className="flex items-center gap-3 flex-wrap">
                    <input type="file" accept=".csv" onChange={(e) => setUploadFile(e.target.files[0])}
                        className="text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                    <Button onClick={handleUpload} disabled={!uploadFile || uploading || !sessionId || !termId}>
                        <Upload size={16} className="mr-1" /> {uploading ? 'Uploading...' : 'Upload'}
                    </Button>
                </div>
                {uploadFile && <p className="text-sm text-gray-500 mt-2">Selected: {uploadFile.name}</p>}
            </div>

            {/* Upload result */}
            {uploadResult && (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="font-semibold text-gray-900 mb-3">Upload Result</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div className="p-3 bg-gray-50 rounded-lg"><div className="text-xs text-gray-500">Total Rows</div><div className="text-xl font-bold">{uploadResult.total_rows}</div></div>
                        <div className="p-3 bg-green-50 rounded-lg"><div className="text-xs text-green-600">Created</div><div className="text-xl font-bold text-green-700">{uploadResult.created}</div></div>
                        <div className="p-3 bg-blue-50 rounded-lg"><div className="text-xs text-blue-600">Updated</div><div className="text-xl font-bold text-blue-700">{uploadResult.updated}</div></div>
                        <div className="p-3 bg-red-50 rounded-lg"><div className="text-xs text-red-600">Not Found</div><div className="text-xl font-bold text-red-700">{uploadResult.not_found?.length || 0}</div></div>
                    </div>
                    {uploadResult.not_found?.length > 0 && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs mt-3">
                            <div className="font-semibold text-amber-900 mb-1">
                                Not found in the system ({uploadResult.not_found.length}) — these rows were skipped:
                            </div>
                            <p className="text-amber-800 mb-2">
                                These admission numbers are not in the system, so their behavioral scores
                                were NOT saved and will not show on the student portal. Check for typos or
                                spacing, and that the student exists and is active.
                            </p>
                            <ul className="text-amber-900 list-disc list-inside max-h-40 overflow-y-auto font-mono">
                                {uploadResult.not_found.slice(0, 50).map((a, i) => <li key={i}>{a}</li>)}
                            </ul>
                            {uploadResult.not_found.length > 50 && (
                                <p className="text-amber-800 mt-1">…and {uploadResult.not_found.length - 50} more.</p>
                            )}
                        </div>
                    )}
                    {uploadResult.errors?.length > 0 && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs mt-3">
                            <div className="font-semibold text-red-800 mb-1">Errors ({uploadResult.errors.length}):</div>
                            <ul className="text-red-700 list-disc list-inside max-h-40 overflow-y-auto">{uploadResult.errors.slice(0, 20).map((e, i) => <li key={i}>{e}</li>)}</ul>
                        </div>
                    )}
                </div>
            )}

            {/* Existing assessments table */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-3">Current Assessments {assessments.length > 0 && <span className="text-sm font-normal text-gray-500">({assessments.length})</span>}</h3>
                {loadingList ? (
                    <p className="text-sm text-gray-500">Loading...</p>
                ) : assessments.length === 0 ? (
                    <p className="text-sm text-gray-500">{!sessionId || !termId ? 'Select session and term to view assessments.' : 'No assessments recorded for these filters yet. Use the bulk upload above.'}</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-xs text-gray-600 uppercase">
                                    <th className="px-3 py-2 text-left">Student</th>
                                    <th className="px-3 py-2 text-center" title="Punctuality">Pun</th>
                                    <th className="px-3 py-2 text-center" title="Attendance">Att</th>
                                    <th className="px-3 py-2 text-center" title="Carrying Out Assignment">Asg</th>
                                    <th className="px-3 py-2 text-center" title="Neatness">Nea</th>
                                    <th className="px-3 py-2 text-center" title="Politeness">Pol</th>
                                    <th className="px-3 py-2 text-center" title="Honesty">Hon</th>
                                    <th className="px-3 py-2 text-center" title="Self-control">SC</th>
                                    <th className="px-3 py-2 text-center" title="Relationship">Rel</th>
                                    <th className="px-3 py-2 text-center" title="Sense of Responsibility">SR</th>
                                    <th className="px-3 py-2 text-center" title="Obedience">Obe</th>
                                    <th className="px-3 py-2 text-center" title="Organizational Ability">Org</th>
                                    <th className="px-3 py-2 text-center bg-blue-50" title="Times school opened this term">Days Open</th>
                                    <th className="px-3 py-2 text-center bg-blue-50" title="Times student was present">Present</th>
                                    <th className="px-3 py-2 text-center bg-blue-50" title="Public holidays">Hol</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assessments.map((a) => (
                                    <tr key={a.id} className="border-t border-gray-100">
                                        <td className="px-3 py-2 font-medium">{a.student_name}<div className="text-xs text-gray-500">{a.admission_number}</div></td>
                                        <Cell v={a.punctuality} /><Cell v={a.attendance} /><Cell v={a.carrying_out_assignment} />
                                        <Cell v={a.neatness} /><Cell v={a.politeness} /><Cell v={a.honesty} />
                                        <Cell v={a.self_control} /><Cell v={a.relationship_others} /><Cell v={a.sense_responsibility} />
                                        <Cell v={a.obedience} /><Cell v={a.organizational_ability} />
                                        <td className="px-3 py-2 text-center text-gray-700 bg-blue-50/30">{a.times_school_opened ?? '—'}</td>
                                        <td className="px-3 py-2 text-center text-gray-700 bg-blue-50/30">{a.times_present ?? '—'}</td>
                                        <td className="px-3 py-2 text-center text-gray-700 bg-blue-50/30">{a.public_holidays ?? '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

function Cell({ v }) {
    if (v == null) return <td className="px-3 py-2 text-center text-gray-400">—</td>;
    const colors = { 5: 'text-green-600', 4: 'text-blue-600', 3: 'text-yellow-600', 2: 'text-orange-600', 1: 'text-red-600' };
    return <td className={`px-3 py-2 text-center font-bold ${colors[v] || 'text-gray-700'}`}>{v}</td>;
}
