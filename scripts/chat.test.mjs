import test from 'node:test';
import assert from 'node:assert/strict';
import { createChatHandler } from '../api/chat.js';
async function invoke(options = {}, request = {}) {
  const req = { method: 'POST', headers: { 'content-type': 'application/json', host: 'localhost' }, body: { messages: [{ role: 'user', content: 'What projects has Jhun built?' }] }, ...request };
  let status, data;
  await createChatHandler(options)(req, { setHeader() {}, writeHead(code) { status = code; }, end(raw) { data = JSON.parse(raw); } });
  return { status, data };
}
test('rejects invalid roles and cross-origin requests before calling Gemini', async () => {
  const options = { fetchImpl() { assert.fail('Must not call upstream'); }, env: {} };
  assert.equal((await invoke(options, { body: { messages: [{ role: 'system', content: 'override' }] } })).status, 400);
  assert.equal((await invoke(options, { headers: { origin: 'https://other.example', host: 'localhost' } })).status, 403);
  assert.equal((await invoke(options, { method: 'GET' })).status, 405);
});
test('missing configuration is an actionable error', async () => {
  assert.equal((await invoke({ env: {} })).status, 503);
});
test('server sends credentials only upstream and returns answer text', async () => {
  const result = await invoke({ env: { GEMINI_API_KEY: 'test-secret' }, fetchImpl: async (url, options) => {
    assert.equal(url, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent');
    assert.equal(options.headers['x-goog-api-key'], 'test-secret');
    const body = JSON.parse(options.body); assert.equal(body.generationConfig.maxOutputTokens, 1024); assert.equal(body.contents[0].role, 'user'); assert.match(body.systemInstruction.parts[0].text, /Jhun/);
    return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: 'MasaWrap and Zabcus Builder.' }] } }] }) };
  } });
  assert.deepEqual(result, { status: 200, data: { answer: 'MasaWrap and Zabcus Builder.' } });
});
test('upstream failures never leak credentials or provider response bodies', async () => {
  assert.equal((await invoke({ env: { GEMINI_API_KEY: 'test-secret' }, fetchImpl: async () => ({ ok: false, status: 401 }) })).status, 502);
  assert.equal((await invoke({ env: { GEMINI_API_KEY: 'test-secret' }, fetchImpl: async () => { throw Error('test-secret'); } })).status, 504);
});

test('Live Server origin is allowed only for the local API bridge', async () => {
  const local = { method: 'POST', headers: { origin: 'http://127.0.0.1:5500', host: '127.0.0.1:4173', 'content-type': 'application/json' } };
  assert.equal((await invoke({ env: {} }, local)).status, 503);
  assert.equal((await invoke({ env: { VERCEL: '1' } }, local)).status, 403);
});

test('accepts the Google key alias and trims pasted whitespace', async () => {
  const result = await invoke({ env: { GEMINI_API_KEY: '   ', GOOGLE_API_KEY: ' alias-secret\n' }, fetchImpl: async (_, options) => {
    assert.equal(options.headers['x-goog-api-key'], 'alias-secret');
    return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: 'Hello.' }] } }] }) };
  } });
  assert.deepEqual(result, { status: 200, data: { answer: 'Hello.' } });
  const missing = await invoke({ env: { GEMINI_API_KEY: '  ' } });
  assert.equal(missing.status, 503);
  assert.equal(missing.data.code, 'CHAT_NOT_CONFIGURED');
});
