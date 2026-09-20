// One-time publication helper. Reads a short-lived credential from stdin only.
// No credential is written to Git config, disk, a remote URL, or console output.
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
const [remote, branch] = process.argv.slice(2);
const url = new URL(remote);
if (url.protocol !== 'https:' || url.hostname !== 'git.chatgpt-team.site' || !/^[a-zA-Z0-9/_-]+$/.test(branch)) throw new Error('Unexpected Site repository');
console.log('Ready for ephemeral Site credential.');
const input = createInterface({input:process.stdin,terminal:false});
input.once('line', token => {
  input.close();
  if (!token || /[\r\n]/.test(token)) process.exit(1);
  const child = spawn('git', ['push', remote, `HEAD:refs/heads/${branch}`], {
    env: {...process.env, GIT_TERMINAL_PROMPT:'0', GIT_CONFIG_COUNT:'1', GIT_CONFIG_KEY_0:`http.${url.origin}/.extraHeader`, GIT_CONFIG_VALUE_0:`Authorization: Bearer ${token}`},
    stdio:['ignore','pipe','pipe'],windowsHide:true
  });
  const redact = chunk => process.stdout.write(chunk.toString().split(token).join('[redacted]'));
  child.stdout.on('data',redact); child.stderr.on('data',redact);
  child.on('error', () => { console.error('Could not start Git.'); process.exitCode = 1; });
  child.on('close', code => process.exit(code || 0));
});
