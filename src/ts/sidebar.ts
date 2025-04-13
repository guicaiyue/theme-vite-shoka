import $ from "./core/dom";
import { addEvent, pageScroll } from "./core/utils";
import { sideBar, menuToggle, getShowContents, getPageTag, clipBoard } from "./global";
// 侧边栏类
export class Sidebar {
  private showContents: HTMLElement | null;
  private activeLock: number | null = null;

  constructor() {
    this.init();
    this.showContents = getShowContents();
  }

  init() {
    // 初始化侧边栏
    this.bindEvents();
    //this.initTOC();
    //this.initSidebarTabs();
  }

  bindEvents() {
    // 绑定侧边栏切换事件
    if (menuToggle) {
      addEvent(menuToggle, "click", (event) => this.toggleHandle(event));
    }

    // 绑定返回顶部事件
    const backToTop = $(".back-to-top");
    if (backToTop) {
      addEvent(backToTop, "click", this.backToTopHandle);
    }

    // 绑定返回底部事件
    const goToBottom = $(".go-to-bottom");
    if (goToBottom) {
      addEvent(goToBottom, "click", this.goToBottomHandle);
    }

    // 绑定返回评论事件
    const goToComment = $(".go-to-comment");
    if (goToComment) {
      addEvent(goToComment, "click", this.goToCommentHandle);
    }
  }

  toggleHandle(event: Event, force?: boolean) {
    if (sideBar && menuToggle) {
      if (sideBar.classList.contains("on")) {
        sideBar.classList.remove("on");
        menuToggle.classList.remove("close");
        if (force) {
          sideBar.style.cssText = "";
        } else {
          this.transition(sideBar, "slideRightOut");
        }
      } else {
        if (force) {
          sideBar.style.cssText = "";
        } else {
          this.transition(sideBar, "slideRightIn", () => {
            sideBar?.classList.add("on");
            menuToggle?.classList.add("close");
          });
        }
      }
    }
  }

  // 生成文章目录递归方法
  recursionCreatTabFragment(level: number[], index: number, arrList: [number, string, string][]): [number, string] {
    let html = `<ol class="${index == 0 ? "toc" : "toc-child"}">`;
    for (index; index < arrList.length; index++) {
      let nextIndex = index + 1;
      html += `<li class="toc-item toc-level-${level.length} ${index == 0 ? "active" : ""}">
                    <a class="toc-link" href="#${
                      arrList[index][1]
                    }" data-pjax-state=""><span class="toc-number">${level.join(".")}</span> <span class="toc-text">${
        arrList[index][2]
      }</span></a>
                 `;
      // 不是最后一个，并且下一个是前一个的下一级标签
      if (index != arrList.length - 1 && arrList[index][0] < arrList[nextIndex][0]) {
        let childLevel = JSON.parse(JSON.stringify(level));
        childLevel.push(1);
        let childArr = this.recursionCreatTabFragment(childLevel, index + 1, arrList);
        nextIndex = childArr[0];
        html += childArr[1];
      }

      level[level.length - 1] = level[level.length - 1] + 1;
      html += `</li>`;

      if (index == arrList.length - 1 || nextIndex == arrList.length) {
        index = nextIndex;
        break;
      }

      if (arrList[index][0] > arrList[nextIndex][0]) {
        index = nextIndex;
        break;
      }
      index = nextIndex - 1;
    }
    html += "</ol>";
    return [index, html];
  }

