/**
 * Duplicate-student checks used before adding students.
 * A student is the "same name" when first + last name match, ignoring case,
 * spaces, punctuation and which one was typed first ("Raji Kayode" = "kayode RAJI").
 */

export function nameKey(first, last) {
    const n = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return [n(first), n(last)].sort().join('|');
}

/** Small CSV reader: quotes, commas and newlines inside quotes, CRLF, Excel's BOM. */
export function parseCsv(text) {
    const rows = [];
    let row = [], field = '', quoted = false;
    const s = String(text || '').replace(/^\uFEFF/, '');
    for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (quoted) {
            if (c === '"' && s[i + 1] === '"') { field += '"'; i++; }
            else if (c === '"') quoted = false;
            else field += c;
        } else if (c === '"') quoted = true;
        else if (c === ',') { row.push(field); field = ''; }
        else if (c === '\n' || c === '\r') {
            if (c === '\r' && s[i + 1] === '\n') i++;
            row.push(field); field = '';
            if (row.some((v) => v.trim() !== '')) rows.push(row);
            row = [];
        } else field += c;
    }
    row.push(field);
    if (row.some((v) => v.trim() !== '')) rows.push(row);
    if (!rows.length) return { headers: [], rows: [] };
    const headers = rows[0].map((h) => h.trim().toLowerCase());
    return { headers, rows: rows.slice(1).map((r) => Object.fromEntries(headers.map((h, i) => [h, (r[i] ?? '').trim()]))) };
}

export function toCsv(headers, rows) {
    const q = (v) => (/[",\n\r]/.test(String(v ?? '')) ? `"${String(v).replace(/"/g, '""')}"` : String(v ?? ''));
    return [headers.join(','), ...rows.map((r) => headers.map((h) => q(r[h])).join(','))].join('\n') + '\n';
}

/**
 * Date of birth check. YYYY-MM-DD is always clear. DD/MM/YYYY is read day-first,
 * but when both numbers are 12 or less (03/01/2014) it could be either:
 * spreadsheets sometimes swap them, which is how duplicates were created.
 * Returns null (fine), 'ambiguous', 'invalid' or 'missing'.
 */
export function dateIssue(value) {
    const v = String(value || '').trim();
    if (!v) return 'missing';
    let m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (m) return validDate(+m[1], +m[2], +m[3]) ? null : 'invalid';
    m = v.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
    if (!m) return 'invalid';
    const [a, b, y] = [+m[1], +m[2], +m[3]];
    if (!validDate(y, b, a)) return 'invalid';
    return a <= 12 && b <= 12 && a !== b ? 'ambiguous' : null;
}

function validDate(y, mo, d) {
    const dt = new Date(Date.UTC(y, mo - 1, d));
    return y > 1900 && dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

/** For each CSV row, the existing students with the same name. */
export function findMatches(rows, existing) {
    const byKey = new Map();
    for (const s of existing) {
        const k = nameKey(s.first_name, s.last_name);
        if (!byKey.has(k)) byKey.set(k, []);
        byKey.get(k).push(s);
    }
    return rows.map((r) => byKey.get(nameKey(r.first_name, r.last_name)) || []);
}

/** Every student (active and inactive), page by page. */
export async function fetchAllStudents(list, { pageSize = 200, maxPages = 30 } = {}) {
    const all = [];
    for (let page = 1; page <= maxPages; page++) {
        const res = await list({ page, page_size: pageSize });
        const data = res?.data ?? res;
        const items = Array.isArray(data) ? data : data?.results || [];
        all.push(...items);
        if (Array.isArray(data) || !data?.next || !items.length) break;
    }
    return all;
}

export function describeStudent(s) {
    const cls = s.class_level_name || s.class_name || '';
    const born = s.date_of_birth ? `, born ${s.date_of_birth}` : '';
    const off = s.is_active === false ? ', INACTIVE' : '';
    return `${s.admission_number} ${s.first_name} ${s.last_name}${cls ? ` (${cls}${born}${off})` : ''}`;
}
