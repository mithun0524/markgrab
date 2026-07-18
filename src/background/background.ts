import { DEFAULT_SETTINGS, type Settings } from '../converter/types';
import { MSG_COPY, type CopyRequest, type CopyResponse } from '../shared/messages';
import contentScript from '../content/content?script';

async function getSettings(): Promise<Settings> {
  const stored = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  return { ...DEFAULT_SETTINGS, ...stored } as Settings;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** The injected content script registers its message listener behind an async
 * dynamic import, so executeScript resolves before the listener exists. Retry
 * sendMessage until the listener answers (or give up after ~1s). */
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

async function runCopy(tabId: number, target: 'selection' | 'page'): Promise<void> {
  const settings = await getSettings();
  await chrome.scripting.executeScript({ target: { tabId }, files: [contentScript] });
  // Menu/shortcut: the page has focus, so the content script writes the clipboard.
  const req: CopyRequest = { type: MSG_COPY, target, settings, writeInPage: true };
  try {
    await sendWhenReady(tabId, req);
  } catch {
    /* tab not messageable (e.g. chrome:// page) — ignore */
  }
}

function registerMenu(): void {
  // removeAll first so re-registration never fails on a duplicate id.
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'markgrab-copy',
      title: 'Copy as Markdown',
      contexts: ['selection', 'page'],
    });
  });
}

chrome.runtime.onInstalled.addListener(registerMenu);
// Also (re)register when the service worker starts, so a torn-down SW self-heals.
registerMenu();

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== 'markgrab-copy' || !tab?.id) return;
  runCopy(tab.id, info.selectionText ? 'selection' : 'page');
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'copy-markdown') return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  // 'page' = default; content script prefers a live selection when present.
  if (tab?.id) runCopy(tab.id, 'page');
});
