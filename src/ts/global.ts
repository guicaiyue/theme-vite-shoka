import $ from "./core/dom";
import { getDocHeight, pageScroll, transition, store } from "./core/utils";
import { ScrollAction, LoaderObject } from "./dto/globalTypes";
import { Config, LocalConfig } from "./dto/configTypes";
import lozad from "lozad";

declare const LOCAL: LocalConfig;

// 全局变量声明
let statics: string;
var scrollAction: ScrollAction = { x: "undefined", y: "undefined" };
var diffY = 0;
var originTitle: string, titleTime: ReturnType<typeof setTimeout>;

// DOM 元素引用
const BODY = document.getElementsByTagName("body")[0] as HTMLElement;
const HTML = document.documentElement as HTMLElement;
const Container = $("#container") as HTMLElement;
const loadCat = $("#loading") as HTMLElement;
const siteNav = $("#nav") as HTMLElement;
const siteHeader = $("#header") as HTMLElement;
const menuToggle = siteNav.child(".toggle");
const quickBtn = $("#quick") as HTMLElement;
const sideBar = $("#sidebar") as HTMLElement;
const siteBrand = $("#brand") as HTMLElement;
var toolBtn = $("#tool") as HTMLElement | HTMLTextAreaElement,
  toolPlayer: any,
  backToTop: HTMLElement | null,
  goToComment: HTMLElement | null,
  showContents: HTMLElement | null;
var siteSearch = $("#search") as HTMLElement;
var siteNavHeight: number, headerHightInner: number, headerHight: number;
var oWinHeight = window.innerHeight;
var oWinWidth = window.innerWidth;
var LOCAL_HASH = 0,
  LOCAL_URL = window.location.href;
var pageTag: string | null | undefined;
var pjax: any;

// 初始化函数
export function initGlobal() {
  if (!window.CONFIG) {
    console.warn("CONFIG not initialized yet, waiting...");
    return;
  }
  statics = window.CONFIG.statics.indexOf("//") > 0 ? window.CONFIG.statics : window.CONFIG.root;

  // 初始化图片懒加载
  const observer = lozad("img, [data-background-image]", {
    loaded: function (el: HTMLElement) {
      el.classList.add("lozaded");
    },
    rootMargin: "10px 0px",
    threshold: 0.1,
  });
  observer.observe();
}

const Loader: LoaderObject = {
  timer: null,
  lock: false,
  show: function () {
    clearTimeout(this.timer as ReturnType<typeof setTimeout>);
    document.body.classList.remove("loaded");
    loadCat.attr("style", "display:block");
    Loader.lock = false;
  },
  hide: function (sec?: number) {
    if (!window.CONFIG.loader.start) sec = -1;
    this.timer = setTimeout(this.vanish, sec || 3000);
  },
  vanish: function () {
    if (Loader.lock) return;
    if (window.CONFIG.loader.start) transition(loadCat as HTMLElement, 0);
    document.body.classList.add("loaded");
    Loader.lock = true;
  },
};

const changeTheme = function (type?: string) {
  var btn = $(".theme .ic") as HTMLElement;
  if (type == "dark") {
    HTML.attr("data-theme", type);
    btn.removeClass("i-sun");
    btn.addClass("i-moon");
  } else {
    HTML.attr("data-theme", null);
    btn.removeClass("i-moon");
    btn.addClass("i-sun");
  }
};

const changeMetaTheme = function (color: string) {
  if (HTML.attr("data-theme") == "dark") color = "#222";

  ($('meta[name="theme-color"]') as HTMLElement).attr("content", color);
};

