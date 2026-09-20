// Pure calendar preparation, shared by rendering and tests. All dates use UTC.
const dayMs = 86400000;
export function prepareCalendar(payload) {
  if (!payload || !Array.isArray(payload.contributions) || !payload.contributions.length) throw new Error('No contribution data returned');
  const days = payload.contributions.map(day => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day.date) || !Number.isInteger(day.count) || day.count < 0 || !Number.isInteger(day.level) || day.level < 0 || day.level > 4) throw new Error('Invalid contribution data');
    const timestamp = Date.parse(day.date + 'T00:00:00Z');
    if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== day.date) throw new Error('Invalid date');
    return { ...day, timestamp };
  }).sort((a, b) => a.timestamp - b.timestamp);
  if (new Set(days.map(day => day.date)).size !== days.length || days.length > 366) throw new Error('Invalid date range');
  for (let i = 1; i < days.length; i++) if (days[i].timestamp - days[i - 1].timestamp !== dayMs) throw new Error('Incomplete contribution calendar');
  const start = days[0].timestamp - new Date(days[0].timestamp).getUTCDay() * dayMs;
  return {
    total: days.reduce((total, day) => total + day.count, 0),
    weeks: Math.floor((days.at(-1).timestamp - start) / dayMs / 7) + 1,
    days: days.map(day => ({ ...day, column: Math.floor((day.timestamp - start) / dayMs / 7) + 2, row: new Date(day.timestamp).getUTCDay() + 2 }))
  };
}
