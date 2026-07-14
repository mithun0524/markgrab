# MarkGrab

Copy any web selection or page as clean, LLM-ready Markdown. 100% client-side —
no servers, no tracking, no network requests.

## Develop
- `npm install`
- `npm run build` → load `dist/` at chrome://extensions (Developer mode → Load unpacked)
- `npm test` → converter unit tests

## Triggers
- Right-click → Copy as Markdown
- Cmd/Ctrl+Shift+M → selection if any, else page
- Toolbar popup → Copy page / Copy selection + options

## Options (popup, saved to chrome.storage.sync)
- Source header (title + URL + date) — default on
- Keep links — default on
- Images as Markdown — default off
- Full-DOM vs main content (Readability) — default main content

## Privacy
MarkGrab reads page content only when you trigger a copy, converts it locally,
and writes to your clipboard. Nothing is transmitted or stored off-device.
Permissions are limited to contextMenus, activeTab, scripting, and storage —
no host/site permissions.
