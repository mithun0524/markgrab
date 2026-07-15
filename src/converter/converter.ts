import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import type { ConvertOptions } from './types';

const NOISE = ['script', 'style', 'svg', 'noscript', 'iframe'];

function buildService(opts: ConvertOptions): TurndownService {
  const td = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
  });
  td.use(gfm);

  // Remove noise nodes entirely.
  td.remove(NOISE as unknown as (keyof HTMLElementTagNameMap)[]);

  // Fenced code with language from class="language-xxx".
  td.addRule('fencedCodeLang', {
    filter: (node) =>
      node.nodeName === 'PRE' && !!node.firstChild && node.firstChild.nodeName === 'CODE',
    replacement: (_content, node) => {
      const code = (node as HTMLElement).firstChild as HTMLElement;
      const cls = code.getAttribute('class') || '';
      const lang = (cls.match(/language-(\S+)/) || [])[1] || '';
      const text = code.textContent || '';
      return `\n\n\`\`\`${lang}\n${text.replace(/\n$/, '')}\n\`\`\`\n\n`;
    },
  });

  if (!opts.keepLinks) {
    td.addRule('stripLinks', {
      filter: 'a',
      replacement: (content) => content,
    });
  }

  if (!opts.images) {
    td.addRule('stripImages', { filter: 'img', replacement: () => '' });
  }

  return td;
}

// Normalize a non-code Markdown segment for clean structure.
function tidySegment(seg: string): string {
  return seg
    // Drop links/images whose visible text is empty: [](url) or ![]( )
    .replace(/!?\[\s*\]\([^)]*\)/g, '')
    // Trim trailing whitespace on every line.
    .replace(/[ \t]+$/gm, '')
    // Drop list-item lines that carry no content (bullet or ordered).
    .replace(/^[ \t]*(?:[-*+]|\d+\.)[ \t]*$\n?/gm, '')
    // Collapse 3+ newlines to a single blank line.
    .replace(/\n{3,}/g, '\n\n');
}

// Tidy the whole document while leaving fenced code blocks untouched.
function tidy(md: string): string {
  const parts = md.split(/(```[\s\S]*?```)/g);
  const out = parts
    .map((p, i) => (i % 2 === 1 ? p : tidySegment(p)))
    .join('')
    // Collapse blank lines introduced at fence boundaries.
    .replace(/\n{3,}/g, '\n\n');
  return out.trim();
}

export function convert(html: string, opts: ConvertOptions): string {
  const td = buildService(opts);
  let md = tidy(td.turndown(html));
  if (opts.sourceHeader && opts.meta) {
    const { title, url, date } = opts.meta;
    md = `# ${title}\n\n> ${url}\n>\n> ${date}\n\n---\n\n${md}`;
  }
  return md;
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
