import { CodeBlockOptions } from "../dto/markdown/markdownTypes";
import { cycleReset } from "./assemble";
import Prism from "prismjs";

// 一级处理
let checkBoxNumber: number = 0;

export const primaryElement = function (element: HTMLElement): null {
  // 跳过指定元素
  if (["figure"].includes(element.localName)) {
    // figure 如果是代码块的标签元素，直接跳过
    cycleReset(element, null, 1);
  }

  // js获取标签名
  const tagName = element.tagName.toLowerCase();
  // 获取 js class 样式名
  const classes = element.classList;
  checkboxBeautification(element); // 复选框美化、可做待办事项
  restoreDelBeautification(element); // element 将del元素还原为~
  hTitleConversion(element); // 处理h1,h2...标题元素
  preTitleConversion(element); // 处理代码块元素
  return null;
};

/**
 * 复选框样式美化
 * @param element 元素
 */
export const checkboxBeautification = function (element: HTMLElement): void {
  const classes = element.classList;
  const tagName = element.tagName.toLowerCase();
  if ("ul" != tagName || classes == null || !classes.contains("contains-task-list")) {
    return;
  }
  element.addClass("task-list");
  element.removeClass("contains-task-list"); // 防止重复处理
  // 是复选框
  for (let child of Array.from(element.childNodes)) {
    // li
    if (child.nodeType == 3 && "\n" == (child as Text).data) {
      // 换行符不处理
      continue;
    }
    const input = child.childNodes[0] as HTMLElement; // input
    input.id = "xrz_" + checkBoxNumber++;
    const text = child.childNodes[1]; // text
    (text as Text).data = (text as Text).data.trim();
    const newElement = document.createElement("label");
    newElement.setAttribute("for", input.id);
    child.insertBefore(newElement, text);
    newElement.appendChild(text); // 顺序很重要，要先放前面，在把text放进去
  }
  cycleReset(element, 0, 0); // 这个元素重新处理,向前处理2位
};

/**
 * 还原del元素变成~
 * @param element 元素
 * @returns void
 */
export const restoreDelBeautification = function (element: HTMLElement): void {
  const tagName = element.tagName.toLowerCase();
  if ("del" != tagName) {
    return;
  }
  element.innerHTML = "~" + element.innerHTML + "~";
  const parentNode = element.parentNode;
  const restoreNode = element.childNodes[0]; // 要重新解析的节点
  for (let i = 0; i < element.childNodes.length; i++) {
    parentNode?.insertBefore(element.childNodes[i], element);
  }
  parentNode?.removeChild(element);
  cycleReset(restoreNode, null, 0); // 这个元素重新处理,向前处理2位
};

// 为 h 开头的标题补充超链接点击
export const hTitleConversion = function (element: HTMLElement): void {
  if (!["h1", "h2", "h3", "h4", "h5", "h6"].includes(element.localName)) {
    return;
  }
  if (element.querySelector(`a[href='#${element.id}']`) != null) {
    return;
  }
  // 如果不存在指定的点击超链接,就新增
  element.insertAdjacentHTML("afterbegin", `<a class="anchor" href="#${element.id}" data-pjax-state>#</a>`);
};

// 代码块特殊字符处理，类型一 <>字符处理
export const unescapeSwigTag = (str: string): string => str.replace(/&lt;/g, "<").replace(/&gt;/g, ">");
export const unescapeSwigTwoTag = (str: string): string => str.replace(/&nbsp;/g, " ");

