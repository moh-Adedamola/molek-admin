import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nameKey, parseCsv, toCsv, dateIssue, findMatches, fetchAllStudents } from './duplicates.js';

test('names match regardless of case, spaces, punctuation and order', () => {
    assert.equal(nameKey('Kayode', 'Raji'), nameKey(' raji ', 'KAYODE'));
    assert.equal(nameKey('Abdul-Rahman', 'Jimoh'), nameKey('Abdulrahman', 'jimoh'));
    assert.notEqual(nameKey('Ibrahim', 'Sanusi'), nameKey('Ibrahim', 'Sanni'));
});

test('CSV with BOM, quotes and Windows line endings', () => {
    const { headers, rows } = parseCsv('\uFEFFfirst_name,last_name,address\r\n"Aisha","Bello","10, Main St"\r\n\r\nYusuf,Ade,"He said ""hi"""\r\n');
    assert.deepEqual(headers, ['first_name', 'last_name', 'address']);
    assert.equal(rows.length, 2);
    assert.equal(rows[0].address, '10, Main St');
    assert.equal(rows[1].address, 'He said "hi"');
    const again = parseCsv(toCsv(headers, rows));
    assert.deepEqual(again.rows, rows);
});

test('dates: clear, ambiguous, invalid', () => {
    assert.equal(dateIssue('2014-01-03'), null);
    assert.equal(dateIssue('15/05/2010'), null);      // day > 12: only one reading
    assert.equal(dateIssue('03/01/2014'), 'ambiguous');
    assert.equal(dateIssue('05/05/2014'), null);      // same either way
    assert.equal(dateIssue('31/02/2014'), 'invalid');
    assert.equal(dateIssue('2014-13-01'), 'invalid');
    assert.equal(dateIssue(''), 'missing');
});

test('rows are matched to existing students with the same name', () => {
    const existing = [{ admission_number: 'MOL/2026/133', first_name: 'Abdulhameed', last_name: 'Abdulazeez' }];
    const m = findMatches([{ first_name: 'abdulazeez', last_name: 'Abdulhameed ' }, { first_name: 'New', last_name: 'Pupil' }], existing);
    assert.equal(m[0].length, 1);
    assert.equal(m[1].length, 0);
});

test('all pages of students are fetched', async () => {
    const calls = [];
    const list = async ({ page }) => { calls.push(page); return { data: { results: [{ id: page }], next: page < 3 ? 'more' : null } }; };
    const all = await fetchAllStudents(list);
    assert.deepEqual(all.map((s) => s.id), [1, 2, 3]);
});
