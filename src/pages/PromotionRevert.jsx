/**
 * Promotion History
 *
 * Every promotion is logged. Press Undo on one and exactly those students go
 * back to their previous class, with their previous session enrollment
 * restored and the enrollment the promotion created removed.
 *
 * (The earlier manual revert tools — "by class roster CSV" and "by recent
 * activity" — were retired once the log was in place. Their backend endpoints
 * still exist, so re-running molek-promotion-revert.sh brings that UI back if
 * an old, unlogged promotion ever needs undoing.)
 */
import { useState, useEffect } from 'react';
import api from '../api/endpoints';

export function PromotionRevert() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [undoingId, setUndoingId] = useState(null);
    const [alert, setAlert] = useState(null);

    const loadEvents = async () => {
        setLoading(true); setAlert(null);
        try {
            const res = await api.get('/api/users/promotion/events/');
            setEvents(res.data.events || []);
        } catch (err) {
            setAlert({ type: 'error', msg: err.response?.data?.error || 'Could not load promotion history.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadEvents(); }, []);

    const undoEvent = async (id) => {
        if (!window.confirm('Undo this promotion? The same students will be moved back to their previous class.')) return;
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

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Promotion History</h1>
                <p className="text-gray-600 mt-1">
                    Every promotion is recorded here. Press <strong>Undo</strong> to reverse one
                    exactly — the same students go back to their previous class and session.
                    Undoing a promotion also removes the PROMOTED badge from those students'
                    portals.
                </p>
            </div>

            {alert && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${
                    alert.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'
                }`}>{alert.msg}</div>
            )}

            <div className="bg-white rounded-2xl shadow p-5">
                {loading ? (
                    <p className="text-sm text-gray-500 py-6 text-center">Loading…</p>
                ) : events.length === 0 ? (
                    <p className="text-gray-500 py-8 text-center">
                        No promotions recorded yet. Promotions are logged from the point this
                        feature was deployed.
                    </p>
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
        </div>
    );
}
