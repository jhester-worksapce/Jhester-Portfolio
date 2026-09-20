const instructions = `You are Jhun's portfolio assistant, not Jhun. Answer briefly using only these facts: Jhun Lester Cervantes is a freelance full-stack developer and IT educator in La Union, Philippines. Projects: MasaWrap (food brand website), Zabcus Builder (construction business website). Skills: HTML, CSS, JavaScript, PHP, Laravel, Python, Flutter, Bootstrap. Services: web development, interface design, application development teaching, technical support. Contact: jhunlester88@gmail.com. Never invent prices, availability or credentials; refer unknown details to email. Do not claim to send messages. Only help with this portfolio. Plain text.`;
const budgets = new Map();
export function createChatHandler({ fetchImpl = fetch, env = process.env } = {}) {
  return async function handler(req, res) {
    const reply = (code, data) => { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)); };
    const origin = req.headers.origin;
    const localPreview = !env.VERCEL && ['127.0.0.1:4175', 'localhost:4175'].includes(req.headers.host) && ['http://127.0.0.1:5500', 'http://localhost:5500'].includes(origin);
    if (localPreview) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
    }
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return reply(405, { error: 'Use POST.' }); }
    if (origin && !localPreview && ![env.SITE_URL?.replace(/\/$/, ''), `https://${req.headers.host}`, `http://${req.headers.host}`].includes(origin)) return reply(403, { error: 'Request origin not allowed.' });
    if (!req.headers['content-type']?.startsWith('application/json')) return reply(415, { error: 'Use JSON.' });
    let body;
    try {
      if (req.body) body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      else {
        let raw = '';
        for await (const chunk of req) { raw += chunk; if (Buffer.byteLength(raw) > 12000) return reply(413, { error: 'Message is too large.' }); }
        body = JSON.parse(raw);
      }
    } catch { return reply(400, { error: 'Invalid request.' }); }
    const messages = body?.messages;
    if (!Array.isArray(messages) || !messages.length || messages.length > 7 || messages.at(-1)?.role !== 'user' || messages.some(m => !['user', 'assistant'].includes(m?.role) || typeof m.content !== 'string' || !m.content.trim() || m.content.length > 1200)) return reply(400, { error: 'Send a question of up to 1,200 characters.' });
    if (!env.GEMINI_API_KEY) return reply(503, { error: 'Chat is not configured yet. Please contact Jhun by email.' });
    // Per-process cost cap. Use a shared gateway limit for multi-instance hosting.
    const minute = Math.floor(Date.now() / 60000);
    for (const key of budgets.keys()) if (key !== minute) budgets.delete(key);
    const count = budgets.get(minute) || 0;
    if (count >= 20) { res.setHeader('Retry-After', '60'); return reply(429, { error: 'Chat is busy. Please try again in a minute.' }); }
    budgets.set(minute, count + 1);
    try {
      const model = env.GEMINI_MODEL || 'gemini-3.5-flash';
      const upstream = await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST', headers: { 'x-goog-api-key': env.GEMINI_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemInstruction: { parts: [{ text: instructions }] }, contents: messages.map(({ role, content }) => ({ role: role === 'assistant' ? 'model' : 'user', parts: [{ text: content }] })), generationConfig: { maxOutputTokens: 1024, temperature: 0.3, ...(model.startsWith("gemini-3") ? { thinkingConfig: { thinkingLevel: "minimal" } } : {}) } }),
        signal: AbortSignal.timeout(30000)
      });
      if (!upstream.ok) return reply(upstream.status === 429 ? 429 : 502, { error: upstream.status === 429 ? 'The AI service is at its usage limit. Please try later.' : 'The AI service is unavailable. Please try later or email Jhun.' });
      const data = await upstream.json();
      const answer = (data.candidates?.[0]?.content?.parts || []).filter(part => !part.thought && typeof part.text === 'string').map(part => part.text).join('\n').trim();
      if (!answer) return reply(502, { error: 'No answer was returned. Please try again.' });
      return reply(200, { answer });
    } catch { return reply(504, { error: 'The AI service took too long. Please try again.' }); }
  };
}
export default createChatHandler();
