import { DEFAULT_SETTINGS, type Settings } from '../converter/types';
import { MSG_COPY, type CopyRequest } from '../shared/messages';
import contentScript from '../content/content?script';

async function getSettings(): Promise<Settings> {
  const stored = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  return { ...DEFAULT_SETTINGS, ...stored } as Settings;
}

async function runCopy(tabId: number, target: 'selection' | 'page'): Promise<void> {
  const settings = await getSettings();
  await chrome.scripting.executeScript({ target: { tabId }, files: [contentScript] });
  const req: CopyRequest = { type: MSG_COPY, target, settings };
  try {
    await chrome.tabs.sendMessage(tabId, req);
  } catch {
    /* tab not messageable (e.g. chrome:// page) — ignore */
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'markgrab-copy',
    title: 'Copy as Markdown',
    contexts: ['selection', 'page'],
  });
});

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
