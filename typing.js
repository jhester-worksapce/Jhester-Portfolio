const words = 'river quiet build morning cloud gentle light learn create ocean forest bright window journey rhythm curious simple garden dream paper silver explore thoughtful brave wonder small world story design listen shape green path summer flow clear open space warm rain golden people tomorrow focus language music mountain road idea useful craft fresh welcome travel'.split(' ');
const sentences = [
  'The first light of morning moved slowly across the quiet room.',
  'A good question can lead you somewhere you never expected to go.',
  'We packed our bags and followed the road toward the ocean.',
  'Small steps become meaningful progress when you take them every day.',
  'She opened her notebook and sketched a new idea beside the window.',
  'The best tools help people spend more time doing what they love.',
  'Rain tapped on the roof while the whole town settled into the evening.',
  'Learning a new skill takes patience, practice, and a little curiosity.',
  'There is always another way to look at a familiar problem.',
  'He shared the last piece of bread and poured another cup of coffee.',
  'Clear writing makes complicated ideas easier for everyone to understand.',
  'Beyond the mountains, a small village waited beneath a silver sky.'
];
const code = [
  'const sum = (a, b) => a + b;', 'const names = users.map(user => user.name);',
  'if (ready) { start(); } else { wait(); }', 'for (let i = 0; i < 10; i++) { count += i; }',
  'const active = items.filter(item => item.active);', 'function greet(name) { return "Hello " + name; }',
  'const total = prices.reduce((a, b) => a + b, 0);', 'async function load() { return await fetch(url); }'
];
function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
export function makePassage(mode, previous = '') {
  const pool = mode === 'sentences' ? sentences : mode === 'code' ? code : words;
  const parts = Array.from({ length: mode === 'words' ? 4 : 3 }, () => shuffle(pool)).flat();
  let result = parts.join(' ');
  if (result === previous) result = [...parts.slice(1), parts[0]].join(' ');
  return result;
}
