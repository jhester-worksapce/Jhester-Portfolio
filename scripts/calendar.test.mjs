import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareCalendar } from '../calendar.js';
test('places Sunday and Monday in the correct week and sums actual counts', () => {
  const calendar = prepareCalendar({ contributions: [
    { date: '2026-09-20', count: 2, level: 2 },
    { date: '2026-09-21', count: 3, level: 3 }
  ] });
  assert.equal(calendar.total, 5);
  assert.equal(calendar.weeks, 1);
  assert.deepEqual(calendar.days.map(day => [day.column, day.row]), [[2,2],[2,3]]);
});
test('handles a leap day and week boundary', () => {
  const start = Date.parse('2024-02-28T00:00:00Z');
  const contributions = Array.from({length:5}, (_, index) => ({date:new Date(start + index * 86400000).toISOString().slice(0,10),count:1,level:1}));
  const calendar = prepareCalendar({contributions});
  assert.equal(calendar.total, 5);
  assert.equal(calendar.weeks, 2);
  assert.equal(calendar.days[1].date, '2024-02-29');
  assert.equal(calendar.days.at(-1).row, 2);
});
test('rejects failed or corrupt feeds instead of showing fabricated zero activity', () => {
  for (const payload of [{}, {contributions:[]}, {contributions:[{date:'2026-02-30',count:0,level:0}]}, {contributions:[{date:'2026-01-01',count:-1,level:0}]}, {contributions:[{date:'2026-01-01',count:1,level:8}]}]) assert.throws(() => prepareCalendar(payload));
  assert.throws(() => prepareCalendar({contributions:[{date:'2026-01-01',count:0,level:0},{date:'2026-01-03',count:0,level:0}]}), /Incomplete/);
});
