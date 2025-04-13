import $ from "./core/dom";
import { addEvent, vendorCss, pageScroll, transition } from "./core/utils";
import { showtip, clipBoard, getPageTag } from "./global";
import { Fancybox } from "@fancyapps/ui";
import "@fancyapps/ui/dist/fancybox/fancybox.css";

// 页面处理类
export class Page {
  // 卡片激活效果
  initCardActive() {
    if (!$(".index.wrap")) return;

    if (!window.IntersectionObserver) {
      $.each(".index.wrap article.item, .index.wrap section.item", (article: HTMLElement) => {
        if (!article.classList.contains("show")) {
          article.classList.add("show");
        }
      });
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const article = entry.target as HTMLElement;
            if (article.classList.contains("show")) {
              io.unobserve(article);
            } else {
              if (entry.isIntersecting || entry.intersectionRatio > 0) {
                article.classList.add("show");
                io.unobserve(article);
              }
            }
          });
        },
        {
          root: null,
          threshold: [0.3],
        }
      );

      $.each(".index.wrap article.item, .index.wrap section.item", (article: Element) => {
        io.observe(article);
      });

      const firstItem = $(".index.wrap .item:first-child");
      if (firstItem) {
        firstItem.classList.add("show");
      }
    }

    $.each(".cards .item", (element: HTMLElement) => {
      ["mouseenter", "touchstart"].forEach((event) => {
        addEvent(element, event, () => {
          const activeItem = $(".cards .item.active");
          if (activeItem) {
            activeItem.classList.remove("active");
          }
          element.classList.add("active");
        });
      });

      ["mouseleave"].forEach((event) => {
        addEvent(element, event, () => {
          element.classList.remove("active");
        });
      });
    });
  }

  // 图片灯箱效果
  initFancybox(selector: string = ".md") {
    try {
      // 处理图片画廊
      $.each(`${selector} p.gallery`, (element: HTMLElement) => {
        const box = document.createElement("div");
        box.className = "gallery";
        box.setAttribute("data-height", element.getAttribute("data-height") || "220");
        box.innerHTML = element.innerHTML.replace(/<br>/g, "");
        element.parentNode?.insertBefore(box, element);
        element.remove();
      });

      // 处理普通图片
      $.each(`${selector} img:not(.emoji):not(.vemoji)`, (el: HTMLElement) => {
        if (el instanceof HTMLImageElement) {
          const element = el;
          if (!element.parentElement?.matches("a")) {
            const imageLink = element.getAttribute("data-src") || element.getAttribute("src");
            if (!imageLink) return;

            // 创建包装链接
            const link = document.createElement("a");
            link.className = "fancybox";
            link.href = imageLink;
            link.setAttribute("itemscope", "");
            link.setAttribute("itemtype", "http://schema.org/ImageObject");
            link.setAttribute("itemprop", "url");

            // 设置 fancybox 属性
            if (!element.closest(".gallery")) {
              link.setAttribute("data-fancybox", "default");
              link.setAttribute("rel", "default");
            }

            // 处理图片标题
            const title = element.getAttribute("title");
            if (title) {
              link.setAttribute("data-caption", title);
              const caption = document.createElement("span");
              caption.className = element.closest(".gallery") ? "jg-caption" : "image-info";
              caption.textContent = title;
              element.insertAdjacentElement("afterend", caption);
            }

            // 包装图片
            element.parentNode?.insertBefore(link, element);
            link.appendChild(element);
          }
        }
      });

      // 初始化 fancybox
      Fancybox.bind(`${selector} .fancybox`);
    } catch (error) {
      console.error("Failed to initialize Fancybox:", error);
    }
  }

  // 文章美化
  initPostBeauty() {
    this.initComments();

    if (!$(".md")) return;
    this.haloPostHtmlHandler();

    this.initFancybox(".post.block");

    // 复制处理
    const postBlock = $(".post.block");
    if (postBlock) {
      postBlock.oncopy = (event: ClipboardEvent) => {
        showtip(window.LOCAL.copyright);

        if (window.LOCAL.nocopy) {
          event.preventDefault();
          return;
        }

        const copyright = $("#copyright");
        const selection = window.getSelection();
        if (selection !== null && selection.toString().length > 30 && copyright) {
          event.preventDefault();
          const author = "# " + copyright.querySelector(".author")?.textContent;
          const link = "# " + copyright.querySelector(".link")?.textContent;
          const license = "# " + copyright.querySelector(".license")?.textContent;
          const htmlData = `${author}<br>${link}<br>${license}<br><br>${window
            .getSelection()
            ?.toString()
            .replace(/\r\n/g, "<br>")}`;
          const textData = `${author}\n${link}\n${license}\n\n${window
            .getSelection()
            ?.toString()
            .replace(/\r\n/g, "\n")}`;

          if (event.clipboardData) {
            event.clipboardData.setData("text/html", htmlData);
            event.clipboardData.setData("text/plain", textData);
          } else if (window.clipboardData) {
            return window.clipboardData.setData("text", textData);
          }
        }
      };
    }

    // Ruby 标签处理
    $.each("li ruby", (element: HTMLElement) => {
      let parent = element.parentElement;
      if (parent?.tagName !== "LI") {
        parent = parent?.parentElement ?? null;
      }
      parent?.classList.add("ruby");
    });

    // 有序列表处理
    $.each("ol[start]", (element: HTMLElement) => {
      const start = parseInt(element.getAttribute("start") || "1");
      element.style.counterReset = `counter ${start - 1}`;
    });

    // 表格处理
    $.each(".md table", (element: HTMLElement) => {
      element.classList.add("table-container");
    });

    // 代码块处理
    $.each("figure.highlight", (element: HTMLElement) => {
      const codeContainer = element.querySelector(".code-container");
      const caption = element.querySelector("figcaption");

      element.insertAdjacentHTML(
        "beforeend",
        '<div class="operation"><span class="breakline-btn"><i class="ic i-align-left"></i></span><span class="copy-btn"><i class="ic i-clipboard"></i></span><span class="fullscreen-btn"><i class="ic i-expand"></i></span></div>'
      );

      const copyBtn = element.querySelector(".copy-btn");
      if (window.LOCAL.nocopy) {
        copyBtn?.remove();
      } else {
        copyBtn?.addEventListener("click", (event) => {
          const target = event.currentTarget as HTMLElement;
          let code = "";
          codeContainer?.querySelectorAll("pre").forEach((line, index) => {
            code += (index > 0 ? "\n" : "") + line.textContent;
          });

          clipBoard(code, (result: boolean) => {
            const icon = target.querySelector(".ic");
            if (icon) {
              icon.className = result ? "ic i-check" : "ic i-times";
            }
            target.blur();
            showtip(window.LOCAL.copyright);
          });
        });

        copyBtn?.addEventListener("mouseleave", (event) => {
          const target = event.target as HTMLElement;
          setTimeout(() => {
            const icon = target.querySelector(".ic");
            if (icon) {
              icon.className = "ic i-clipboard";
            }
          }, 1000);
        });
      }

      // 代码换行处理
      const breakBtn = element.querySelector(".breakline-btn");
      breakBtn?.addEventListener("click", (event) => {
        const target = event.currentTarget as HTMLElement;
        if (element.classList.contains("breakline")) {
          element.classList.remove("breakline");
          const icon = target.querySelector(".ic");
          if (icon) icon.className = "ic i-align-left";
        } else {
          element.classList.add("breakline");
          const icon = target.querySelector(".ic");
          if (icon) icon.className = "ic i-align-justify";
        }
      });

      // 全屏处理
      const fullscreenBtn = element.querySelector(".fullscreen-btn");
      const removeFullscreen = () => {
        element.classList.remove("fullscreen");
        element.scrollTop = 0;
        document.body.classList.remove("fullscreen");
        const icon = fullscreenBtn?.querySelector(".ic");
        if (icon) icon.className = "ic i-expand";
      };

      // 长代码块处理
      if (codeContainer && codeContainer.querySelectorAll("tr").length > 15) {
        const container = codeContainer as HTMLElement;
        container.style.maxHeight = "300px";
        container.insertAdjacentHTML("beforeend", '<div class="show-btn"><i class="ic i-angle-down"></i></div>');
        const showBtn = container.querySelector(".show-btn");

        const showCode = (container: HTMLElement, showBtn: Element | null) => {
          container.style.maxHeight = "";
          showBtn?.classList.add("open");
        };

        const hideCode = (container: HTMLElement, showBtn: Element | null) => {
          container.style.maxHeight = "300px";
          showBtn?.classList.remove("open");
        };

        const fullscreenHandle = (event: Event) => {
          const target = event.currentTarget as HTMLElement;
          if (element.classList.contains("fullscreen")) {
            removeFullscreen();
            hideCode(container, showBtn);
            pageScroll(container);
          } else {
            element.classList.add("fullscreen");
            document.body.classList.add("fullscreen");
            const icon = target.querySelector(".ic");
            if (icon) icon.className = "ic i-compress";
            showCode(container, showBtn);
          }
        };

        fullscreenBtn?.addEventListener("click", fullscreenHandle);
        caption?.addEventListener("click", fullscreenHandle);

        showBtn?.addEventListener("click", (event) => {
          if (showBtn.classList.contains("open")) {
            removeFullscreen();
            hideCode(container, showBtn);
            pageScroll(container);
          } else {
            showCode(container, showBtn);
          }
        });
      }
    });

    // Mermaid 图表处理
    $.each("pre.mermaid > svg", (element: HTMLElement) => {
      element.style.maxWidth = "";
    });

    // 打赏按钮处理
    $.each(".reward button", (element: HTMLElement) => {
      element.addEventListener("click", (event) => {
        event.preventDefault();
        const qr = $("#qr");
        if (qr?.style.display === "inline-flex") {
          qr && transition(qr, 0);
        } else {
          qr &&
            transition(qr, 1, () => {
              if (qr) qr.style.display = "inline-flex";
            });
        }
      });
    });

    // 测验处理
    $.each(".quiz > ul.options li", (element: HTMLElement) => {
      element.addEventListener("click", (event) => {
        if (element.classList.contains("correct")) {
          element.classList.toggle("right");
          element.parentElement?.parentElement?.classList.add("show");
        } else {
          element.classList.toggle("wrong");
        }
      });
    });

    $.each(".quiz > p", (element: HTMLElement) => {
      element.addEventListener("click", (event) => {
        element.parentElement?.classList.toggle("show");
      });
    });

    // 标签颜色处理
    $.each("div.tags a", (element: HTMLElement) => {
      const colors = ["primary", "success", "info", "warning", "danger"];
      element.className = colors[Math.floor(Math.random() * colors.length)];
    });
  }

  // 标签页格式化
  initTabFormat() {
    $.each("div.tabs", (element: HTMLElement) => {
      const tabs = element.querySelectorAll(".tab");
      const contents = element.querySelectorAll(".tab-content");

      tabs.forEach((tab, index) => {
        addEvent(tab, "click", () => {
          tabs.forEach((t) => t.classList.remove("active"));
          contents.forEach((c) => c.classList.remove("active"));

          tab.classList.add("active");
          contents[index].classList.add("active");
        });
      });
    });
  }

  // 评论加载
  initComments() {
    const element = $("#comments");
    if (!element) {
      const goToComment = $(".go-to-comment");
      if (goToComment) goToComment.style.display = "none";
      return;
    }

    const goToComment = $(".go-to-comment");
    if (goToComment) goToComment.style.display = "";

    if (!window.IntersectionObserver) {
      vendorCss("valine");
    } else {
      const io = new IntersectionObserver((entries, observer) => {
        const entry = entries[0];
        vendorCss("valine");
        if (entry.isIntersecting || entry.intersectionRatio > 0) {
          const comments = $("#comments");
          if (comments) transition(comments, "bounceUpIn");
          observer.disconnect();
        }
      });

      io.observe(element);
    }
  }

  // Halo 文章 HTML 处理
  haloPostHtmlHandler() {
    // 代码块处理
    $.each(".md pre", (element: HTMLElement) => {
      // 在这里添加 Halo 特定的代码块处理逻辑
    });
  }

  // 防抖函数
  debounce(func: Function, wait: number) {
    let timeout: number | ReturnType<typeof setTimeout>;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  private showCode(container: HTMLElement, showBtn: Element | null) {
    container.style.maxHeight = "";
    showBtn?.classList.add("open");
  }

  private hideCode(container: HTMLElement, showBtn: Element | null) {
    container.style.maxHeight = "300px";
    showBtn?.classList.remove("open");
  }

  // 标签、分类页面统一美化
  tagsOrCategoriesBeautification = function () {
    // 判断当前页面是不是标签、分类页面
    let pageTag = getPageTag();
    if (!["categoriesHtml", "tagsHtml"].includes(pageTag || "")) return;

    let fontSize = 16;
    $.each(".wrap .cloud a", function (e) {
      (e as HTMLElement).style.fontSize = `${fontSize + Math.floor(Math.random() * 10)}px`;
      (e as HTMLElement).style.color = `rgb(${Math.floor(Math.random() * 255)}, 200, ${Math.floor(
        Math.random() * 255
      )})`;
    });
  };
}
