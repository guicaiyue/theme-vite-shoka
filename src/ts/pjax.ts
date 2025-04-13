import $ from "./core/dom";

import { addEvent, vendorCss, vendorJs, transition, pjaxScript, pageScroll } from "./core/utils";
import {
  loadCat,
  Loader,
  menuToggle,
  sideBarToggleHandle,
  quickBtn,
  toolBtn,
  siteHeader,
  setToolBtn,
  visibilityListener,
  themeColorListener,
  scrollHandle,
  resizeHandle,
  setOriginTitle,
  positionInit,
  pagePosition,
  getBackToTop,
  setToolPlayer,
  setBackToTop,
  setGoToComment,
  setShowContents,
  getGoToComment,
  getShowContents,
  sideBar,
  updatePageTag,
  getPageTag,
} from "./global";
import { Page } from "./page";
import { MediaPlayer } from "./player";
import { Sidebar } from "./sidebar";
import Pjax from "pjax";
import { listen } from "quicklink";

const markdownAssemble = () =>
  import("./markdown/assemble").then((module) => {
    module.markdownAssemble();
  });

// PJAX 处理类
export class PJAX {
  private Page: Page;
  private player: MediaPlayer | null;
  private sidebar: Sidebar;
  private pjax: any;

  constructor() {
    this.Page = window.Page;
    this.player = window.MediaPlayer;
    this.sidebar = window.Sidebar;
    this.init();
  }

  init() {
    this.domInit();
    this.headCirculateImg();
    this.loadingEndRendering();
    this.initPjax();
    this.bindEvents();
    this.siteRefresh(true);
  }

  // DOM 初始化
  domInit() {
    loadCat.addEventListener("click", Loader.vanish);
    menuToggle?.addEventListener("click", sideBarToggleHandle);
    $(".dimmer")?.addEventListener("click", sideBarToggleHandle);

    quickBtn?.child(".down")?.addEventListener("click", this.sidebar.goToBottomHandle);
    quickBtn?.child(".up")?.addEventListener("click", this.sidebar.backToTopHandle);

    if (!toolBtn) {
      setToolBtn(
        siteHeader.createChild("div", {
          id: "tool",
          innerHTML:
            '<div class="item player"></div><div class="item contents"><i class="ic i-list-ol"></i></div><div class="item chat"><i class="ic i-comments"></i></div><div class="item back-to-top"><i class="ic i-arrow-up"></i><span>0%</span></div>',
        })
      );
    }

    setToolPlayer(toolBtn.child(".player"));
    setBackToTop(toolBtn.child(".back-to-top"));
    setGoToComment(toolBtn.child(".chat"));
    setShowContents(toolBtn.child(".contents"));

    addEvent(getBackToTop(), "click", this.sidebar.backToTopHandle);
    addEvent(getGoToComment(), "click", this.sidebar.goToCommentHandle);
    addEvent(getShowContents(), "click", sideBarToggleHandle);

    //this.player.init(this.toolPlayer);
    $("main")?.addEventListener("click", () => {
      // 不知道干嘛
      // this.player.mini();
    });
  }

  // 头部轮播图
  async headCirculateImg() {
    const child = $("#imgs")?.child("ul");
    let imgUrl = haloConfig.base.headCoverUrl;
    imgUrl += imgUrl.indexOf("?") ? "&" : "?";
    let photos = child
      ?.child("li")
      ?.innerText.split(";")
      .map((m) => m.trim())
      .filter((f) => f && f != "");
    for (let i = photos?.length ?? 0; i < 5; i++) {
      photos?.push(`${imgUrl + "&" + i}`);
    }
    if (child) {
      child.innerHTML = "";
    }
    photos = photos ? this.shuffleArray(photos) : [];
    const addImgHtml = async () => {
      for (let photo of photos) {
        child?.insertAdjacentHTML("beforeend", `<li class="item" style="background-image: url(${photo});"></li>`);
        await this.sleep(1500);
      }
    };
    addImgHtml();
  }

  // 加载完成渲染
  loadingEndRendering() {
    const securityNumber = haloConfig.base.security_number;
    if (securityNumber) {
      const number = securityNumber.replace(/\D/g, "");
      const child = document.getElementsByClassName("copyright")[0];
      child.innerHTML += `<img src="https://beian.mps.gov.cn/web/assets/logo01.6189a29f.png" class="security-number"><a href="http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=${number}" target="_blank">${securityNumber}</a>`;
    }
  }

  // PJAX 初始化
  initPjax() {
    this.pjax = new Pjax({
      elements: 'a[href]:not([href^="#"]):not([href="javascript:void(0)"]):not([target="_blank"])',
      selectors: [
        "head title",
        'head meta[name="pageTag"]',
        'head meta[name="keywords"]',
        'head meta[name="description"]',
        "head meta[data-pajx]",
        ".languages",
        ".pjax",
      ],
      analytics: false,
      cacheBust: false,
      debug: true,
      scrollRestoration: true,
      timeout: 10000,
      history: true,
    });

    window.CONFIG.quicklink.ignores = window.LOCAL.ignores;
    listen(window.CONFIG.quicklink as any);

    visibilityListener();
    themeColorListener();
  }

  // 绑定事件
  bindEvents() {
    addEvent(window, "scroll", scrollHandle.bind(this.pjax));
    addEvent(window, "resize", resizeHandle.bind(this));
    addEvent(window, "pjax:send", this.pjaxReload.bind(this));
    addEvent(window, "pjax:success", () => this.siteRefresh(false));
    addEvent(window, "beforeunload", () => pagePosition());
  }

  // PJAX 重载
  pjaxReload() {
    pagePosition();

    if (sideBar?.hasClass("on")) {
      transition(sideBar, () => {
        sideBar?.removeClass("on");
        menuToggle?.removeClass("close");
      });
    }
    const mainElement = $("#main");
    if (mainElement) {
      mainElement.innerHTML = "";
    }
    const loadCatLastChild = loadCat?.lastChild;
    if (mainElement && loadCatLastChild) {
      mainElement.appendChild(loadCatLastChild.cloneNode(true));
    }
    pageScroll(0);
  }

  // 站点刷新
  siteRefresh(reload: boolean) {
    window.CONFIG.localHash = 0;
    window.CONFIG.localUrl = window.location.href;
    //更新当前页面标识
    updatePageTag();
    const pageTag = getPageTag();

    vendorCss("katex");
    vendorJs("copy_tex");
    vendorCss("mermaid");
    vendorJs("chart");

    if (!reload) {
      $.each("script[data-pjax]", (el: HTMLElement | HTMLScriptElement) => {
        if (el instanceof HTMLScriptElement) {
          pjaxScript.call(this, el);
        }
      });
    }

    setOriginTitle(document.title);

    resizeHandle();

    this.Page.tagsOrCategoriesBeautification();

    switch (pageTag) {
      //文章相关页面，需要渲染markdown
      case "postHtml":
      case "pagePostHtml":
        markdownAssemble().then(() => {
          //初始化文章目录并激活
          this.sidebar.createTOC();
          this.sidebar.initSidebarTOC();
          this.sidebar.initSidebarTabs();
        });
        break;
    }
    this.sidebar.menuActive();

    this.Page.initPostBeauty();
    this.Page.initTabFormat();

    //this.player.load(window.CONFIG.audio || {});

    Loader.hide();

    setTimeout(() => {
      positionInit();
    }, 500);

    this.Page.initCardActive();

    // 懒加载
    //lazyload.observe();
  }

  // 工具方法
  sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  shuffleArray(array: string[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
