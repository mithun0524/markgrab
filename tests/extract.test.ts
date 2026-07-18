import { describe, it, expect } from 'vitest';
import { extractChatTurns } from '../src/converter/extract';
import { convert } from '../src/converter/converter';

const base = { sourceHeader: false, keepLinks: true, images: false };
const parse = (html: string) => new DOMParser().parseFromString(html, 'text/html');

describe('extractChatTurns', () => {
  it('keeps every ChatGPT turn including short user messages', () => {
    const doc = parse(`
      <main>
        <article data-message-author-role="user">
          <span class="sr-only">You said:</span>
          <div class="whitespace-pre-wrap">Group jobs by education.</div>
        </article>
        <article data-message-author-role="assistant">
          <span class="sr-only">ChatGPT said:</span>
          <div class="markdown"><p>Here is a grouping.</p></div>
        </article>
        <article data-message-author-role="user">
          <span class="sr-only">You said:</span>
          <div class="whitespace-pre-wrap">what can you help me with</div>
        </article>
        <article data-message-author-role="assistant">
          <span class="sr-only">ChatGPT said:</span>
          <div class="markdown"><p>Lots of things.</p></div>
        </article>
      </main>`);
    const html = extractChatTurns(doc);
    expect(html).not.toBeNull();
    const md = convert(html!, base);
    expect(md).toContain('Group jobs by education.');
    expect(md).toContain('what can you help me with'); // the short turn that vanished before
    expect(md).toContain('Here is a grouping.');
    expect(md).toContain('Lots of things.');
    expect((md.match(/### You/g) || []).length).toBe(2);
    expect((md.match(/### Assistant/g) || []).length).toBe(2);
  });

  it('preserves turn order', () => {
    const doc = parse(`
      <div data-message-author-role="user"><div class="whitespace-pre-wrap">first</div></div>
      <div data-message-author-role="assistant"><div class="markdown">second</div></div>`);
    const md = convert(extractChatTurns(doc)!, base);
    expect(md.indexOf('first')).toBeLessThan(md.indexOf('second'));
  });

  it('strips the sr-only "You said:" label (we add our own)', () => {
    const doc = parse(
      '<div data-message-author-role="user"><span class="sr-only">You said:</span><div>hello</div></div>',
    );
    const md = convert(extractChatTurns(doc)!, base);
    expect(md).not.toContain('You said:');
    expect(md).toContain('### You');
    expect(md).toContain('hello');
  });

  it('returns null for a non-chat page', () => {
    const doc = parse('<article><h1>Blog</h1><p>Not a chat.</p></article>');
    expect(extractChatTurns(doc)).toBeNull();
  });
});
