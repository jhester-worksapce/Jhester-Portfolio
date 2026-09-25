import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { makePassage } from '../typing.js';
const source = readFileSync(new URL('../assistant.js', import.meta.url), 'utf8');
function setup(supported = true) {
  const nodes = new Map();
  const node = key => {
    if (!nodes.has(key)) nodes.set(key, { value: '', textContent: '', open: true, hidden: false, attrs: {}, events: {}, addEventListener(type, callback) { this.events[type] = callback; }, setAttribute(k,v) { this.attrs[k] = v; }, focus() {}, replaceChildren() {} });
    return nodes.get(key);
  };
  let session;
  class Recognition {
    constructor() { session = this; }
    start() { this.onstart(); }
    stop() { this.onend(); }
    abort() { this.onend?.(); }
  }
  vm.runInNewContext(source, { document: { querySelector: node, querySelectorAll: () => [] }, window: { SpeechRecognition: supported ? Recognition : undefined, isSecureContext: true }, location: { hostname: 'example.com' }, navigator: { language: 'en-US' }, AbortController, setTimeout, clearTimeout });
  return { node, session: () => session };
}
test('dictation preserves draft while open and clears it on close, ignoring late results', () => {
  const {node,session} = setup();
  node('#ai-input').value = 'Please explain'; node('#ai-mic').events.click();
  assert.equal(node('#ai-mic').attrs['aria-pressed'], 'true');
  session().onresult({ results: [[{ transcript: 'gravity' }]] });
  assert.equal(node('#ai-input').value, 'Please explain gravity');
  node('#ai-dialog').events.close();
  session().onresult({ results: [[{ transcript: 'late audio' }]] });
  assert.equal(node('#ai-input').value, '');
  assert.equal(node('#ai-mic').attrs['aria-pressed'], 'false');
});
test('denied and unsupported microphones keep text input usable', () => {
  const {node,session} = setup(); node('#ai-mic').events.click();
  session().onerror({ error: 'not-allowed' }); session().onend();
  assert.match(node('#ai-status').textContent, /denied/);
  assert.equal(node('#ai-mic').attrs['aria-pressed'], 'false');
  const fallback = setup(false); fallback.node('#ai-mic').events.click();
  assert.match(fallback.node('#ai-status').textContent, /unavailable/);
});
test('typing modes produce long, changing exercises', () => {
  for (const mode of ['words', 'sentences', 'code']) {
    const first = makePassage(mode), next = makePassage(mode, first);
    assert(first.length > 900); assert.notEqual(first, next);
    if (mode === 'code') assert.match(first, /=>/);
    if (mode === 'sentences') assert.match(first, /\./);
  }
});
