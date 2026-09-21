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
  const message = { role: 'user', content: question.trim().slice(0, 1200) };
  generating = true; controller = new AbortController();
  input.disabled = true; $('#ai-send').hidden = true; $('#ai-stop').hidden = false; $('#ai-clear').disabled = true;
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
    $('#ai-send').hidden = false; $('#ai-stop').hidden = true; $('#ai-clear').disabled = false;
    messages.scrollTop = messages.scrollHeight; if (dialog.open) input.focus();
  }
}
$('#ai-form').addEventListener('submit', event => { event.preventDefault(); ask(input.value); });
input.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); ask(input.value); } });
$('#ai-stop').addEventListener('click', () => controller?.abort());
dialog.addEventListener('close', () => controller?.abort());
$('#ai-clear').addEventListener('click', () => { if (generating) return; history = []; messages.replaceChildren(); status.textContent = 'Chat cleared.'; });
document.querySelectorAll('[data-ai-prompt]').forEach(button => button.addEventListener('click', () => ask(button.dataset.aiPrompt)));