  // 创建文章目录
  createTOC() {
    const contentsPanel = sideBar?.querySelector(".panel.contents");
    if (!contentsPanel) return;

    const headings = $.all(".md h1, .md h2, .md h3, .md h4, .md h5, .md h6");
    if (headings.length === 0) return;

    const tocList: [number, string, string][] = [];
    headings.forEach((heading: HTMLElement) => {
      const level = parseInt(heading.tagName[1]);
      const id = heading.id || heading.textContent || "";
      const text = heading.textContent?.substring(1) || "";
      tocList.push([level, id, text]);
    });

    const toc = this.recursionCreatTabFragment([1], 0, tocList)[1];
    contentsPanel.innerHTML = toc;

    // 处理系列文章
    const relatedPanel = sideBar?.querySelector(".panel.related ul");
    if (relatedPanel) {
      const items = Array.from(relatedPanel.children);
      items.sort((a, b) => {
        const aIndex = parseInt(a.getAttribute("data-index") || "0");
        const bIndex = parseInt(b.getAttribute("data-index") || "0");
        return aIndex - bIndex;
      });
      relatedPanel.innerHTML = items.map((item) => item.outerHTML).join("");
    }
  }

  // 初始化目录
  initTOC() {
    this.menuActive();
  }

  // 初始化侧边栏标签
  initSidebarTabs() {
    if (!sideBar) return;

    const sideBarInner = sideBar.querySelector(".inner");
    const panels = sideBar.querySelectorAll(".panel");

    // 移除已存在的标签
    const existingTab = sideBar.querySelector(".tab");
    if (existingTab && sideBarInner) {
      sideBarInner.removeChild(existingTab);
    }

    // 创建新的标签列表
    const list = document.createElement("ul");
    list.className = "tab";
    let active = "active";

    ["contents", "related", "overview"].forEach((item) => {
      const element = sideBar?.querySelector(`.panel.${item}`);
      if (!element) return;

      if (element.innerHTML.trim().length === 0) {
        if (item === "contents" && this.showContents) {
          this.showContents.style.display = "none";
        }
        return;
      }

      if (item === "contents" && this.showContents) {
        this.showContents.style.display = "";
      }

      const tab = document.createElement("li");
      const span = document.createElement("span");
      span.textContent = element.getAttribute("data-title") || "";
      tab.appendChild(span);
      tab.classList.add(item, "item");

      if (active) {
        element.classList.add(active);
        tab.classList.add(active);
      } else {
        element.classList.remove("active");
      }

      tab.addEventListener("click", (event) => {
        const target = event.currentTarget as HTMLElement;
        if (target.classList.contains("active")) return;

        sideBar?.querySelectorAll(".tab .item").forEach((el) => el.classList.remove("active"));
        sideBar?.querySelectorAll(".panel").forEach((el) => el.classList.remove("active"));

        const panel = sideBar?.querySelector(`.panel.${target.classList[0]}`);
        panel?.classList.add("active");
        target.classList.add("active");
      });

      list.appendChild(tab);
      active = "";
    });

    if (list.children.length > 1) {
      sideBarInner?.insertBefore(list, sideBarInner.firstChild);
      const panelsElement = sideBar.querySelector(".panels") as HTMLElement;
      if (panelsElement) panelsElement.style.paddingTop = "";
    } else {
      const panelsElement = sideBar.querySelector(".panels") as HTMLElement;
      if (panelsElement) panelsElement.style.paddingTop = ".625rem";
    }
  }

  // 初始化目录导航
  initSidebarTOC() {
    const navItems = $.all(".contents li");
    if (navItems.length < 1) return;

    const sections = Array.from(navItems);
    this.activeLock = null;

    sections.forEach((element, index) => {
      const link = element.querySelector("a.toc-link");
      const href = link?.getAttribute("href");
      if (!href) return;

      const anchor = $(decodeURI(href));
      if (!anchor) return;

      const alink = anchor.querySelector("a.anchor");

      const anchorScroll = (event: Event) => {
        event.preventDefault();
        const target = $(decodeURI((event.currentTarget as HTMLAnchorElement).getAttribute("href") || ""));
        if (!target) return;

        this.activeLock = index;
        pageScroll(target, null, () => {
          this.activateNavByIndex(index);
          this.activeLock = null;
        });
      };

      link?.addEventListener("click", anchorScroll);
      alink?.addEventListener("click", (event) => {
        anchorScroll(event);
        if (href) {
          clipBoard(window.location.href + href);
        }
      });
    });

    this.createIntersectionObserver(sections);
  }

