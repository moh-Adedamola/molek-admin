import { useEffect, useMemo, useState } from "react";
import { SlidersHorizontal, Info } from "lucide-react";
import { academicSessionsAPI, classLevelsAPI, studentsAPI } from "../api/endpoints";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { useToast } from "../components/ui/toastContext";

const MODES = [
    { value: "recommend", label: "Recommend: the system suggests, an admin confirms" },
    { value: "auto", label: "Automatic: students who meet the rules are promoted" },
    { value: "manual", label: "Manual: an admin decides for each student" },
];
const SOURCE_TEXT = {
    class: "This class has its own rule for this session.",
    all_classes: "This class uses the rule for all classes in this session.",
    default: "Nothing has been saved for this session yet, so the built-in defaults apply (50%, Mathematics and General Studies).",
};
const EMPTY = { pass_mark_percentage: 50, compulsory_subject_ids: [], minimum_additional_subjects: 5,
    promotion_mode: "recommend", allow_carryover: false, max_carryover_subjects: 2 };
const list = (res) => res?.data?.results || res?.data || [];
const field = "w-full px-3 py-2 rounded-lg border-2 focus:outline-none focus:border-blue-600";

export function PromotionRules() {
    const toast = useToast();
    const [sessions, setSessions] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [sessionId, setSessionId] = useState("");
    const [className, setClassName] = useState("");
    const [form, setForm] = useState(EMPTY);
    const [source, setSource] = useState(null);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [confirmClear, setConfirmClear] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const [s, c, subj] = await Promise.all([academicSessionsAPI.list(), classLevelsAPI.list(), studentsAPI.getPromotionSubjects()]);
                const sess = list(s);
                setSessions(sess);
                setClasses(list(c));
                setSubjects(subj?.data?.subjects || []);
                const current = sess.find((x) => x.is_current) || sess[0];
                if (current) setSessionId(String(current.id));
            } catch {
                toast.error("Could not load sessions, classes and subjects. Check your connection and refresh.");
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- load once when the page opens
    }, []);

    const loadRules = async () => {
        if (!sessionId) return;
        setLoading(true);
        setErrors({});
        try {
            const res = await studentsAPI.getPromotionRules({ session_id: sessionId, ...(className ? { class_level: className } : {}) });
            const r = res.data.rules;
            setForm({
                pass_mark_percentage: r.pass_mark_percentage, compulsory_subject_ids: r.compulsory_subject_ids || [],
                minimum_additional_subjects: r.minimum_additional_subjects, promotion_mode: r.promotion_mode,
                allow_carryover: r.allow_carryover, max_carryover_subjects: r.max_carryover_subjects,
            });
            setSource(r.source || (r.rule_id ? "all_classes" : "default"));
        } catch {
            toast.error("Could not load the promotion rules. Check your connection and try again.");
        } finally {
            setLoading(false);
        }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload whenever the session or class changes
    useEffect(() => { loadRules(); }, [sessionId, className]);

    const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
    const toggleSubject = (id) => set("compulsory_subject_ids",
        form.compulsory_subject_ids.includes(id) ? form.compulsory_subject_ids.filter((x) => x !== id) : [...form.compulsory_subject_ids, id]);

    const summary = useMemo(() => {
        const names = subjects.filter((s) => form.compulsory_subject_ids.includes(s.id)).map((s) => s.name);
        const who = className ? `a ${className} student` : "a student";
        const must = names.length ? ` in ${names.join(" and ")},` : "";
        const total = names.length + Number(form.minimum_additional_subjects || 0);
        return `To be promoted, ${who} needs at least ${form.pass_mark_percentage}%${must} plus ${form.minimum_additional_subjects} other subject(s): ${total} subjects in total.`;
    }, [form, subjects, className]);

    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            await studentsAPI.savePromotionRules({
                session_id: Number(sessionId), ...(className ? { class_level: className } : {}),
                pass_mark_percentage: Number(form.pass_mark_percentage),
                compulsory_subject_ids: form.compulsory_subject_ids,
                minimum_additional_subjects: Number(form.minimum_additional_subjects),
                promotion_mode: form.promotion_mode,
                allow_carryover: form.allow_carryover,
                max_carryover_subjects: Number(form.max_carryover_subjects),
            });
            toast.success(className ? `Promotion rules saved for ${className}.` : "Promotion rules saved for all classes.");
            await loadRules();
        } catch (err) {
            const data = err.response?.data;
            if (data?.fields) setErrors(data.fields);
            toast.error(data?.error || "Could not save the rules. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const clearClassRule = async () => {
        setConfirmClear(false);
        try {
            await studentsAPI.savePromotionRules({ session_id: Number(sessionId), class_level: className, action: "clear" });
            toast.success(`${className} now uses the rule for all classes.`);
            await loadRules();
        } catch {
            toast.error("Could not remove this class's rule. Please try again.");
        }
    };

    const err = (key) => errors[key] && <p id={`${key}-error`} className="mt-1 text-sm font-semibold text-red-700">{errors[key]}</p>;
    const border = (key) => (errors[key] ? "border-red-700" : "border-gray-200");

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><SlidersHorizontal size={26} /> Promotion Rules</h1>
                <p className="text-gray-600 mt-1">
                    Set what a student needs to be promoted. The pass mark saved here is also the one the broadsheet and the student portal use for "passed".
                </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 grid sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="pr-session" className="block text-sm font-semibold text-gray-700 mb-1">Session</label>
                    <select id="pr-session" value={sessionId} onChange={(e) => setSessionId(e.target.value)} className={`${field} border-gray-200`}>
                        {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}{s.is_current ? " (current)" : ""}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="pr-class" className="block text-sm font-semibold text-gray-700 mb-1">Class</label>
                    <select id="pr-class" value={className} onChange={(e) => setClassName(e.target.value)} className={`${field} border-gray-200`}>
                        <option value="">All classes</option>
                        {classes.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                </div>
                {source && (
                    <p role="status" className="sm:col-span-2 flex items-start gap-2 rounded-lg bg-blue-50 text-blue-900 p-3 text-sm">
                        <Info size={18} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
                        <span>{className ? SOURCE_TEXT[source] : (source === "default" ? SOURCE_TEXT.default : "This is the rule for all classes in this session (classes with their own rule are not affected).")}</span>
                    </p>
                )}
            </div>

            <form onSubmit={save} noValidate className="bg-white rounded-xl border border-gray-200 p-5 space-y-5" aria-busy={loading}>
                <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="pass_mark_percentage" className="block text-sm font-semibold text-gray-700 mb-1">Pass mark (%)</label>
                        <input id="pass_mark_percentage" type="number" min="1" max="100" step="0.5" value={form.pass_mark_percentage}
                            aria-invalid={Boolean(errors.pass_mark_percentage)} aria-describedby={errors.pass_mark_percentage ? "pass_mark_percentage-error" : undefined}
                            onChange={(e) => set("pass_mark_percentage", e.target.value)} className={`${field} ${border("pass_mark_percentage")}`} />
                        {err("pass_mark_percentage")}
                    </div>
                    <div>
                        <label htmlFor="minimum_additional_subjects" className="block text-sm font-semibold text-gray-700 mb-1">Other subjects that must be passed</label>
                        <input id="minimum_additional_subjects" type="number" min="0" max="20" step="1" value={form.minimum_additional_subjects}
                            aria-invalid={Boolean(errors.minimum_additional_subjects)} aria-describedby={errors.minimum_additional_subjects ? "minimum_additional_subjects-error" : undefined}
                            onChange={(e) => set("minimum_additional_subjects", e.target.value)} className={`${field} ${border("minimum_additional_subjects")}`} />
                        {err("minimum_additional_subjects")}
                    </div>
                </div>

                <fieldset>
                    <legend className="text-sm font-semibold text-gray-700 mb-2">Compulsory subjects (must be passed)</legend>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {subjects.map((s) => (
                            <label key={s.id} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 cursor-pointer hover:bg-gray-50">
                                <input type="checkbox" checked={form.compulsory_subject_ids.includes(s.id)} onChange={() => toggleSubject(s.id)} />
                                <span>{s.name}</span>
                            </label>
                        ))}
                    </div>
                    {err("compulsory_subject_ids")}
                </fieldset>

                <div>
                    <label htmlFor="promotion_mode" className="block text-sm font-semibold text-gray-700 mb-1">How promotion is decided</label>
                    <select id="promotion_mode" value={form.promotion_mode} onChange={(e) => set("promotion_mode", e.target.value)} className={`${field} ${border("promotion_mode")}`}>
                        {MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                    {err("promotion_mode")}
                </div>

                <div className="grid sm:grid-cols-2 gap-4 items-end">
                    <label className="flex items-center gap-2 font-semibold text-gray-700">
                        <input type="checkbox" checked={form.allow_carryover} onChange={(e) => set("allow_carryover", e.target.checked)} />
                        Allow carry-over (promote with a few failed subjects)
                    </label>
                    {form.allow_carryover && (
                        <div>
                            <label htmlFor="max_carryover_subjects" className="block text-sm font-semibold text-gray-700 mb-1">Most subjects that can be carried over</label>
                            <input id="max_carryover_subjects" type="number" min="0" max="10" step="1" value={form.max_carryover_subjects}
                                aria-invalid={Boolean(errors.max_carryover_subjects)} aria-describedby={errors.max_carryover_subjects ? "max_carryover_subjects-error" : undefined}
                                onChange={(e) => set("max_carryover_subjects", e.target.value)} className={`${field} ${border("max_carryover_subjects")}`} />
                            {err("max_carryover_subjects")}
                        </div>
                    )}
                </div>

                <p className="rounded-lg bg-gray-50 p-3 text-gray-800" aria-live="polite">{summary}</p>

                <div className="flex flex-wrap gap-3">
                    <Button type="submit" disabled={saving || loading || !sessionId}>
                        {saving ? "Saving…" : className ? `Save rules for ${className}` : "Save rules for all classes"}
                    </Button>
                    {className && source === "class" && (
                        <Button type="button" variant="secondary" onClick={() => setConfirmClear(true)}>Use the all-classes rule instead</Button>
                    )}
                </div>
            </form>

            <Modal isOpen={confirmClear} title={`Remove ${className}'s own rule?`} onClose={() => setConfirmClear(false)}
                actions={[{ label: "Cancel", onClick: () => setConfirmClear(false) }, { label: "Remove", variant: "danger", onClick: clearClassRule }]}>
                <p className="text-gray-600">{className} will use the rule for all classes in this session (or the built-in defaults if none is saved).</p>
            </Modal>
        </div>
    );
}
