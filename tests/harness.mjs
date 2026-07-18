// Real-browser diagnosis: loads the built extension in Chrome for Testing,
// (1) opens the popup page and captures console errors + checkbox state,
// (2) injects into a real http page and tests immediate vs retry sendMessage.
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import http from 'node:http';

const CHROME =
  '/Users/mithunchavan/markgrab/chrome/mac_arm-151.0.7922.34/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const log = (...a) => console.log(...a);

const HTML =
  '<!doctype html><html><head><title>CI Doc</title></head><body>' +
  '<article><h1>CI Doc</h1><p>Push code to <strong>trigger</strong> the pipeline.</p>' +
  '<pre><code class="language-yaml">on: push</code></pre></article></body></html>';
const server = http.createServer((_q, res) => res.end(HTML));
await new Promise((r) => server.listen(0, r));
const PORT = server.address().port;
const URL = 'http://localhost:' + PORT + '/';

const REQ = {
  type: 'markgrab:copy',
  target: 'page',
  settings: { sourceHeader: true, keepLinks: true, images: false, pageMode: 'main' },
  writeInPage: false,
};

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  protocolTimeout: 20000,
  args: [
    '--disable-extensions-except=' + DIST,
    '--load-extension=' + DIST,
    '--disable-features=DisableLoadExtensionCommandLineSwitch',
    '--no-first-run',
    '--no-default-browser-check',
  ],
});

try {
  let sw = browser.targets().find((t) => t.type() === 'service_worker');
  if (!sw) sw = await browser.waitForTarget((t) => t.type() === 'service_worker', { timeout: 8000 });
  const worker = await sw.worker();
  const extId = sw.url().split('/')[2];
  log('extId:', extId);

  // ---- (1) POPUP inspection ----
  const popup = await browser.newPage();
  const popupErrors = [];
  popup.on('console', (m) => { if (m.type() === 'error') popupErrors.push('console.error: ' + m.text()); });
  popup.on('pageerror', (e) => popupErrors.push('pageerror: ' + e.message));
  await popup.goto('chrome-extension://' + extId + '/src/popup/popup.html');
  await new Promise((r) => setTimeout(r, 600));
  const checks = await popup.evaluate(() => {
    const g = (id) => document.getElementById(id);
    return {
      sourceHeader: g('sourceHeader') ? g('sourceHeader').checked : 'missing',
      keepLinks: g('keepLinks') ? g('keepLinks').checked : 'missing',
      copyPageBtn: !!g('copyPage'),
    };
  });
  log('POPUP checkbox state:', JSON.stringify(checks));
  log('POPUP errors:', JSON.stringify(popupErrors));

  // ---- (2) INJECTION race test on a real http page ----
  const page = await browser.newPage();
  await page.goto(URL);
  await page.bringToFront();
  const tabId = await worker.evaluate(
    () => new Promise((res) => chrome.tabs.query({ active: true, lastFocusedWindow: true }, (t) => res(t[0] ? t[0].id : null))),
  );
  log('tabId:', tabId);

  const immediate = await worker.evaluate(
    (tabId, REQ) => new Promise((resolve) => {
      import(chrome.runtime.getURL('assets/content-DVt-NWIa.js')).then((mod) =>
        chrome.scripting.executeScript({ target: { tabId }, files: [mod.c] }).then(() =>
          chrome.tabs.sendMessage(tabId, REQ).then(
            (res) => resolve({ ok: true, hasMd: !!(res && res.markdown) }),
            (e) => resolve({ ok: false, error: String(e) }),
          ),
        ),
      );
    }),
    tabId, REQ,
  );
  log('IMMEDIATE result:', JSON.stringify(immediate));

  const retry = await worker.evaluate(
    (tabId, REQ) => new Promise((resolve) => {
      import(chrome.runtime.getURL('assets/content-DVt-NWIa.js')).then((mod) =>
        chrome.scripting.executeScript({ target: { tabId }, files: [mod.c] }).then(() => {
          let i = 0;
          const attempt = () =>
            chrome.tabs.sendMessage(tabId, REQ).then(
              (res) => resolve({ ok: true, tries: i + 1, hasMd: !!(res && res.markdown) }),
              () => (++i >= 40 ? resolve({ ok: false, error: 'never ready' }) : setTimeout(attempt, 25)),
            );
          attempt();
        }),
      );
    }),
    tabId, REQ,
  );
  log('RETRY result:', JSON.stringify(retry));
} catch (e) {
  log('HARNESS ERROR:', String(e));
} finally {
  await browser.close();
  server.close();
}
