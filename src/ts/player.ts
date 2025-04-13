import $ from "./core/dom";
import { getRndInteger, addEvent, store } from "./core/utils";
import { PlayerConfig, PlayerOption, PlayerUtils, PlayerInfo, PlayerPlaylist } from "./dto/playerTypes";

// 播放器状态
const isMobile: boolean = /mobile/i.test(window.navigator.userAgent);

// 播放器类
export class MediaPlayer {
  t: any;
  config: PlayerConfig;
  option: PlayerOption;
  utils: PlayerUtils;
  source: HTMLAudioElement | null;
  player: HTMLElement | null;
  info: PlayerInfo;
  playlist: PlayerPlaylist;

  constructor(t: any, config: PlayerConfig) {
    this.t = t;
    this.config = config;
    this.option = {
      type: "audio",
      mode: "random",
      btns: ["play-pause", "music"],
      controls: ["mode", "backward", "play-pause", "forward", "volume"],
      events: {
        "play-pause": (event: Event) => {
          if (this.source && this.source.paused) {
            this.source.play();
          } else if (this.source) {
            this.source.pause();
          }
        },
        music: (event: Event) => {
          if (this.info.el.classList.contains("show")) {
            this.info.hide();
          } else {
            this.info.el.classList.add("show");
            this.playlist.scroll().title();
          }
        },
      },
    };

    // 使用箭头函数保持 this 上下文
    this.utils = {
      random: (len: number): number => {
        return getRndInteger(0, len - 1);
      },
      parse: (link: string) => {
        const result: Array<{
          type: string;
          id: string;
          category: string;
        }> = [];
        [
          ["music.163.com.*song.*id=(\\d+)", "netease", "song"],
          ["music.163.com.*album.*id=(\\d+)", "netease", "album"],
          ["music.163.com.*artist.*id=(\\d+)", "netease", "artist"],
          ["music.163.com.*playlist.*id=(\\d+)", "netease", "playlist"],
          ["music.163.com.*discover/toplist.*id=(\\d+)", "netease", "playlist"],
          ["y.qq.com.*song/(\\w+).html", "tencent", "song"],
          ["y.qq.com.*album/(\\w+).html", "tencent", "album"],
          ["y.qq.com.*singer/(\\w+).html", "tencent", "artist"],
          ["y.qq.com.*playsquare/(\\w+).html", "tencent", "playlist"],
          ["y.qq.com.*playlist/(\\w+).html", "tencent", "playlist"],
          ["xiami.com.*song/(\\w+)", "xiami", "song"],
          ["xiami.com.*album/(\\w+)", "xiami", "album"],
          ["xiami.com.*artist/(\\w+)", "xiami", "artist"],
          ["xiami.com.*collect/(\\w+)", "xiami", "playlist"],
        ].forEach((rule) => {
          const patt = new RegExp(rule[0]);
          const res = patt.exec(link);
          if (res !== null) {
            result.push({
              type: rule[1],
              id: res[1],
              category: rule[2],
            });
          }
        });
        return result;
      },
      fetch: (source: string[]): Promise<any[]> => {
        const list: any[] = [];

        return new Promise((resolve, reject) => {
          source.forEach((raw) => {
            const meta = this.utils.parse(raw);
            if (meta[0]) {
              const skey = JSON.stringify(meta);
              const playlist = store.get(skey);
              if (playlist) {
                list.push.apply(list, JSON.parse(playlist));
                resolve(list);
              } else {
                fetch(
                  `https://api.i-meto.com/meting/api?server=${meta[0].type}&type=${meta[0].category}&id=${
                    meta[0].id
                  }&r=${Math.random()}`
                )
                  .then((response) => {
                    return response.json();
                  })
                  .then((json) => {
                    store.set(skey, JSON.stringify(json));
                    list.push.apply(list, json);
                    resolve(list);
                  })
                  .catch((ex) => {
                    console.error("Fetch error:", ex);
                    reject(ex);
                  });
              }
            } else {
              list.push(raw);
              resolve(list);
            }
          });
        });
      },
      secondToTime: (second: number): string => {
        const add0 = (num: number): string => {
          return isNaN(num) ? "00" : num < 10 ? "0" + num : "" + num;
        };
        const hour = Math.floor(second / 3600);
        const min = Math.floor((second - hour * 3600) / 60);
        const sec = Math.floor(second - hour * 3600 - min * 60);
        return (hour > 0 ? [hour, min, sec] : [min, sec]).map(add0).join(":");
      },
      nameMap: {
        dragStart: isMobile ? "touchstart" : "mousedown",
        dragMove: isMobile ? "touchmove" : "mousemove",
        dragEnd: isMobile ? "touchend" : "mouseup",
      },
    };

    this.source = null;
    this.player = null;
    this.info = {
      el: document.createElement("div"),
      hide: () => {},
    };
    this.playlist = {
      el: document.createElement("div"),
      scroll: () => this,
      title: () => this,
    };

    this.init();
  }

  init(): void {
    // 初始化播放器
    this.player = $("#player");
    this.source = this.player?.querySelector("audio") || null;
    this.info = {
      el: $(".player-info") || document.createElement("div"),
      hide: () => {
        this.info.el.classList.remove("show");
      },
    };
    this.playlist = {
      el: $(".player-playlist") || document.createElement("div"),
      scroll: () => {
        // 滚动到当前播放的歌曲
        return this;
      },
      title: () => {
        // 更新播放列表标题
        return this;
      },
    };

    // 绑定事件
    this.bindEvents();
  }

  bindEvents(): void {
    // 播放/暂停按钮事件
    const playPauseBtn = $(".player-btn.play-pause");
    if (playPauseBtn) {
      addEvent(playPauseBtn, "click", this.option.events["play-pause"]);
    }

    // 音乐列表按钮事件
    const musicBtn = $(".player-btn.music");
    if (musicBtn) {
      addEvent(musicBtn, "click", this.option.events["music"]);
    }
  }

  // 其他播放器方法...
}
