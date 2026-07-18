import { useState, useEffect, Fragment } from 'react';
import { broadsheetAPI, academicSessionsAPI, termsAPI, classLevelsAPI } from '../api/endpoints';
import { RefreshCw, Printer, Download, Table2 } from 'lucide-react';

/**
 * Cumulative Broadsheet — mirrors the school's manual sheet:
 *   Term 1: CA1 (15) | CA2 (15) | EXAM (70) | TOTAL (100)
 *   Term 2: 1ST TERM (100) | CA (30) | EXAM (70) | CUM (200)
 *   Term 3: CUM B/F (200) | CA (30) | EXAM (70) | CUM (300)
 * Footer: No. Passed / No. Failed / No. Examined / % Passed.
 * Landscape print + CSV export.
 */
export function Broadsheet() {
    const [sessions, setSessions] = useState([]);
    const [terms, setTerms] = useState([]);
    const [classLevels, setClassLevels] = useState([]);
    const [filters, setFilters] = useState({ session: '', term: '', class_level: '' });
    const [sheet, setSheet] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => { fetchDropdownData(); }, []);

    const fetchDropdownData = async () => {
        try {
            const [sessionsRes, termsRes, classesRes] = await Promise.all([
                academicSessionsAPI.list(), termsAPI.list(), classLevelsAPI.list()
            ]);
            const sessionList = sessionsRes.data.results || sessionsRes.data || [];
            const termList = termsRes.data.results || termsRes.data || [];
            setSessions(sessionList);
            setTerms(termList);
            setClassLevels(classesRes.data.results || classesRes.data || []);
            const currentSession = sessionList.find(s => s.is_current);
            const currentTerm = termList.find(t => t.is_current);
            setFilters(f => ({
                ...f,
                session: currentSession ? String(currentSession.id) : f.session,
                term: currentTerm ? String(currentTerm.id) : f.term,
            }));
        } catch {
            setMessage({ type: 'error', text: 'Could not load sessions/terms/classes.' });
        }
    };

    // Terms belonging to the selected session (fall back to all if shape differs)
    const sessionTerms = (() => {
        if (!filters.session) return terms;
        const scoped = terms.filter(t => String(t.session) === String(filters.session));
        return scoped.length ? scoped : terms;
    })();

    const formatApiError = (err, fallback) => {
        const data = err?.response?.data;
        if (!data || typeof data === 'string') return fallback;
        if (data.detail) return data.detail;
        if (data.error) return data.error;
        return fallback;
    };

    const loadSheet = async () => {
        if (!filters.session || !filters.term || !filters.class_level) {
            setMessage({ type: 'error', text: 'Pick a session, term and class first.' });
            return;
        }
        setLoading(true);
        setMessage(null);
        try {
            const res = await broadsheetAPI.get({
                session: filters.session, term: filters.term, class_level: filters.class_level,
            });
            setSheet(res.data);
            if (!res.data.students?.length) {
                setMessage({ type: 'info', text: 'No students found for that class.' });
            }
        } catch (err) {
            setSheet(null);
            setMessage({ type: 'error', text: formatApiError(err, 'Could not load the broadsheet.') });
        } finally {
            setLoading(false);
        }
    };

    const fmt = (v) => (v === null || v === undefined ? '—' : Number(v) % 1 === 0 ? String(Number(v)) : Number(v).toFixed(1));

    const exportCSV = () => {
        if (!sheet) return;
        const cols = sheet.columns;
        const head1 = ['S/N', 'ADMISSION NO', 'NAME', ...sheet.subjects.flatMap(s => [s.name, '', '', '']), 'TOTAL', 'AVG (%)', 'POS'];
        const head2 = ['', '', '', ...sheet.subjects.flatMap(() => cols), '', '', ''];
        const rows = sheet.students.map((st, i) => {
            const cells = sheet.subjects.flatMap(s => {
                const c = st.scores[String(s.id)];
                return c ? [c.c1 ?? '', c.c2 ?? '', c.c3 ?? '', c.c4 ?? ''] : ['', '', '', ''];
            });
            return [i + 1, st.admission_number, st.name, ...cells, st.total ?? '', st.average ?? '', st.position ?? ''];
        });
        const footer = [
            [],
            ['No. Passed', sheet.stats.passed],
            ['No. Failed', sheet.stats.failed],
            ['No. Examined', sheet.stats.examined],
            ['% Passed', `${sheet.stats.percent_passed}%`],
            ['Pass Mark', `${sheet.pass_mark}%`],
        ];
        const esc = (v) => {
            const s = String(v);
            return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        };
        const csv = '\uFEFF' + [head1, head2, ...rows, ...footer].map(r => r.map(esc).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `broadsheet_${sheet.class_level}_${sheet.term.replace(/\s+/g, '_')}_${sheet.session.replace(/\//g, '-')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-4 md:p-6 space-y-4">
            {/* Print rules: only the sheet, in landscape */}
            <style>{`
                @media print {
                    @page { size: A4 landscape; margin: 8mm; }
                    body * { visibility: hidden; }
                    #broadsheet-print, #broadsheet-print * { visibility: visible; }
                    #broadsheet-print { position: absolute; left: 0; top: 0; width: 100%; }
                    #broadsheet-print .bs-scroll { overflow: visible !important; max-height: none !important; }
                    #broadsheet-print table { font-size: 8px; }
                }
            `}</style>

            <div className="flex items-center justify-between flex-wrap gap-2">
                <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Table2 className="w-6 h-6 text-emerald-600" /> Broadsheet
                </h1>
                {sheet && (
                    <div className="flex gap-2">
                        <button onClick={exportCSV}
                            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white hover:bg-gray-50">
                            <Download className="w-4 h-4" /> CSV
                        </button>
                        <button onClick={() => window.print()}
                            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">
                            <Printer className="w-4 h-4" /> Print
                        </button>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Session</label>
                        <select value={filters.session}
                            onChange={(e) => setFilters({ ...filters, session: e.target.value, term: '' })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                            <option value="">Select session</option>
                            {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Term</label>
                        <select value={filters.term}
                            onChange={(e) => setFilters({ ...filters, term: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                            <option value="">Select term</option>
                            {sessionTerms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Class</label>
                        <select value={filters.class_level}
                            onChange={(e) => setFilters({ ...filters, class_level: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                            <option value="">Select class</option>
                            {classLevels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button onClick={loadSheet} disabled={loading}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            {loading ? 'Loading…' : 'Load Broadsheet'}
                        </button>
                    </div>
                </div>
            </div>

            {message && (
                <div className={`px-4 py-3 rounded-lg text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                    {message.text}
                </div>
            )}

            {/* The sheet */}
            {sheet && sheet.students.length > 0 && (
                <div id="broadsheet-print" className="bg-white rounded-xl shadow">
                    <div className="text-center py-3 border-b">
                        <h2 className="text-lg font-bold tracking-wide">{sheet.school} — {sheet.title}</h2>
                        <p className="text-sm text-gray-600">
                            Class: <span className="font-semibold">{sheet.class_level}</span>
                            {'  ·  '}Term: <span className="font-semibold">{sheet.term}</span>
                            {'  ·  '}Session: <span className="font-semibold">{sheet.session}</span>
                            {'  ·  '}Pass mark: <span className="font-semibold">{sheet.pass_mark}%</span>
                        </p>
                    </div>

                    <div className="bs-scroll overflow-auto max-h-[70vh]">
                        <table className="min-w-full text-[11px] border-collapse">
                            <thead className="sticky top-0 z-10">
                                <tr className="bg-emerald-700 text-white">
                                    <th rowSpan={2} className="border border-emerald-800 px-1 py-1 sticky left-0 bg-emerald-700">S/N</th>
                                    <th rowSpan={2} className="border border-emerald-800 px-2 py-1 text-left sticky left-8 bg-emerald-700 min-w-[150px]">NAME</th>
                                    {sheet.subjects.map(s => (
                                        <th key={s.id} colSpan={4} className="border border-emerald-800 px-1 py-1 whitespace-nowrap">{s.name.toUpperCase()}</th>
                                    ))}
                                    <th rowSpan={2} className="border border-emerald-800 px-1 py-1">TOTAL</th>
                                    <th rowSpan={2} className="border border-emerald-800 px-1 py-1">AVG %</th>
                                    <th rowSpan={2} className="border border-emerald-800 px-1 py-1">POS</th>
                                </tr>
                                <tr className="bg-emerald-600 text-white">
                                    {sheet.subjects.map(s => (
                                        sheet.columns.map((c, i) => (
                                            <th key={`${s.id}-${i}`} className="border border-emerald-800 px-1 py-0.5 font-normal whitespace-nowrap">{c}</th>
                                        ))
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {sheet.students.map((st, idx) => (
                                    <tr key={st.admission_number} className={`${st.average !== null && !st.passed ? 'bg-red-50' : idx % 2 ? 'bg-gray-50' : 'bg-white'}`}>
                                        <td className="border px-1 py-1 text-center sticky left-0 bg-inherit">{idx + 1}</td>
                                        <td className="border px-2 py-1 whitespace-nowrap sticky left-8 bg-inherit">
                                            <div className="font-medium text-gray-800">{st.name}</div>
                                            <div className="text-[9px] text-gray-500">{st.admission_number}</div>
                                        </td>
                                        {sheet.subjects.map(s => {
                                            const c = st.scores[String(s.id)];
                                            return c ? (
                                                <Fragment key={s.id}>
                                                    <td className="border px-1 py-1 text-center">{fmt(c.c1)}</td>
                                                    <td className="border px-1 py-1 text-center">{fmt(c.c2)}</td>
                                                    <td className="border px-1 py-1 text-center">{fmt(c.c3)}</td>
                                                    <td className="border px-1 py-1 text-center font-semibold">{fmt(c.c4)}</td>
                                                </Fragment>
                                            ) : (
                                                <td key={`${s.id}x`} colSpan={4} className="border px-1 py-1 text-center text-gray-300">—</td>
                                            );
                                        })}
                                        <td className="border px-1 py-1 text-center font-semibold">{fmt(st.total)}</td>
                                        <td className={`border px-1 py-1 text-center font-semibold ${st.average !== null && !st.passed ? 'text-red-600' : 'text-gray-800'}`}>{fmt(st.average)}</td>
                                        <td className="border px-1 py-1 text-center">{st.position ?? '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer stats — matches the manual sheet */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 border-t text-sm">
                        <div className="bg-emerald-50 rounded-lg px-3 py-2">
                            <span className="text-gray-600">No. Passed:</span> <span className="font-bold text-emerald-700">{sheet.stats.passed}</span>
                        </div>
                        <div className="bg-red-50 rounded-lg px-3 py-2">
                            <span className="text-gray-600">No. Failed:</span> <span className="font-bold text-red-700">{sheet.stats.failed}</span>
                        </div>
                        <div className="bg-gray-50 rounded-lg px-3 py-2">
                            <span className="text-gray-600">No. Examined:</span> <span className="font-bold text-gray-800">{sheet.stats.examined}</span>
                        </div>
                        <div className="bg-emerald-50 rounded-lg px-3 py-2">
                            <span className="text-gray-600">% Passed:</span> <span className="font-bold text-emerald-700">{sheet.stats.percent_passed}%</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
