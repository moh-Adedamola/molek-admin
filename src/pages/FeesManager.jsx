import { useEffect, useState } from "react";
import { feesAPI, classLevelsAPI } from "../api/endpoints";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Wallet, Download, Upload, AlertTriangle, RefreshCw } from "lucide-react";

export function FeesManager() {
    const [overview, setOverview] = useState({ total: 0, paid: 0, unpaid: 0, paid_percentage: 0 });
    const [classLevels, setClassLevels] = useState([]);
    const [classFilter, setClassFilter] = useState("all");
    const [uploadFile, setUploadFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [resetModal, setResetModal] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [message, setMessage] = useState(null);
    const [uploadResult, setUploadResult] = useState(null);

    useEffect(() => { fetchOverview(); fetchClassLevels(); }, [classFilter]);

    const fetchOverview = async () => {
        try {
            const params = classFilter !== "all" ? { class_level: classFilter } : {};
            const res = await feesAPI.overview(params);
            setOverview(res.data);
        } catch {
            setMessage({ type: 'error', text: 'Could not load overview.' });
        }
    };

    const fetchClassLevels = async () => {
        try {
            const res = await classLevelsAPI.list();
            setClassLevels(res.data || []);
        } catch {}
    };

    const handleDownloadTemplate = async () => {
        setDownloading(true);
        try {
            const params = classFilter !== "all" ? { class_level: classFilter } : {};
            const res = await feesAPI.downloadTemplate(params);
            const blob = new Blob([res.data], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const className = classFilter !== "all"
                ? classLevels.find(c => c.id === parseInt(classFilter))?.name || 'class'
                : 'all';
            link.download = `fees_template_${className}.csv`;
            link.click();
            URL.revokeObjectURL(url);
        } catch {
            setMessage({ type: 'error', text: 'Could not download template.' });
        } finally {
            setDownloading(false);
        }
    };

    const handleUpload = async () => {
        if (!uploadFile) return;
        setUploading(true);
        setUploadResult(null);
        try {
            const formData = new FormData();
            formData.append('file', uploadFile);
            const res = await feesAPI.bulkUpload(formData);
            setUploadResult(res.data);
            setMessage({ type: 'success', text: res.data.message });
            setUploadFile(null);
            fetchOverview();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Upload failed.' });
        } finally {
            setUploading(false);
        }
    };

    const handleResetAll = async () => {
        setResetting(true);
        try {
            const res = await feesAPI.resetAll();
            setMessage({ type: 'success', text: res.data.message });
            fetchOverview();
            setResetModal(false);
        } catch {
            setMessage({ type: 'error', text: 'Reset failed.' });
        } finally {
            setResetting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Wallet size={26} /> Fees Manager</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Manage student fee payment status</p>
                </div>
                <Button variant="danger" onClick={() => setResetModal(true)}><RefreshCw size={16} className="mr-1" /> Reset All</Button>
            </div>

            {message && (
                <div className={`p-3 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                    {message.text}
                </div>
            )}

            {/* Class filter + Stats */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-3 mb-4">
                    <label className="text-sm font-medium text-gray-700">Filter by class:</label>
                    <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="px-3 py-2 rounded-lg border-2 border-gray-200">
                        <option value="all">All Classes</option>
                        {classLevels.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Stat label="Total Students" value={overview.total} color="text-gray-900" />
                    <Stat label="Paid" value={overview.paid} color="text-green-600" />
                    <Stat label="Unpaid" value={overview.unpaid} color="text-red-600" />
                    <Stat label="Paid %" value={`${overview.paid_percentage}%`} color="text-blue-600" />
                </div>
            </div>

            {/* Step 1: Download template */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">1</span>
                    Download template
                </h3>
                <p className="text-sm text-gray-600 mb-3">Get a CSV pre-filled with student names and admission numbers for the selected class.</p>
                <Button onClick={handleDownloadTemplate} disabled={downloading}>
                    <Download size={16} className="mr-1" /> {downloading ? 'Preparing...' : 'Download Template'}
                </Button>
            </div>

            {/* Step 2: Upload */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">2</span>
                    Upload completed CSV
                </h3>
                <p className="text-sm text-gray-600 mb-3">Mark "yes" or "no" in the paid column, then upload. Re-uploading updates existing records.</p>
                <div className="flex items-center gap-3 flex-wrap">
                    <input type="file" accept=".csv" onChange={(e) => setUploadFile(e.target.files[0])}
                        className="text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                    <Button onClick={handleUpload} disabled={!uploadFile || uploading}>
                        <Upload size={16} className="mr-1" /> {uploading ? 'Uploading...' : 'Upload'}
                    </Button>
                </div>
                {uploadFile && <p className="text-sm text-gray-500 mt-2">Selected: {uploadFile.name}</p>}
            </div>

            {/* Upload result */}
            {uploadResult && (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="font-semibold text-gray-900 mb-3">Upload Result</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm mb-3">
                        <div className="p-3 bg-gray-50 rounded-lg"><div className="text-xs text-gray-500">Total Rows</div><div className="text-xl font-bold text-gray-900">{uploadResult.total_rows}</div></div>
                        <div className="p-3 bg-green-50 rounded-lg"><div className="text-xs text-green-600">Updated</div><div className="text-xl font-bold text-green-700">{uploadResult.updated}</div></div>
                        <div className="p-3 bg-red-50 rounded-lg"><div className="text-xs text-red-600">Not Found</div><div className="text-xl font-bold text-red-700">{uploadResult.not_found?.length || 0}</div></div>
                    </div>
                    {uploadResult.not_found?.length > 0 && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs">
                            <div className="font-semibold text-yellow-800 mb-1">Admission numbers not found:</div>
                            <div className="text-yellow-700">{uploadResult.not_found.slice(0, 20).join(', ')}{uploadResult.not_found.length > 20 ? '...' : ''}</div>
                        </div>
                    )}
                    {uploadResult.errors?.length > 0 && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs mt-2">
                            <div className="font-semibold text-red-800 mb-1">Errors:</div>
                            <ul className="text-red-700 list-disc list-inside">{uploadResult.errors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}</ul>
                        </div>
                    )}
                </div>
            )}

            <Modal isOpen={resetModal} title="Reset all fees?" onClose={() => setResetModal(false)}
                actions={[
                    { label: "Cancel", variant: "secondary", onClick: () => setResetModal(false) },
                    { label: resetting ? "Resetting..." : "Reset All", variant: "danger", onClick: handleResetAll, disabled: resetting }
                ]}>
                <div className="flex gap-3">
                    <AlertTriangle className="text-yellow-500 flex-shrink-0" size={24} />
                    <p className="text-gray-700">This will mark every active student as <b>unpaid</b>. This is normally done automatically when a new term starts. Continue?</p>
                </div>
            </Modal>
        </div>
    );
}

function Stat({ label, value, color }) {
    return (
        <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
            <div className={`text-2xl font-bold mt-1 ${color}`}>{value}</div>
        </div>
    );
}