const themeColorListener = function () {
  window.matchMedia("(prefers-color-scheme: dark)").addListener(function (mediaQueryList) {
    if (mediaQueryList.matches) {
      changeTheme("dark");
    } else {
      changeTheme();
    }
  });

  var t = store.get("theme");
  if (t) {
    changeTheme(t);
  } else {
    if (window.CONFIG.darkmode) {
      changeTheme("dark");
    }
  }

  ($(".theme") as HTMLElement).addEventListener("click", function (event) {
    var btn = (event.currentTarget as HTMLElement).child(".ic");

    var neko = BODY.createChild("div", {
      id: "neko",
      innerHTML:
        '<div class="planet"><div class="sun"></div><div class="moon"></div></div><div class="body"><div class="face"><section class="eyes left"><span class="pupil"></span></section><section class="eyes right"><span class="pupil"></span></section><span class="nose"></span></div></div>',
    }) as HTMLDivElement;

    var hideNeko = function () {
      transition(
        neko,
        {
          delay: 2500,
          opacity: 0,
        },
        function () {
          BODY.removeChild(neko);
        }
      );
    };

    if (btn && btn.hasClass("i-sun")) {
      var c = function () {
        neko.addClass("dark");
        changeTheme("dark");
        store.set("theme", "dark");
        hideNeko();
      };
    } else {
      neko.addClass("dark");
      var c = function () {
        neko.removeClass("dark");
        changeTheme();
        store.set("theme", "light");
        hideNeko();
      };
    }
    transition(neko, 1, function () {
      setTimeout(c, 210);
    });
  });
};

// 用户切换浏览器标签页时更改原始标题或者图标
const visibilityListener = function () {
  document.addEventListener("visibilitychange", function () {
    switch (document.visibilityState) {
      case "hidden":
        ($('[rel="icon"]') as HTMLElement).attr("href", statics + window.CONFIG.favicon.hidden);
        document.title = LOCAL.favicon.hide;
        if (window.CONFIG.loader.switch) Loader.show();
        clearTimeout(titleTime);
        break;
      case "visible":
        ($('[rel="icon"]') as HTMLElement).attr("href", statics + window.CONFIG.favicon.normal);
        document.title = LOCAL.favicon.show;
        if (window.CONFIG.loader.switch) Loader.hide(1000);
        titleTime = setTimeout(function () {
          document.title = originTitle;
        }, 2000);
        break;
    }
  });
};

const showtip = function (msg?: string) {
  if (!msg) return;

  var tipbox = BODY.createChild("div", {
    innerHTML: msg,
    className: "tip",
  });

  setTimeout(function () {
    tipbox.addClass("hide");
    setTimeout(function () {
      BODY.removeChild(tipbox);
    }, 300);
  }, 3000);
};

const resizeHandle = function (event?: Event) {
  siteNavHeight = siteNav.height();
  headerHightInner = siteHeader.height();
  headerHight = headerHightInner + ($("#waves") as HTMLElement).height();

  if (oWinWidth != window.innerWidth) sideBarToggleHandle(null, 1);

  oWinHeight = window.innerHeight;
  oWinWidth = window.innerWidth;
  const panels = sideBar.child(".panels");
  if (panels) {
    panels.height(oWinHeight + "px");
  }
};

const scrollHandle = function (event?: Event) {
  var winHeight = window.innerHeight;
  var docHeight = getDocHeight();
  var contentVisibilityHeight = docHeight > winHeight ? docHeight - winHeight : document.body.scrollHeight - winHeight;
  var SHOW = window.scrollY > headerHightInner;
  var startScroll = window.scrollY > 0;

  if (SHOW) {
    changeMetaTheme("#FFF");
  } else {
    changeMetaTheme("#222");
  }

  siteNav.toggleClass("show", SHOW);
  toolBtn.toggleClass("affix", startScroll);
  siteBrand.toggleClass("affix", startScroll);
  sideBar.toggleClass("affix", window.scrollY > headerHight && document.body.offsetWidth > 991);

  if (typeof scrollAction.y == "undefined") {
    scrollAction.y = window.scrollY;
  }
  diffY = (scrollAction.y as number) - window.scrollY;

  if (diffY < 0) {
    // Scroll down
    siteNav.removeClass("up");
    siteNav.toggleClass("down", SHOW);
  } else if (diffY > 0) {
    // Scroll up
    siteNav.removeClass("down");
    siteNav.toggleClass("up", SHOW);
  } else {
    // First scroll event
  }
  scrollAction.y = window.scrollY;

  var scrollPercent = Math.round(Math.min((100 * window.scrollY) / contentVisibilityHeight, 100)) + "%";
  const span = backToTop?.child("span");
  if (span) {
    span.innerText = scrollPercent;
  }
  ($(".percent") as HTMLElement).width(scrollPercent);
};

const pagePosition = function () {
  if (window.CONFIG.auto_scroll) store.set(LOCAL_URL, scrollAction.y.toString());
};

