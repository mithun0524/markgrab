// Chat-aware extraction. Readability keeps only its single best-scored node, so
// on a multi-turn chat page (ChatGPT/Claude/Gemini) it drops most turns —
// especially short user messages. When a page exposes conversation turns, pull
// every turn in order, labeled, instead of running it through Readability.

interface TurnSpec {
  /** Selector matching each conversation turn. */
  turn: string;
  /** Given a turn element, return 'You' | 'Assistant'. */
  role: (el: Element) => 'You' | 'Assistant';
  /** Optional selector for the content holder inside a turn. */
  body?: string;
}

const SITES: TurnSpec[] = [
  // ChatGPT — every turn carries data-message-author-role="user|assistant".
  {
    turn: '[data-message-author-role]',
    role: (el) => (el.getAttribute('data-message-author-role') === 'user' ? 'You' : 'Assistant'),
    body: '.markdown',
  },
  // Claude.ai
  {
    turn: '[data-testid="user-message"], .font-claude-message',
    role: (el) => (el.getAttribute('data-testid') === 'user-message' ? 'You' : 'Assistant'),
  },
  // Gemini
  {
    turn: 'user-query, model-response',
    role: (el) => (el.tagName.toLowerCase() === 'user-query' ? 'You' : 'Assistant'),
  },
];

const STRIP = '.sr-only, button, svg, [aria-hidden="true"]';

function turnBody(turn: Element, bodySel?: string): string {
  const clone = turn.cloneNode(true) as HTMLElement;
  clone.querySelectorAll(STRIP).forEach((e) => e.remove());
  const holder = (bodySel && (clone.querySelector(bodySel) as HTMLElement | null)) || clone;
  return holder.innerHTML.trim();
}

/** Returns labeled HTML for all conversation turns, or null if the page isn't a
 * recognized chat (caller then falls back to Readability / full-DOM). */
export function extractChatTurns(doc: Document): string | null {
  for (const site of SITES) {
    const turns = Array.from(doc.querySelectorAll(site.turn));
    if (turns.length === 0) continue;
    const parts: string[] = [];
    for (const turn of turns) {
      const body = turnBody(turn, site.body);
      if (!body) continue;
      parts.push(`<h3>${site.role(turn)}</h3>\n${body}`);
    }
    if (parts.length) return parts.join('\n');
  }
  return null;
}