// 入口：代码块 pre 标题元素 html 代码再转换，用于后期美化
export const preTitleConversion = function (element: Element): void {
  // 是不是pre ,内部第一个标签是不是code
  if (
    !["pre"].includes(element.localName) ||
    element.firstChild == null ||
    !["code"].includes((element.firstChild as Element).localName)
  ) {
    return;
  }

  // 重新解析的节点,跳过pre转换后的元素，不解析它
  let restoreNode = element;

  let code = element.firstChild as Element;
  let language = code.className.trim().substring(9) || "text";
  let text = unescapeSwigTwoTag(unescapeSwigTag(code.innerHTML));

  const { firstLine = 1, caption = "", mark = false, command = false } = getOptions("") as CodeBlockOptions;

  let langObject = (Prism.languages[language] || Prism.languages["text"]) as any;
  try {
    let codeHtml = Prism.highlight(text, langObject, language);
    const lines = codeHtml.split("\n");
    let content = "";
    for (let i = 0, len = lines.length; i < len; i++) {
      let line = lines[i];

      let lineno = Number(firstLine) + i;

      if (mark && Array.isArray(mark) && mark.includes(lineno)) {
        content += `<tr class="marked">`;
      } else {
        content += `<tr>`;
      }

      content += `<td data-num="${lineno}"></td>`;

      if (command) {
        content += `<td data-command="${command[lineno as keyof typeof command] || ""}"></td>`;
      }

      content += `<td><pre>${line}</pre></td></tr>`;
    }

    let result = `<figure class="highlight${language ? ` ${language}` : ""}">`;

    result += `<figcaption data-lang="${language ? language : ""}">${caption}</figcaption>`;

    result += `<table>${content}</table></figure>`;

    element.insertAdjacentHTML("afterend", result);
    restoreNode = element.nextSibling as HTMLElement;
    element.parentNode?.removeChild(element);
  } catch (e) {}
  // 当前这层下一个节点解析
  cycleReset(restoreNode, null, 1);
};

// 代码块处理
export function getOptions(info: string): CodeBlockOptions {
  const rFirstLine = /\s*first_line:(\d+)/i;
  const rMark = /\s*mark:([0-9,-]+)/i;
  const rCommand = /\s*command:\((\S[\S\s]*)\)/i;
  const rSubCommand = /"+([\S\s]*)"+(:([0-9,-]+))?/i;
  const rCaptionUrlTitle = /(\S[\S\s]*)\s+(https?:\/\/)([\S]+)\s+(.+)/i;
  const rCaptionUrl = /(\S[\S\s]*)\s+(https?:\/\/)([\S]+)/i;
  const rCaption = /(\S[\S\s]*)/;

  let first_line = 1;
  if (rFirstLine.test(info)) {
    info = info.replace(rFirstLine, (match, _first_line) => {
      first_line = parseInt(_first_line);
      return "";
    });
  }

  let mark: number[] | boolean = false;
  if (rMark.test(info)) {
    mark = [];
    info = info.replace(rMark, (match, _mark) => {
      mark = _mark.split(",").reduce((prev: number[], cur: string) => lineRange(prev, cur, false), mark as number[]);
      return "";
    });
  }

  let command: Record<number, string> | boolean = false;
  if (rCommand.test(info)) {
    command = {};
    info = info.replace(rCommand, (match, _command) => {
      _command.split("||").forEach((cmd: string) => {
        if (rSubCommand.test(cmd)) {
          const match = cmd.match(rSubCommand);

          if (match && match[1]) {
            command = match[3]
              .split(",")
              .reduce(
                (prev: Record<number, string>, cur: string): Record<number, string> =>
                  lineRange(prev, cur, match[1]) as Record<number, string>,
                command as Record<number, string>
              );
          } else if (match) {
            (command as Record<number, string>)[1] = match[1];
          }
        }
      });
      return "";
    });
  }

  let caption = "";
  if (rCaptionUrlTitle.test(info)) {
    const match = info.match(rCaptionUrlTitle);
    if (match) {
      caption = `<span>${match[1]}</span><a href="${match[2]}${match[3]}">${match[4]}</a>`;
    }
  } else if (rCaptionUrl.test(info)) {
    const match = info.match(rCaptionUrl);
    if (match) {
      caption = `<span>${match[1]}</span><a href="${match[2]}${match[3]}">${match[3]}</a>`;
    }
  } else if (rCaption.test(info)) {
    const match = info.match(rCaption);
    if (match) {
      caption = `<span>${match[1]}</span>`;
    }
  }

  return { firstLine: first_line, caption, mark, command };
}

// 行范围处理
function lineRange(
  prev: number[] | Record<number, string>,
  cur: string,
  value: string | boolean
): number[] | Record<number, string> {
  const rRange = /(.+?)(?:-(.+))?/;
  if (rRange.test(cur)) {
    const match = cur.match(rRange);
    if (!match) return prev;

    const start = parseInt(match[1]);
    const end = match[2] ? parseInt(match[2]) : start;

    if (Array.isArray(prev)) {
      for (let i = start; i <= end; i++) {
        prev.push(i);
      }
    } else if (typeof value === "string") {
      for (let i = start; i <= end; i++) {
        prev[i] = value;
      }
    }
  }

  return prev;
}