const positionInit = function (comment?: boolean) {
  var anchor = window.location.hash;
  var target = null;
  if (LOCAL_HASH) {
    store.del(LOCAL_URL);
    return;
  }

  if (anchor) target = $(decodeURI(anchor));
  else {
    const storedPosition = store.get(LOCAL_URL);
    target = window.CONFIG.auto_scroll && storedPosition ? parseInt(storedPosition) : 0;
  }

  if (target) {
    pageScroll(target);
    LOCAL_HASH = 1;
  }

  if (comment && anchor && !LOCAL_HASH) {
    if (target) {
      pageScroll(target);
    }
    LOCAL_HASH = 1;
  }
};

const clipBoard = function (str: string, callback?: (result: boolean) => void) {
  var ta = BODY.createChild("textarea", {
    style: {
      top: window.scrollY + "px",
      position: "absolute",
      opacity: "0",
    },
    readOnly: true,
    value: str,
  }) as HTMLTextAreaElement;

  const selection = document.getSelection();
  const selected = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : false;
  ta.select();
  ta.setSelectionRange(0, str.length);
  ta.readOnly = false;
  var result = document.execCommand("copy");
  callback && callback(result);
  ta.blur();
  if (selected && selection) {
    selection.removeAllRanges();
    selection.addRange(selected);
  }
  BODY.removeChild(ta);
};

function setToolBtn(newToolBtn: HTMLElement | HTMLTextAreaElement) {
  toolBtn = newToolBtn;
}

function setOriginTitle(title: string) {
  originTitle = title;
}

function sideBarToggleHandle(event: Event | null, force?: number): void {
  if (sideBar.hasClass("on")) {
    sideBar.removeClass("on");
    menuToggle?.removeClass("close");
    if (force) {
      sideBar.style.cssText = "";
    } else {
      transition(sideBar, "slideRightOut");
    }
  } else {
    if (force) {
      sideBar.style.cssText = "";
    } else {
      transition(sideBar, "slideRightIn", function () {
        sideBar.addClass("on");
        menuToggle?.addClass("close");
      });
    }
  }
}

// 添加 getter 和 setter 方法
function getToolPlayer() {
  return toolPlayer;
}

function setToolPlayer(newToolPlayer: any) {
  toolPlayer = newToolPlayer;
}

function getBackToTop() {
  return backToTop;
}

function setBackToTop(newBackToTop: HTMLElement | null) {
  backToTop = newBackToTop;
}

function getGoToComment() {
  return goToComment;
}

function setGoToComment(newGoToComment: HTMLElement | null) {
  goToComment = newGoToComment;
}

function getShowContents() {
  return showContents;
}

function setShowContents(newShowContents: HTMLElement | null) {
  showContents = newShowContents;
}

export function setSiteNavHeight(height: number) {
  siteNavHeight = height;
}

export function getSiteNavHeight(): number {
  return siteNavHeight;
}

export function setHeaderHightInner(height: number) {
  headerHightInner = height;
}

export function getHeaderHightInner(): number {
  return headerHightInner;
}

export function setHeaderHight(height: number) {
  headerHight = height;
}

export function getHeaderHight(): number {
  return headerHight;
}

export function updatePageTag() {
  pageTag = document.head.querySelector('meta[name="pageTag"]')?.getAttribute("content");
}

export function getPageTag(): string | null | undefined {
  return pageTag;
}

export {
  statics,
  scrollAction,
  diffY,
  BODY,
  HTML,
  Container,
  loadCat,
  siteNav,
  siteHeader,
  menuToggle,
  quickBtn,
  sideBar,
  siteBrand,
  toolBtn,
  siteSearch,
  siteNavHeight,
  headerHightInner,
  headerHight,
  oWinHeight,
  oWinWidth,
  LOCAL_HASH,
  LOCAL_URL,
  pjax,
  Loader,
  changeTheme,
  changeMetaTheme,
  themeColorListener,
  visibilityListener,
  showtip,
  resizeHandle,
  scrollHandle,
  pagePosition,
  positionInit,
  clipBoard,
  sideBarToggleHandle,
  setToolBtn,
  setOriginTitle,
  getToolPlayer,
  setToolPlayer,
  getBackToTop,
  setBackToTop,
  getGoToComment,
  setGoToComment,
  getShowContents,
  setShowContents,
};
