export interface PlayerConfig {
  audio: Array<{
    title: string;
    list: string[];
  }>;
}

export interface PlayerOption {
  type: string;
  mode: string;
  btns: string[];
  controls: string[];
  events: {
    [key: string]: (event: Event) => void;
  };
}

export interface PlayerUtils {
  random: (len: number) => number;
  parse: (link: string) => Array<{
    type: string;
    id: string;
    category: string;
  }>;
  fetch: (source: string[]) => Promise<any[]>;
  secondToTime: (second: number) => string;
  nameMap: {
    dragStart: string;
    dragMove: string;
    dragEnd: string;
  };
}

export interface PlayerInfo {
  el: HTMLElement;
  hide: () => void;
}

export interface PlayerPlaylist {
  el: HTMLElement;
  scroll: () => any;
  title: () => any;
}
