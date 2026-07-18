import { DEFAULT_SETTINGS, type Settings } from '../converter/types';
import { MSG_COPY, type CopyRequest, type CopyResponse } from '../shared/messages';
import contentScript from '../content/content?script';

const ids = ['sourceHeader', 'keepLinks', 'images'] as const;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** The injected content script registers its listener behind an async dynamic
 * import; retry until it answers so we never message before it's ready. */
async function sendWhenReady(tabId: number, req: CopyRequest, tries = 40): Promise<CopyResponse> {
  let lastErr: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      return (await chrome.tabs.sendMessage(tabId, req)) as CopyResponse;
    } catch (e) {
      lastErr = e;
      await sleep(25);
    }
  }
  throw lastErr;
}

async function load(): Promise<Settings> {
  const s = { ...DEFAULT_SETTINGS, ...(await chrome.storage.sync.get(DEFAULT_SETTINGS)) } as Settings;
  ids.forEach((k) => ((document.getElementById(k) as HTMLInputElement).checked = s[k]));
  (document.getElementById('pageMode') as HTMLInputElement).checked = s.pageMode === 'full';
  return s;
}

function readForm(): Settings {
  return {
    sourceHeader: (document.getElementById('sourceHeader') as HTMLInputElement).checked,
    keepLinks: (document.getElementById('keepLinks') as HTMLInputElement).checked,
    images: (document.getElementById('images') as HTMLInputElement).checked,
    pageMode: (document.getElementById('pageMode') as HTMLInputElement).checked ? 'full' : 'main',
  };
}

async function persist(): Promise<void> {
  await chrome.storage.sync.set(readForm());
}

async function copy(target: 'selection' | 'page'): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: [contentScript] });
  // writeInPage:false — the page isn't focused (this popup is), so the content
  // script just returns the Markdown and we write the clipboard here.
  const req: CopyRequest = { type: MSG_COPY, target, settings: readForm(), writeInPage: false };
  const badge = document.getElementById('badge')!;
  try {
    const res = await sendWhenReady(tab.id, req);
    if (!res.ok || res.markdown == null) {
      badge.textContent = res.error || 'Failed';
      return;
    }
    await navigator.clipboard.writeText(res.markdown);
    badge.textContent = `Copied • ~${res.tokens} tokens`;
  } catch {
    badge.textContent = 'Cannot copy from this page';
  }
}

[...ids, 'pageMode'].forEach((k) =>
  document.getElementById(k)!.addEventListener('change', persist),
);
document.getElementById('copyPage')!.addEventListener('click', () => copy('page'));
document.getElementById('copySel')!.addEventListener('click', () => copy('selection'));

load();
