// Render 1280x800 Chrome Web Store screenshots for MarkGrab.
// Uses Chrome for Testing; renders each slide @2x then the caller downscales.
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const CHROME =
  '/Users/mithunchavan/markgrab/chrome/mac_arm-151.0.7922.34/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'store-screenshots');
fs.mkdirSync(OUT, { recursive: true });

const ICON = `<svg width="30" height="30" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><rect x="16" y="16" width="480" height="480" rx="104" fill="#2563eb"/><g fill="none" stroke="#fff" stroke-width="46" stroke-linecap="round" stroke-linejoin="round"><path d="M104 356 V180 L196 288 L288 180 V356"/><path d="M384 168 V320"/></g><path d="M340 300 L384 360 L428 300 Z" fill="#fff"/></svg>`;

const POPUP = `
<div class="popup">
  <button class="p-btn">Copy page</button>
  <button class="p-btn">Copy selection</button>
  <div class="p-badge">Copied • ~412 tokens</div>
  <div class="p-hr"></div>
  <label class="p-row"><span class="cbx on"></span> Source header</label>
  <label class="p-row"><span class="cbx on"></span> Keep links</label>
  <label class="p-row"><span class="cbx"></span> Images as Markdown</label>
  <label class="p-row"><span class="cbx"></span> Full-DOM (off = main content)</label>
</div>`;

const CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { width: 1280px; height: 800px; font-family: -apple-system, 'Segoe UI', Roboto, sans-serif;
    background: linear-gradient(135deg, #eef2ff 0%, #e0f2fe 100%); overflow: hidden; }
  .wrap { display: grid; grid-template-columns: 1fr 1fr; align-items: center;
    height: 100%; padding: 72px; gap: 56px; }
  .lead .brand { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; }
  .lead .brand b { font-size: 22px; color: #1e293b; letter-spacing: -0.3px; }
  .lead h1 { font-size: 46px; line-height: 1.08; color: #0f172a; letter-spacing: -1px; font-weight: 800; }
  .lead h1 .accent { color: #2563eb; }
  .lead p { margin-top: 20px; font-size: 19px; line-height: 1.5; color: #475569; max-width: 460px; }
  .chips { margin-top: 28px; display: flex; gap: 10px; flex-wrap: wrap; }
  .chip { background: #fff; border: 1px solid #dbe3ef; border-radius: 999px; padding: 8px 16px;
    font-size: 14px; color: #334155; font-weight: 600; box-shadow: 0 1px 2px rgba(15,23,42,.04); }
  .stage { display: flex; justify-content: center; }

  /* browser mock */
  .browser { width: 100%; max-width: 520px; background: #fff; border-radius: 16px;
    box-shadow: 0 30px 60px -18px rgba(37,99,235,.35), 0 8px 20px rgba(15,23,42,.12);
    overflow: hidden; position: relative; }
  .bbar { height: 40px; background: #f1f5f9; display: flex; align-items: center; gap: 7px; padding: 0 14px; }
  .dot { width: 11px; height: 11px; border-radius: 50%; }
  .url { margin-left: 12px; height: 22px; flex: 1; background: #fff; border-radius: 6px;
    border: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; display: flex; align-items: center; padding: 0 10px; }
  .doc { padding: 26px 28px; min-height: 300px; }
  .doc h2 { font-size: 22px; color: #0f172a; margin-bottom: 14px; }
  .doc p { font-size: 13.5px; line-height: 1.6; color: #475569; margin-bottom: 10px; }
  .doc .muted { color: #94a3b8; }

  /* popup */
  .popup { position: absolute; top: 46px; right: 16px; width: 250px; background: #fff;
    border-radius: 12px; box-shadow: 0 20px 45px rgba(15,23,42,.28); padding: 14px;
    display: flex; flex-direction: column; gap: 9px; border: 1px solid #eef2f7; }
  .p-btn { padding: 10px; border: 0; border-radius: 8px; background: #2563eb; color: #fff;
    font-size: 13.5px; font-weight: 600; text-align: center; }
  .p-badge { font-size: 12.5px; color: #2563eb; font-weight: 600; text-align: center; }
  .p-hr { height: 1px; background: #eef2f7; margin: 2px 0; }
  .p-row { display: flex; align-items: center; gap: 9px; font-size: 12.5px; color: #334155; }
  .cbx { width: 15px; height: 15px; border-radius: 4px; border: 1.5px solid #cbd5e1; display: inline-block; }
  .cbx.on { background: #2563eb; border-color: #2563eb; position: relative; }
  .cbx.on::after { content: ''; position: absolute; left: 4.5px; top: 1.5px; width: 4px; height: 8px;
    border: solid #fff; border-width: 0 2px 2px 0; transform: rotate(45deg); }

  /* code/markdown panel */
  .panel { width: 100%; max-width: 540px; border-radius: 14px; overflow: hidden;
    box-shadow: 0 26px 55px -18px rgba(37,99,235,.35), 0 8px 20px rgba(15,23,42,.12); }
  .panel .head { background: #1e293b; color: #e2e8f0; font-size: 13px; padding: 12px 18px;
    display: flex; align-items: center; gap: 8px; }
  .panel pre { background: #0f172a; color: #e2e8f0; margin: 0; padding: 20px;
    font: 13.5px/1.65 'SF Mono', Menlo, monospace; white-space: pre; }
  .tok { color: #38bdf8; } .th { color: #f472b6; } .cm { color: #94a3b8; }
`;

const slides = {
  '1-hero': `<div class="wrap">
    <div class="lead">
      <div class="brand">${ICON}<b>MarkGrab</b></div>
      <h1>Copy any page as <span class="accent">clean Markdown</span> for LLMs</h1>
      <p>One click turns a page or selection into tidy, paste-ready Markdown — no servers, no tracking.</p>
      <div class="chips"><span class="chip">Right-click</span><span class="chip">⌘⇧M</span><span class="chip">Toolbar popup</span></div>
    </div>
    <div class="stage"><div class="browser">
      <div class="bbar"><span class="dot" style="background:#f87171"></span><span class="dot" style="background:#fbbf24"></span><span class="dot" style="background:#34d399"></span><span class="url">example.com/guide</span></div>
      <div class="doc"><h2>Setting up CI/CD</h2><p>A CI/CD service builds, tests, and deploys your code whenever you push changes.</p><p>The pipeline is defined in a file named <span class="muted">.github/workflows/ci.yml</span> and runs on every commit.</p><p class="muted">Push code → build → test → deploy.</p></div>
      ${POPUP}
    </div></div>
  </div>`,

  '2-structure': `<div class="wrap">
    <div class="lead">
      <div class="brand">${ICON}<b>MarkGrab</b></div>
      <h1>Tables and code <span class="accent">survive the trip</span></h1>
      <p>GFM tables, fenced code with language, lists, and links come through intact — and nav, ads, and footers are stripped.</p>
      <div class="chips"><span class="chip">GFM tables</span><span class="chip">Code fences</span><span class="chip">~token count</span></div>
    </div>
    <div class="stage"><div class="panel">
      <div class="head">${ICON}&nbsp; clipboard — Markdown</div>
      <pre><span class="cm"># Setting up CI/CD</span>

<span class="th">| Stage  | Runs on |</span>
| ------ | ------- |
| build  | push    |
| deploy | main    |

\`\`\`<span class="tok">yaml</span>
on:
  push:
    branches: [main]
\`\`\`</pre>
    </div></div>
  </div>`,

  '3-chat': `<div class="wrap">
    <div class="lead">
      <div class="brand">${ICON}<b>MarkGrab</b></div>
      <h1>Full chat transcripts — <span class="accent">every turn</span></h1>
      <p>On ChatGPT, Claude, and Gemini it captures the whole conversation in order, labeled You / Assistant — including short prompts other tools drop.</p>
      <div class="chips"><span class="chip">ChatGPT</span><span class="chip">Claude</span><span class="chip">Gemini</span></div>
    </div>
    <div class="stage"><div class="panel">
      <div class="head">${ICON}&nbsp; clipboard — Markdown</div>
      <pre><span class="cm"># ChatGPT</span>
<span class="cm">&gt; https://chatgpt.com/</span>

<span class="th">### You</span>
Group jobs by education level.

<span class="th">### Assistant</span>
Here's a practical grouping:

<span class="th">### You</span>
what can you help me with

<span class="th">### Assistant</span>
Lots of things — learning, coding…</pre>
    </div></div>
  </div>`,
};

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });
for (const [name, body] of Object.entries(slides)) {
  await page.setContent(`<!doctype html><meta charset="utf-8"><style>${CSS}</style>${body}`, {
    waitUntil: 'load',
  });
  await new Promise((r) => setTimeout(r, 250));
  await page.screenshot({ path: path.join(OUT, name + '@2x.png') });
  console.log('rendered', name);
}
await browser.close();
