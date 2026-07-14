import type { Settings } from '../converter/types';

export const MSG_COPY = 'markgrab:copy';

export interface CopyRequest {
  type: typeof MSG_COPY;
  target: 'selection' | 'page';
  settings: Settings;
}

export interface CopyResponse {
  ok: boolean;
  tokens?: number;
  error?: string;
}
