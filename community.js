const dialog = document.querySelector('#community-dialog');
const nameForm = document.querySelector('#community-name-form');
const composer = document.querySelector('#community-composer');
document.querySelector('#open-community').addEventListener('click', () => {
  document.querySelector('dialog[open]')?.close();
  dialog.showModal();
  document.querySelector('#community-name').focus();
});
nameForm.addEventListener('submit', event => {
  event.preventDefault();
  const name = document.querySelector('#community-name').value.trim();
  if (name.length < 2) return;
  nameForm.hidden = true; composer.hidden = false;
  document.querySelector('#community-status').textContent = `Hi, ${name}. Community chat is not connected yet.`;
});
document.querySelector('#community-change-name').addEventListener('click', () => {
  nameForm.hidden = false; composer.hidden = true;
  document.querySelector('#community-status').textContent = '';
  document.querySelector('#community-name').focus();
});
dialog.addEventListener('close', () => {
  nameForm.reset(); nameForm.hidden = false; composer.hidden = true;
  document.querySelector('#community-status').textContent = '';
});
