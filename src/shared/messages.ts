import type { Settings } from '../converter/types';

export const MSG_COPY = 'markgrab:copy';

export interface CopyRequest {
  type: typeof MSG_COPY;
  target: 'selection' | 'page';
  settings: Settings;
  /** When true the content script writes the clipboard itself (page has focus,
   * e.g. context menu / shortcut). When false it only returns the Markdown so a
   * focused caller (the popup) can write the clipboard. */
  writeInPage: boolean;
}

export interface CopyResponse {
  ok: boolean;
  tokens?: number;
  error?: string;
  markdown?: string;
}
