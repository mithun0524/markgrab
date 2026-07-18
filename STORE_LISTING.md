# Chrome Web Store — Listing Draft

Paste each field into the Web Store developer dashboard. Nothing here is
marketing fluff — it matches what the extension actually does, which keeps
review smooth.

---

## Name
MarkGrab — Copy as Markdown for LLMs

## Summary (max 132 chars)
Copy any page or selection as clean, LLM-ready Markdown. Keeps tables, code, and full chat transcripts. 100% local.

## Category
Productivity

## Language
English

---

## Detailed description

Turn any web page or selection into clean, LLM-ready Markdown on your clipboard —
then paste it straight into ChatGPT, Claude, Gemini, or your notes.

Web content pasted into an AI chat usually loses its structure: tables collapse,
code loses its fences, and menus and ads come along for the ride. MarkGrab fixes
that. It converts the page (or just your selection) into tidy Markdown, locally,
with no servers and no tracking.

WHAT IT DOES
• Copy the whole page or just a text selection as Markdown.
• Main-content mode strips nav, ads, sidebars, and footers automatically.
• Keeps GFM tables, fenced code blocks (with language), lists, and links.
• Chat-aware: on ChatGPT, Claude, and Gemini it captures every conversation
  turn in order, labeled You / Assistant — including short prompts that
  article extractors normally drop.
• Shows an approximate token count so you can stay under context limits.

THREE WAYS TO COPY
• Right-click → "Copy as Markdown"
• Keyboard shortcut (Cmd/Ctrl+Shift+M) — selection if you have one, else the page
• Toolbar popup — Copy page / Copy selection, plus options

OPTIONS (saved locally)
• Source header (title + URL + date)
• Keep links
• Images as Markdown
• Full-DOM vs main content

PRIVACY
MarkGrab reads page content only when you trigger a copy, converts it on your
device, and writes the result to your clipboard. Nothing is ever sent over the
network, stored remotely, or shared. No accounts, no analytics.

Open source. Works on Chrome, Brave, Edge, and Arc.

---

## Single purpose (required field)
MarkGrab converts the current web page or the user's selection into Markdown and
copies it to the clipboard. That is its only function.

## Permission justifications (required field)

- activeTab — Read the content of the current tab, but only at the moment the
  user triggers a copy (menu click, shortcut, or popup button).
- scripting — Inject the HTML-to-Markdown converter into the current tab on
  demand to read and convert its content.
- contextMenus — Add the right-click "Copy as Markdown" menu item.
- storage — Save the user's option toggles (source header, keep links, images,
  capture mode) across sessions.
- clipboardWrite — Write the resulting Markdown to the clipboard.

No host permissions are requested; MarkGrab can only access a tab after the user
explicitly invokes it.

## Data usage disclosures (Data safety form)
- Does this extension collect user data? No.
- Sold to third parties? No.
- Used for anything other than the single purpose? No.
- All processing happens locally; no data leaves the device.

---

## Assets checklist (you provide)
- Icon: 128×128 — already in `icons/icon128.png`.
- Store icon (larger): `icons/icon512.png` (resize to 128 if the console wants it).
- Screenshots: 1280×800 or 640×400, at least one. Suggested shots:
  1. The popup open over an article, "Copied • ~N tokens" badge visible.
  2. A pasted Markdown result showing a preserved table + code block.
  3. A ChatGPT page with the popup, and the resulting You/Assistant transcript.
- Small promo tile (optional): 440×280.

## Pre-submit checklist
- [ ] Replace placeholder screenshots with real ones.
- [ ] Bump version in `manifest.json` if re-submitting.
- [ ] Zip the contents of `dist/` (not the folder itself) for upload.
- [ ] Privacy policy URL — optional here since no data is collected; a short
      statement or the README link suffices.
