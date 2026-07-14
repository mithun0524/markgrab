export interface Settings {
  sourceHeader: boolean;
  keepLinks: boolean;
  images: boolean;
  pageMode: 'main' | 'full';
}

export const DEFAULT_SETTINGS: Settings = {
  sourceHeader: true,
  keepLinks: true,
  images: false,
  pageMode: 'main',
};

export interface SourceMeta {
  title: string;
  url: string;
  date: string;
}

export interface ConvertOptions {
  sourceHeader: boolean;
  keepLinks: boolean;
  images: boolean;
  meta?: SourceMeta;
}
