export interface FaviconConfig {
  normal: string;
  hidden: string;
}

export interface JsConfig {
  chart: string;
  copy_tex: string;
  fancybox: string;
}

export interface CssConfig {
  katex: string;
  mermaid: string;
  fancybox: string;
}

export interface LoaderConfig {
  start: boolean;
  switch: boolean;
}

export interface SearchConfig {
  empty: string;
  appID: string;
  apiKey: string;
  indexName: string;
  hits: {
    per_page: number;
  };
}

export interface ValineConfig {
  appId: string;
  appKey: string;
  placeholder: string;
  avatar: string;
  pageSize: number;
  lang: string;
  visitor: boolean;
  NoRecordIP: boolean;
  serverURLs: string | null;
  powerMode: boolean;
  tagMeta: {
    visitor: string;
    master: string;
    friend: string;
    stranger: string;
  };
}

export interface AudioConfig {
  title: string;
  list: string[];
}

export interface QuicklinkConfig {
  timeout: number;
  priority: boolean;
  ignores: ((uri: string) => boolean)[];
}

export interface Config {
  version: string;
  hostname: string;
  [key: string]: any;
  root: string;
  statics: string;
  favicon: FaviconConfig;
  darkmode: boolean;
  auto_scroll: boolean;
  js: JsConfig;
  css: CssConfig;
  loader: LoaderConfig;
  search: SearchConfig;
  audio: AudioConfig[];
  quicklink: QuicklinkConfig;
  fireworks: string[];
}

export interface LocalConfig {
  [key: string]: any;
  path: string;
  favicon: {
    show: string;
    hide: string;
  };
  search: {
    placeholder: string;
    empty: string;
    stats: string;
  };
  valine: boolean;
  fancybox: boolean;
  copyright: string;
  ignores: ((uri: string) => boolean)[];
}
