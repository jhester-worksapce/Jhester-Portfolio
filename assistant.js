const $ = selector => document.querySelector(selector);
const dialog = $('#ai-dialog'), input = $('#ai-input'), messages = $('#ai-messages'), status = $('#ai-status');
let history = [], controller, generating = false;
// VS Code Live Server cannot execute server functions. Vercel uses same-origin /api/chat.
const livePreview = ['localhost', '127.0.0.1'].includes(location.hostname) && location.port === '5500';
const chatEndpoint = livePreview ? 'http://127.0.0.1:4173/api/chat' : '/api/chat';
document.querySelectorAll('[data-open-ai]').forEach(button => button.addEventListener('click', () => {
  if (dialog.open) return;
  document.querySelector('dialog[open]')?.close(); dialog.showModal(); input.focus();
}));
function addMessage(text, type) {
  const node = document.createElement('p'); node.className = `chat-message ${type}`; node.textContent = text;
  messages.append(node); messages.scrollTop = messages.scrollHeight; return node;
}
async function ask(question) {
  if (generating || !question.trim()) return;
  stopDictation();
  const message = { role: 'user', content: question.trim().slice(0, 1200) };
  generating = true; controller = new AbortController();
  input.disabled = true; $('#ai-mic').disabled = true; $('#ai-send').hidden = true; $('#ai-stop').hidden = false; $('#ai-clear').disabled = true;
  addMessage(message.content, 'user'); input.value = '';
  const answer = addMessage('Thinking…', 'assistant thinking'); status.textContent = 'Asking Jhun’s AI assistant…';
  const timer = setTimeout(() => controller.abort('timeout'), 35000);
  try {
    const response = await fetch(chatEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [...history.slice(-6), message] }), signal: controller.signal });
    const data = await response.json().catch(() => ({ error: 'Chat is temporarily unavailable. Please try again shortly or email Jhun.' }));
    if (!response.ok) throw new Error(data.error || 'Chat is unavailable. Please try again.');
    if (typeof data.answer !== 'string' || !data.answer.trim()) throw new Error('No answer was returned. Please retry.');
    answer.textContent = data.answer;
    history.push(message, { role: 'assistant', content: data.answer.slice(0, 1200) }); history = history.slice(-6);
    status.textContent = '';
  } catch (error) {
    const connectionError = error instanceof TypeError
      ? (livePreview ? 'The local chat server is not running. Start npm run dev and open http://127.0.0.1:4173 to chat.' : 'Could not connect to chat. Check your connection and try again, or email Jhun at jhunlester88@gmail.com.')
      : error.message;
    answer.classList.add('error'); answer.textContent = controller.signal.aborted ? (controller.signal.reason === 'timeout' ? 'The reply took too long. Please retry.' : 'Response stopped.') : connectionError;
    if (!controller.signal.aborted) input.value = message.content;
    status.textContent = '';
  } finally {
    clearTimeout(timer); answer.classList.remove('thinking'); generating = false; input.disabled = false;
    $('#ai-send').hidden = false; $('#ai-stop').hidden = true; $('#ai-clear').disabled = false; $('#ai-mic').disabled = false;
    messages.scrollTop = messages.scrollHeight; if (dialog.open) input.focus();
  }
}
$('#ai-form').addEventListener('submit', event => { event.preventDefault(); ask(input.value); });
input.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); ask(input.value); } });
$('#ai-stop').addEventListener('click', () => controller?.abort());
dialog.addEventListener('close', () => { controller?.abort(); stopDictation(); });
$('#ai-clear').addEventListener('click', () => { if (generating) return; stopDictation(); history = []; messages.replaceChildren(); input.value = ''; status.textContent = ''; input.focus(); });
document.querySelectorAll('[data-ai-prompt]').forEach(button => button.addEventListener('click', () => ask(button.dataset.aiPrompt)));

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition, listening = false;
const microphone = $('#ai-mic');
function stopDictation() {
  const previous = recognition; recognition = undefined; listening = false;
  previous?.abort();
  microphone.setAttribute('aria-pressed', 'false');
  microphone.setAttribute('aria-label', 'Dictate your question');
  $('#voice-note').hidden = true;
}
microphone.addEventListener('click', () => {
  if (listening) { recognition?.stop(); return; }
  if (!SpeechRecognition) { status.textContent = 'Voice input is unavailable in this browser. Try Chrome, or type your question.'; return; }
  if (!window.isSecureContext) { status.textContent = 'Voice input needs HTTPS or localhost. Please open the live portfolio.'; return; }
  const session = new SpeechRecognition(); recognition = session;
  const draft = input.value.trim();
  session.lang = navigator.language || 'en-US'; session.interimResults = true; session.continuous = false;
  session.onstart = () => {
    if (recognition !== session) return;
    status.textContent = 'Listening… click the microphone to finish.';
  };
  session.onresult = event => {
    if (recognition !== session || !dialog.open) return;
    const transcript = Array.from(event.results, result => result[0].transcript).join(' ');
    input.value = [draft, transcript].filter(Boolean).join(' ').slice(0, 1200);
  };
  session.onerror = event => {
    if (recognition !== session) return;
    const errors = { 'not-allowed': 'Microphone access was denied. Allow it in your browser site settings, or type instead.', 'audio-capture': 'No microphone is available. Connect one or type instead.', 'no-speech': 'No speech detected. Click the microphone to try again.', network: 'Voice recognition could not connect. Please try again or type your question.' };
    status.textContent = errors[event.error] || 'Voice input stopped. You can still type your question.';
  };
  session.onend = () => {
    if (recognition !== session) return;
    recognition = undefined; listening = false;
    microphone.setAttribute('aria-pressed', 'false'); microphone.setAttribute('aria-label', 'Dictate your question');
    if (status.textContent.startsWith('Listening')) status.textContent = 'Review your question, then press Enter to send.';
    if (dialog.open) input.focus();
  };
  try {
    listening = true; microphone.setAttribute('aria-pressed', 'true'); microphone.setAttribute('aria-label', 'Stop dictation');
    $('#voice-note').hidden = false; status.textContent = 'Connecting to microphone…'; session.start();
  } catch { stopDictation(); status.textContent = 'Could not start voice input. Please type or try again.'; }
});
