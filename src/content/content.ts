import { Readability } from '@mozilla/readability';
import { convert, estimateTokens } from '../converter/converter';
import type { ConvertOptions, Settings, SourceMeta } from '../converter/types';
import { MSG_COPY, type CopyRequest, type CopyResponse } from '../shared/messages';

declare global {
  interface Window { __markgrabLoaded?: boolean }
}

function selectionHtml(): string | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;
  const div = document.createElement('div');
  for (let i = 0; i < sel.rangeCount; i++) {
    div.appendChild(sel.getRangeAt(i).cloneContents());
  }
  return div.innerHTML || null;
}

function readabilityHtml(): string | null {
  try {
    const clone = document.cloneNode(true) as Document;
    const article = new Readability(clone).parse();
    return article?.content ?? null;
  } catch {
    return null;
  }
}

function meta(): SourceMeta {
  return {
    title: document.title || location.hostname,
    url: location.href,
    date: new Date().toISOString().slice(0, 10),
  };
}

async function writeClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
}

function toast(message: string): void {
  const el = document.createElement('div');
  el.textContent = message;
  el.style.cssText =
    'position:fixed;bottom:20px;right:20px;z-index:2147483647;background:#111;color:#fff;' +
    'padding:10px 14px;border-radius:8px;font:13px system-ui;box-shadow:0 4px 12px rgba(0,0,0,.3)';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}

async function handleCopy(req: CopyRequest): Promise<CopyResponse> {
  const s: Settings = req.settings;
  let html: string | null = null;
  let fellBack = false;

  if (req.target === 'selection') {
    html = selectionHtml();
    if (!html) return { ok: false, error: 'No selection' };
  } else {
    // 'page' target still prefers a live selection when one exists.
    const sel = selectionHtml();
    if (sel) {
      html = sel;
    } else if (s.pageMode === 'main') {
      html = readabilityHtml();
      if (!html) { html = document.body.innerHTML; fellBack = true; }
    } else {
      html = document.body.innerHTML;
    }
  }

  const opts: ConvertOptions = {
    sourceHeader: s.sourceHeader,
    keepLinks: s.keepLinks,
    images: s.images,
    meta: meta(),
  };

  try {
    const md = convert(html, opts);
    await writeClipboard(md);
    const tokens = estimateTokens(md);
    toast(`Copied • ~${tokens} tokens${fellBack ? ' (full page)' : ''}`);
    return { ok: true, tokens };
  } catch (e) {
    toast('Copy failed');
    return { ok: false, error: String(e) };
  }
}

if (!window.__markgrabLoaded) {
  window.__markgrabLoaded = true;
  chrome.runtime.onMessage.addListener((msg: CopyRequest, _sender, sendResponse) => {
    if (msg?.type !== MSG_COPY) return false;
    handleCopy(msg).then(sendResponse);
    return true; // async response
  });
}
