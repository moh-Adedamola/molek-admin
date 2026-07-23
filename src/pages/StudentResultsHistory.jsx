/**
 * Student Results History
 *
 * Look up one student by admission number (or name) and see every result they
 * have, grouped by session and term — including sessions they have since been
 * promoted out of. Any result can be edited here, and because broadsheets are
 * computed live, an edit shows up in that session's broadsheet immediately.
 *
 * Grading law: CA1 <= 15, CA2 <= 15, OBJ + Theory <= 70 combined, total <= 100.
 */
import { useState } from 'react';
import { examResultsAPI, studentsAPI } from '../api/endpoints';
import { Search, Pencil, X, RefreshCw } from 'lucide-react';

const gradeOf = (total) => {
    const t = parseFloat(total) || 0;
    if (t >= 75) return { g: 'A', c: 'bg-green-100 text-green-800' };
    if (t >= 70) return { g: 'B', c: 'bg-emerald-100 text-emerald-800' };
    if (t >= 60) return { g: 'C', c: 'bg-blue-100 text-blue-800' };
    if (t >= 50) return { g: 'D', c: 'bg-amber-100 text-amber-800' };
    if (t >= 45) return { g: 'E', c: 'bg-orange-100 text-orange-800' };
    return { g: 'F', c: 'bg-red-100 text-red-800' };
};

const num = (v) => (v === null || v === undefined || v === '' ? 0 : parseFloat(v) || 0);

