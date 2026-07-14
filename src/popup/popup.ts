import { DEFAULT_SETTINGS, type Settings } from '../converter/types';
import { MSG_COPY, type CopyRequest, type CopyResponse } from '../shared/messages';
import contentScript from '../content/content?script';

const ids = ['sourceHeader', 'keepLinks', 'images'] as const;

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
  const req: CopyRequest = { type: MSG_COPY, target, settings: readForm() };
  const badge = document.getElementById('badge')!;
  try {
    const res: CopyResponse = await chrome.tabs.sendMessage(tab.id, req);
    badge.textContent = res.ok ? `Copied • ~${res.tokens} tokens` : res.error || 'Failed';
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