  // 激活导航项
  private activateNavByIndex(index: number) {
    const navItems = $.all(".contents li");
    const target = navItems[index];
    if (!target || target.classList.contains("current")) return;

    $.all(".toc .active").forEach((el) => el.classList.remove("active", "current"));
    $.all(".contents .active").forEach((el) => el.classList.remove("active"));

    target.classList.add("active", "current");
    const sections = $.all(".contents .active");
    if (sections[index]) sections[index].classList.add("active");

    let parent = target.parentElement;
    while (parent && !parent.matches(".contents")) {
      if (parent.matches("li")) {
        parent.classList.add("active");
        const href = parent.querySelector("a.toc-link")?.getAttribute("href");
        if (href) {
          const t = $(decodeURI(href));
          if (t) t.classList.add("active");
        }
      }
      parent = parent.parentElement;
    }

    if (sideBar && this.showContents?.classList.contains("active")) {
      const tocElement = sideBar.querySelector(".contents.panel") as HTMLElement;
      if (tocElement) {
        pageScroll(tocElement, target.offsetTop - tocElement.offsetHeight / 4);
      }
    }
  }

  // 创建交叉观察器
  private createIntersectionObserver(sections: HTMLElement[]) {
    if (!window.IntersectionObserver) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const index = this.findIndex(entries) + (window.diffY < 0 ? 1 : 0);
        if (this.activeLock === null) {
          this.activateNavByIndex(index);
        }
      },
      {
        rootMargin: "0px 0px -100% 0px",
        threshold: 0,
      }
    );

    sections.forEach((element) => observer.observe(element));
  }

  // 查找索引
  private findIndex(entries: IntersectionObserverEntry[]): number {
    let index = 0;
    let entry = entries[index];

    if (entry.boundingClientRect.top > 0) {
      index = Array.from($.all(".contents .active")).indexOf(entry.target as HTMLElement);
      return index === 0 ? 0 : index - 1;
    }

    for (; index < entries.length; index++) {
      if (entries[index].boundingClientRect.top <= 0) {
        entry = entries[index];
      } else {
        return Array.from($.all(".contents .active")).indexOf(entry.target as HTMLElement);
      }
    }

    return Array.from($.all(".contents .active")).indexOf(entry.target as HTMLElement);
  }

  // 返回顶部
  backToTopHandle() {
    pageScroll(0);
  }

  // 返回底部
  goToBottomHandle() {
    pageScroll(parseInt(window.Container.height()));
  }

  // 返回评论
  goToCommentHandle() {
    const comments = $("#comments");
    if (comments) {
      pageScroll(comments);
    }
  }

  // 菜单激活
  menuActive() {
    $.all(".menu .item:not(.title)").forEach((element: HTMLElement) => {
      const target = element.querySelector("a[href]") as HTMLAnchorElement;
      const parentItem = element.parentElement?.parentElement;
      if (!target) return;

      const isSamePath =
        target.pathname === location.pathname || target.pathname === location.pathname.replace("index.html", "");
      const isSubPath =
        !window.CONFIG.root.startsWith(target.pathname) && location.pathname.startsWith(target.pathname);
      const active = target.hostname === location.hostname && (isSamePath || isSubPath);

      element.classList.toggle("active", active);
      if (element.parentElement?.querySelector(".active") && parentItem?.classList.contains("dropdown")) {
        parentItem.classList.remove("active");
        parentItem.classList.add("expand");
      } else {
        parentItem?.classList.remove("expand");
      }
    });
  }

  // 动画过渡
  private transition(element: HTMLElement, className: string, callback?: () => void) {
    element.classList.add(className);
    element.addEventListener("transitionend", function handler() {
      element.classList.remove(className);
      element.removeEventListener("transitionend", handler);
      callback && callback();
    });
  }
}