export function StudentResultsHistory() {
    const [query, setQuery] = useState('');
    const [matches, setMatches] = useState([]);
    const [student, setStudent] = useState(null);
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [editing, setEditing] = useState(null);
    const [saving, setSaving] = useState(false);

    const search = async (e) => {
        e?.preventDefault();
        const q = query.trim();
        if (!q) { setMessage({ type: 'error', text: 'Enter an admission number or name.' }); return; }
        setSearching(true); setMessage(null); setMatches([]); setStudent(null); setResults([]);
        try {
            const res = await studentsAPI.list({ search: q, page_size: 25 });
            const list = res.data?.results || res.data || [];
            if (list.length === 0) {
                setMessage({ type: 'error', text: `No student found for "${q}".` });
            } else if (list.length === 1) {
                await loadStudent(list[0]);
            } else {
                setMatches(list);
            }
        } catch {
            setMessage({ type: 'error', text: 'Search failed.' });
        } finally {
            setSearching(false);
        }
    };

    const loadStudent = async (s) => {
        setStudent(s); setMatches([]); setLoading(true); setMessage(null);
        try {
            // page_size=500 so a full multi-session history arrives in one call.
            const res = await examResultsAPI.list({ student: s.id, page_size: 500 });
            setResults(res.data?.results || res.data || []);
        } catch {
            setMessage({ type: 'error', text: 'Could not load results for this student.' });
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const refresh = () => { if (student) loadStudent(student); };

    // Group results: session -> term -> rows
    const grouped = results.reduce((acc, r) => {
        const sess = r.session_name || 'Unknown session';
        const term = r.term_name || 'Unknown term';
        acc[sess] = acc[sess] || {};
        acc[sess][term] = acc[sess][term] || [];
        acc[sess][term].push(r);
        return acc;
    }, {});
    const sessionNames = Object.keys(grouped).sort().reverse();

    const openEdit = (r) => setEditing({
        id: r.id,
        subject_name: r.subject_name,
        session_name: r.session_name,
        term_name: r.term_name,
        ca1_score: r.ca1_score ?? '',
        ca2_score: r.ca2_score ?? '',
        obj_score: r.obj_score ?? '',
        theory_score: r.theory_score ?? '',
    });

    const editTotal = editing
        ? num(editing.ca1_score) + num(editing.ca2_score) + num(editing.obj_score) + num(editing.theory_score)
        : 0;
    const editExam = editing ? num(editing.obj_score) + num(editing.theory_score) : 0;

    const save = async (e) => {
        e.preventDefault();
        if (num(editing.ca1_score) > 15) { setMessage({ type: 'error', text: 'CA1 cannot exceed 15.' }); return; }
        if (num(editing.ca2_score) > 15) { setMessage({ type: 'error', text: 'CA2 cannot exceed 15.' }); return; }
        if (editExam > 70) { setMessage({ type: 'error', text: `OBJ + Theory (${editExam}) cannot exceed 70.` }); return; }
        if (editTotal > 100) { setMessage({ type: 'error', text: `Total (${editTotal}) cannot exceed 100.` }); return; }
        setSaving(true);
        try {
            await examResultsAPI.partialUpdate(editing.id, {
                ca1_score: num(editing.ca1_score),
                ca2_score: num(editing.ca2_score),
                obj_score: num(editing.obj_score),
                theory_score: num(editing.theory_score),
            });
            setMessage({ type: 'success', text: 'Result updated. The broadsheet for that session reflects it immediately.' });
            setEditing(null);
            refresh();
        } catch (err) {
            const d = err.response?.data;
            const msg = typeof d === 'string' ? d
                : d?.detail || d?.error
                || (d && Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`).join('; '))
                || 'Could not update result.';
            setMessage({ type: 'error', text: msg });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Student Results History</h1>
                <p className="text-gray-600 mt-1">
                    Find a student by admission number and see every result across all their
                    sessions — including sessions they have been promoted out of. Edit anything
                    here; the broadsheet for that session updates immediately.
                </p>
            </div>

            <form onSubmit={search} className="bg-white rounded-2xl shadow p-5 mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Admission number or name</label>
                <div className="flex gap-2">
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="e.g. MOL/2026/446"
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                    />
                    <button type="submit" disabled={searching}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                        <Search className="w-4 h-4" />
                        {searching ? 'Searching…' : 'Search'}
                    </button>
                </div>
            </form>

            {message && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${
                    message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'
                }`}>{message.text}</div>
            )}

            {matches.length > 0 && (
                <div className="bg-white rounded-2xl shadow p-5 mb-6">
                    <p className="text-sm text-gray-600 mb-3">{matches.length} students matched — pick one:</p>
                    <ul className="divide-y divide-gray-100">
                        {matches.map((s) => (
                            <li key={s.id}>
                                <button onClick={() => loadStudent(s)}
                                    className="w-full text-left py-2 px-2 hover:bg-blue-50 rounded flex justify-between items-center">
                                    <span className="text-gray-900">{s.last_name} {s.first_name}</span>
                                    <span className="font-mono text-xs text-gray-500">{s.admission_number}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {student && (
                <div className="bg-white rounded-2xl shadow p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-4 mb-4">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                {student.last_name} {student.first_name}
                            </h2>
                            <p className="text-sm text-gray-500">
                                <span className="font-mono">{student.admission_number}</span>
                                {student.class_level_name ? ` · currently ${student.class_level_name}` : ''}
                                {student.is_active === false ? ' · inactive' : ''}
                            </p>
                        </div>
                        <button onClick={refresh} disabled={loading}
                            className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50">
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>

                    {loading ? (
                        <p className="text-gray-500 py-8 text-center">Loading results…</p>
                    ) : results.length === 0 ? (
                        <p className="text-gray-500 py-8 text-center">No results recorded for this student yet.</p>
                    ) : (
                        sessionNames.map((sess) => (
                            <div key={sess} className="mb-6">
                                <h3 className="text-sm font-bold text-gray-800 bg-gray-100 px-3 py-2 rounded-lg">{sess}</h3>
                                {Object.keys(grouped[sess]).sort().map((term) => (
                                    <div key={term} className="mt-3">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 px-1">{term}</p>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="text-left text-gray-500 border-b border-gray-200">
                                                        <th className="py-2 px-2">Subject</th>
                                                        <th className="py-2 px-2 text-center">CA1</th>
                                                        <th className="py-2 px-2 text-center">CA2</th>
                                                        <th className="py-2 px-2 text-center">OBJ</th>
                                                        <th className="py-2 px-2 text-center">Theory</th>
                                                        <th className="py-2 px-2 text-center">Total</th>
                                                        <th className="py-2 px-2 text-center">Grade</th>
                                                        <th className="py-2 px-2"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {grouped[sess][term].map((r) => {
                                                        const total = r.total_score ?? (num(r.ca1_score) + num(r.ca2_score) + num(r.obj_score) + num(r.theory_score));
                                                        const g = gradeOf(total);
                                                        return (
                                                            <tr key={r.id}>
                                                                <td className="py-2 px-2 text-gray-900">{r.subject_name}</td>
                                                                <td className="py-2 px-2 text-center">{r.ca1_score ?? '—'}</td>
                                                                <td className="py-2 px-2 text-center">{r.ca2_score ?? '—'}</td>
                                                                <td className="py-2 px-2 text-center">{r.obj_score ?? '—'}</td>
                                                                <td className="py-2 px-2 text-center">{r.theory_score ?? '—'}</td>
                                                                <td className="py-2 px-2 text-center font-semibold">{total}</td>
                                                                <td className="py-2 px-2 text-center">
                                                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${g.c}`}>{g.g}</span>
                                                                </td>
                                                                <td className="py-2 px-2 text-right">
                                                                    <button onClick={() => openEdit(r)}
                                                                        className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-blue-300 text-blue-700 hover:bg-blue-50">
                                                                        <Pencil className="w-3 h-3" /> Edit
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))
                    )}
                </div>
            )}

            {editing && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
                            <h3 className="font-semibold text-gray-900">Edit result</h3>
                            <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={save} className="p-5">
                            <p className="text-sm text-gray-600 mb-4">
                                {editing.subject_name} · {editing.session_name} · {editing.term_name}
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    ['CA1 (max 15)', 'ca1_score'],
                                    ['CA2 (max 15)', 'ca2_score'],
                                    ['OBJ', 'obj_score'],
                                    ['Theory', 'theory_score'],
                                ].map(([label, key]) => (
                                    <div key={key}>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                                        <input type="number" step="0.01" min="0"
                                            value={editing[key]}
                                            onChange={(e) => setEditing({ ...editing, [key]: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 text-sm text-gray-600">
                                OBJ + Theory: <strong className={editExam > 70 ? 'text-red-600' : ''}>{editExam}</strong> / 70
                                {'  ·  '}
                                Total: <strong className={editTotal > 100 ? 'text-red-600' : ''}>{editTotal}</strong> / 100
                            </div>
                            <div className="mt-5 flex justify-end gap-2">
                                <button type="button" onClick={() => setEditing(null)}
                                    className="px-4 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50">Cancel</button>
                                <button type="submit" disabled={saving}
                                    className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                                    {saving ? 'Saving…' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
