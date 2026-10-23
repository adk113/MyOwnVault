/**
 * Clipboard sanitation.
 * Every copy schedules an overwrite of the system clipboard with empty data exactly
 * 30 s later. The timer lives at module level so it survives locking / unmounting.
 */
export const CLIPBOARD_CLEAR_MS = 30_000;

let timer = null;
let deadline = null;
let pendingRetry = false;
const listeners = new Set();

const emit = () => listeners.forEach((l) => l());

async function write(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text || ' ';
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none;';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

async function wipeClipboard() {
  timer = null;
  deadline = null;
  const ok = await write('');
  // Browsers refuse clipboard writes from unfocused tabs – retry the moment we regain focus.
  pendingRetry = !ok;
  emit();
}

window.addEventListener('focus', () => {
  if (pendingRetry) wipeClipboard();
});

export async function copySecret(text) {
  const ok = await write(String(text ?? ''));
  if (!ok) return false;
  clearTimeout(timer);
  pendingRetry = false;
  deadline = Date.now() + CLIPBOARD_CLEAR_MS;
  timer = setTimeout(wipeClipboard, CLIPBOARD_CLEAR_MS);
  emit();
  return true;
}

export const getClipboardDeadline = () => deadline;
export const subscribeClipboard = (cb) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
