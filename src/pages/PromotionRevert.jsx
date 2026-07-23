import { useState, useEffect } from 'react';
import { classLevelsAPI } from '../api/endpoints';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import api from '../api/endpoints';

// Classes that have a class below them (so students can be reverted into them
// after a wrong promotion). The roster mode allows any class as the target.
const REVERTABLE = ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'];

const WINDOWS = [
    { label: 'Last 30 minutes', value: '30' },
    { label: 'Last 2 hours', value: '120' },
    { label: 'Last 24 hours', value: '1440' },
    { label: 'All students in the class', value: '' },
];

// Parse admission numbers from a simple roster CSV (admission_number column).
function parseAdmissionNumbers(text) {
    const lines = text.replace(/\r\n/g, '\n').replace(/^\uFEFF/, '').split('\n').filter((l) => l.trim());
    if (!lines.length) return [];
    const header = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/^"|"$/g, ''));
    let idx = header.indexOf('admission_number');
    if (idx === -1) idx = 0; // fall back to the first column
    const out = [];
    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');
        const val = (cols[idx] || '').trim().replace(/^"|"$/g, '');
        if (val) out.push(val);
    }
    return out;
}

export function PromotionRevert() {
    const [mode, setMode] = useState('roster'); // 'roster' | 'recent' | 'history'
    const [events, setEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(false);
    const [undoingId, setUndoingId] = useState(null);
    const [classLevels, setClassLevels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [reverting, setReverting] = useState(false);
    const [alert, setAlert] = useState(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    // shared selection + result table
    const [rows, setRows] = useState([]);       // [{student_id, admission_number, full_name, current_class?}]
    const [selected, setSelected] = useState([]);
    const [targetClass, setTargetClass] = useState('');   // class students go back INTO
    const [loaded, setLoaded] = useState(false);

    // roster mode
    const [expectedClass, setExpectedClass] = useState('SS1');
    const [rosterInfo, setRosterInfo] = useState(null);   // {roster_size, already_correct, not_found}
    const [fileName, setFileName] = useState('');

    // recent mode
    const [currentClass, setCurrentClass] = useState('');
    const [windowMin, setWindowMin] = useState('30');

    useEffect(() => {
        classLevelsAPI.list()
            .then((res) => {
                const data = res.data?.results || res.data || [];
                const filtered = data.filter((c) => REVERTABLE.includes(c.name));
                setClassLevels(filtered.length ? filtered : REVERTABLE.map((n) => ({ id: n, name: n })));
            })
            .catch(() => setClassLevels(REVERTABLE.map((n) => ({ id: n, name: n }))));
    }, []);

    const fmt = (iso) => { if (!iso) return '—'; try { return new Date(iso).toLocaleString(); } catch { return iso; } };
    const reset = () => { setRows([]); setSelected([]); setLoaded(false); setRosterInfo(null); };

    // ---- roster mode ----
    const onFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFileName(file.name); setAlert(null); reset();
        setLoading(true);
        try {
            const text = await file.text();
            const admissionNumbers = parseAdmissionNumbers(text);
            if (!admissionNumbers.length) {
                setAlert({ type: 'error', msg: 'No admission numbers found in that file.' });
                setLoading(false); return;
            }
            const res = await api.post('/api/users/promotion/roster-check/', {
                admission_numbers: admissionNumbers,
                expected_class: expectedClass,
            });
            const d = res.data;
            setRows(d.misplaced || []);
            setSelected((d.misplaced || []).map((s) => s.student_id)); // preselect all misplaced
            setTargetClass(d.expected_class);
            setRosterInfo({ roster_size: d.roster_size, already_correct: d.already_correct, not_found: d.not_found || [] });
            setLoaded(true);
        } catch (err) {
            setAlert({ type: 'error', msg: err.response?.data?.error || 'Could not check the roster.' });
        } finally {
            setLoading(false);
        }
    };

    // ---- recent mode ----
    const loadRecent = async () => {
        if (!currentClass) { setAlert({ type: 'error', msg: 'Choose a class first.' }); return; }
        setLoading(true); setAlert(null); reset();
        try {
            const params = { current_class: currentClass };
            if (windowMin) params.minutes = windowMin;
            const res = await api.get('/api/users/promotion/revert-candidates/', { params });
            setRows(res.data.students || []);
            setSelected([]);
            setTargetClass(res.data.revert_to || '');
            setLoaded(true);
        } catch (err) {
            setAlert({ type: 'error', msg: err.response?.data?.error || 'Could not load students.' });
        } finally {
            setLoading(false);
        }
    };

    const toggle = (id) => setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
    const allSelected = rows.length > 0 && selected.length === rows.length;
    const toggleAll = () => setSelected(allSelected ? [] : rows.map((s) => s.student_id));

    const doRevert = async () => {
        setReverting(true);
        try {
            let res;
            if (mode === 'roster') {
                res = await api.post('/api/users/promotion/roster-revert/', {
                    student_ids: selected, expected_class: targetClass,
                });
                const d = res.data;
                setAlert({ type: 'success', msg: `Moved ${d.moved_count} student(s) back to ${d.to_class}.` });
            } else {
                res = await api.post('/api/users/promotion/revert/', {
                    student_ids: selected, current_class: currentClass, previous_class: targetClass,
                });
                const d = res.data;
                setAlert({ type: 'success', msg: `Reverted ${d.reverted_count} student(s) from ${d.from_class} back to ${d.to_class}.` });
            }
            setIsConfirmOpen(false);
            reset(); setFileName('');
        } catch (err) {
            setAlert({ type: 'error', msg: err.response?.data?.error || 'Revert failed.' });
        } finally {
            setReverting(false);
        }
    };

    const loadEvents = async () => {
        setLoadingEvents(true); setAlert(null);
        try {
            const res = await api.get('/api/users/promotion/events/');
            setEvents(res.data.events || []);
        } catch (err) {
            setAlert({ type: 'error', msg: err.response?.data?.error || 'Could not load promotion history.' });
        } finally {
            setLoadingEvents(false);
        }
    };

    const undoEvent = async (id) => {
        setUndoingId(id);
        try {
            const res = await api.post('/api/users/promotion/undo-event/', { event_id: id });
            setAlert({ type: 'success', msg: `Undone — ${res.data.reverted} student(s) moved back to ${res.data.from_class}.` });
            await loadEvents();
        } catch (err) {
            setAlert({ type: 'error', msg: err.response?.data?.error || 'Undo failed.' });
        } finally {
            setUndoingId(null);
        }
    };

    const switchMode = (m) => {
        setMode(m); setAlert(null); reset(); setFileName('');
        if (m === 'history') loadEvents();
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Revert Promotion</h1>
                <p className="text-gray-600 mt-1">
                    Undo a promotion by sending students back to their correct class. Only the
                    students you confirm are moved, and the move is itself reversible.
                </p>
            </div>

            <div className="flex gap-2 mb-5">
                <button onClick={() => switchMode('roster')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                        mode === 'roster' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'
                    }`}>
                    By class roster (CSV) — recommended
                </button>
                <button onClick={() => switchMode('recent')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                        mode === 'recent' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'
                    }`}>
                    By recent activity
                </button>
                <button onClick={() => switchMode('history')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                        mode === 'history' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'
                    }`}>
                    Promotion history (one-click undo)
                </button>
            </div>

            {alert && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${
                    alert.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'
                }`}>{alert.msg}</div>
            )}

            {mode === 'history' ? (
                <div className="bg-white rounded-2xl shadow p-5">
                    <p className="text-sm text-gray-600 mb-4">
                        Every promotion is logged here. Press <strong>Undo</strong> to reverse one
                        exactly — the same students go back to their previous class and session.
                    </p>
                    {loadingEvents ? (
                        <p className="text-sm text-gray-500">Loading…</p>
                    ) : events.length === 0 ? (
                        <p className="text-gray-500 py-6 text-center">No promotions recorded yet.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200 text-left text-gray-500">
                                        <th className="py-2 px-3">When</th>
                                        <th className="py-2 px-3">Move</th>
                                        <th className="py-2 px-3">Into session</th>
                                        <th className="py-2 px-3">Students</th>
                                        <th className="py-2 px-3">By</th>
                                        <th className="py-2 px-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {events.map((ev) => (
                                        <tr key={ev.id} className={ev.is_undone ? 'text-gray-400' : ''}>
                                            <td className="py-2 px-3">{ev.performed_at ? new Date(ev.performed_at).toLocaleString() : '—'}</td>
                                            <td className="py-2 px-3 font-medium">{ev.from_class} → {ev.to_class}</td>
                                            <td className="py-2 px-3">{ev.target_session || '—'}</td>
                                            <td className="py-2 px-3">{ev.count}</td>
                                            <td className="py-2 px-3">{ev.performed_by || '—'}</td>
                                            <td className="py-2 px-3 text-right">
                                                {ev.is_undone ? (
                                                    <span className="text-xs italic">undone</span>
                                                ) : (
                                                    <button onClick={() => undoEvent(ev.id)} disabled={undoingId === ev.id}
                                                        className="text-xs px-3 py-1 rounded bg-white border border-red-300 text-red-700 hover:bg-red-50">
                                                        {undoingId === ev.id ? 'Undoing…' : 'Undo'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : mode === 'roster' ? (
                <div className="bg-white rounded-2xl shadow p-5 mb-6">
                    <p className="text-sm text-gray-600 mb-4">
                        Upload the authoritative roster for a class (the CSV of who <em>should</em> be
                        in it — the same file you use for CBT). The tool finds everyone on that list
                        who is currently in a different class (i.e. was promoted away) and offers to
                        move them back. Deterministic — no guessing.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">These students belong in</label>
                            <select value={expectedClass} onChange={(e) => { setExpectedClass(e.target.value); reset(); }}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2">
                                {classLevels.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Roster CSV</label>
                            <input type="file" accept=".csv,text/csv" onChange={onFile}
                                className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                            {fileName && <p className="text-xs text-gray-500 mt-1">{fileName}</p>}
                        </div>
                    </div>
                    {loading && <p className="text-sm text-gray-500 mt-3">Checking roster…</p>}
                    {rosterInfo && (
                        <div className="mt-4 text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                            Roster: <strong>{rosterInfo.roster_size}</strong> students ·
                            already in {expectedClass}: <strong>{rosterInfo.already_correct}</strong> ·
                            need moving back: <strong>{rows.length}</strong>
                            {rosterInfo.not_found.length > 0 && (
                                <div className="text-amber-700 mt-1">
                                    {rosterInfo.not_found.length} admission number(s) not found in the system:
                                    {' '}{rosterInfo.not_found.slice(0, 8).join(', ')}{rosterInfo.not_found.length > 8 ? '…' : ''}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow p-5 mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Class they were promoted into</label>
                            <select value={currentClass} onChange={(e) => { setCurrentClass(e.target.value); reset(); }}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2">
                                <option value="">Select class…</option>
                                {classLevels.filter((c) => c.name !== 'JSS1').map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Promoted within</label>
                            <select value={windowMin} onChange={(e) => setWindowMin(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2">
                                {WINDOWS.map((w) => <option key={w.label} value={w.value}>{w.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <Button variant="primary" onClick={loadRecent} disabled={loading || !currentClass}>
                                {loading ? 'Loading…' : 'Load students'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {loaded && (
                <div className="bg-white rounded-2xl shadow p-5">
                    <div className="text-sm text-gray-600 mb-3">
                        {rows.length} student(s){targetClass && <> — will move to <strong>{targetClass}</strong></>}.
                        {mode === 'recent' && ' Most recently updated first.'}
                    </div>
                    {rows.length === 0 ? (
                        <p className="text-gray-500 py-8 text-center">
                            {mode === 'roster' ? 'Everyone on the roster is already in the right class.' : 'No students found for that window.'}
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200 text-left text-gray-500">
                                        <th className="py-2 px-3"><input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4 rounded border-gray-300" /></th>
                                        <th className="py-2 px-3">Adm No.</th>
                                        <th className="py-2 px-3">Name</th>
                                        <th className="py-2 px-3">{mode === 'roster' ? 'Currently in' : 'Last updated'}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {rows.map((s) => (
                                        <tr key={s.student_id} className={selected.includes(s.student_id) ? 'bg-blue-50' : ''}>
                                            <td className="py-2 px-3"><input type="checkbox" checked={selected.includes(s.student_id)} onChange={() => toggle(s.student_id)} className="h-4 w-4 rounded border-gray-300" /></td>
                                            <td className="py-2 px-3 font-mono text-gray-900">{s.admission_number}</td>
                                            <td className="py-2 px-3 text-gray-900">{s.full_name}</td>
                                            <td className="py-2 px-3 text-gray-500">{mode === 'roster' ? (s.current_class || '—') : fmt(s.updated_at)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <div className="mt-5 flex items-center justify-between border-t border-gray-200 pt-4">
                        <div className="text-sm text-gray-600">Selected: <strong>{selected.length}</strong> of {rows.length}</div>
                        <Button variant="primary" onClick={() => setIsConfirmOpen(true)} disabled={selected.length === 0 || reverting || !targetClass}>
                            Move Selected ({selected.length}) to {targetClass || '—'}
                        </Button>
                    </div>
                </div>
            )}

            <Modal isOpen={isConfirmOpen} title="Confirm Revert" onClose={() => setIsConfirmOpen(false)}
                actions={[
                    { label: 'Cancel', onClick: () => setIsConfirmOpen(false) },
                    { label: reverting ? 'Moving…' : 'Move', variant: 'primary', onClick: doRevert, disabled: reverting },
                ]}>
                <p className="text-gray-600">
                    Move {selected.length} student(s) back to {targetClass}? This only changes their
                    class and can be undone.
                </p>
            </Modal>
        </div>
    );
}
