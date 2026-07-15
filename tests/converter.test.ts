import { describe, it, expect } from 'vitest';
import { convert, estimateTokens } from '../src/converter/converter';
import type { ConvertOptions } from '../src/converter/types';

const base: ConvertOptions = { sourceHeader: false, keepLinks: true, images: false };

describe('convert', () => {
  it('converts a GFM table', () => {
    const html = '<table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>';
    const md = convert(html, base);
    expect(md).toContain('| A | B |');
    expect(md).toContain('| 1 | 2 |');
  });

  it('preserves fenced code with language', () => {
    const html = '<pre><code class="language-ts">const x = 1;</code></pre>';
    const md = convert(html, base);
    expect(md).toContain('```ts');
    expect(md).toContain('const x = 1;');
  });

  it('keeps links when keepLinks is true', () => {
    const md = convert('<a href="https://x.com">go</a>', base);
    expect(md).toContain('[go](https://x.com)');
  });

  it('drops link URL when keepLinks is false', () => {
    const md = convert('<a href="https://x.com">go</a>', { ...base, keepLinks: false });
    expect(md).toBe('go');
  });

  it('drops images when images is false', () => {
    const md = convert('<p>a<img src="x.png" alt="pic">b</p>', base);
    expect(md).not.toContain('x.png');
  });

  it('emits image markdown when images is true', () => {
    const md = convert('<img src="x.png" alt="pic">', { ...base, images: true });
    expect(md).toContain('![pic](x.png)');
  });

  it('strips script and style noise', () => {
    const md = convert('<p>keep</p><script>bad()</script><style>.x{}</style>', base);
    expect(md).toBe('keep');
  });

  it('prepends source header when enabled', () => {
    const md = convert('<p>body</p>', {
      ...base,
      sourceHeader: true,
      meta: { title: 'Doc', url: 'https://x.com', date: '2026-07-14' },
    });
    expect(md.startsWith('# Doc')).toBe(true);
    expect(md).toContain('> https://x.com');
    expect(md).toContain('2026-07-14');
    expect(md).toContain('body');
  });
});

describe('convert — structure/tidiness', () => {
  it('collapses 3+ blank lines to a single blank line', () => {
    const md = convert('<p>a</p><p></p><p></p><p>b</p>', base);
    expect(md).not.toMatch(/\n\n\n/);
    expect(md).toBe('a\n\nb');
  });

  it('trims trailing whitespace on each line', () => {
    const md = convert('<p>trailing   </p>', base);
    expect(md).not.toMatch(/ +\n/);
    expect(md).not.toMatch(/ +$/);
  });

  it('drops links whose text is empty', () => {
    const md = convert('<p>keep<a href="https://x.com"></a>end</p>', base);
    expect(md).not.toContain('[]');
    expect(md).toBe('keepend');
  });

  it('drops empty bullet list items', () => {
    const md = convert('<ul><li>one</li><li></li><li>two</li></ul>', base);
    expect(md).not.toMatch(/^[-*+][ \t]*$/m); // no empty bullet line
    expect(md).toMatch(/[-*+] +one/);
    expect(md).toMatch(/[-*+] +two/);
    expect(md.match(/^[-*+] /gm)?.length).toBe(2); // exactly two items survive
  });

  it('preserves blank lines and indentation inside code fences', () => {
    const html =
      '<pre><code class="language-py">def f():\n\n    return 1</code></pre>';
    const md = convert(html, base);
    expect(md).toContain('def f():\n\n    return 1');
  });

  it('has no leading or trailing blank lines', () => {
    const md = convert('<p>only</p>', base);
    expect(md).toBe('only');
  });
});

describe('estimateTokens', () => {
  it('estimates ~1 token per 4 chars', () => {
    expect(estimateTokens('12345678')).toBe(2);
    expect(estimateTokens('123')).toBe(1);
    expect(estimateTokens('')).toBe(0);
  });
});
