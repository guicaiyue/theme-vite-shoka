import { fetchUtil, localStorageUtil } from "../core/utils";
import { removeElement } from "../dto/markdown/markdownTypes";
import { primaryElement } from "./elementHandler";
import { primaryText } from "./textHandler";

// 虚拟 demo 节点
export let virtuallyHtml: DocumentFragment = document.createDocumentFragment();
// 当前循环层
let layer: number = 0;

// markdown 整体美化
export const markdownAssemble = function (): void {
  const primitiveMd = document.querySelector(".body.md");
  if (!primitiveMd) return;

  const mainMd: Node = primitiveMd.cloneNode(true);
  virtuallyHtml.appendChild(mainMd);
  transferShadowRoot(primitiveMd, mainMd);
  creatNewHtml(mainMd, 0);
  primitiveMd.parentNode?.insertBefore(mainMd, primitiveMd);
  mainMd.parentNode?.removeChild(primitiveMd);
};

/**
 * 迁移原来影子DOM元素
 */
export const transferShadowRoot = function (old: Node, now: Node): void {
  const childs = old.childNodes; // 仅获取第一层的子元素
  const childsLength = old.childNodes.length; // 节点长度、可能会存在变化
  for (let index = 0; index < childsLength; index++) {
    const child = childs.item(index) as Element;
    if (child.shadowRoot) {
      // 存在影子DOM元素
      const temp = now.childNodes.item(index).cloneNode(true); // 备份出一个新的
      old.replaceChild(temp, child); // 用备份节点替换新的
      now.replaceChild(child, now.childNodes.item(index)); // 再把新节点替换自己的
      continue; // 下一个循环
    }
    switch (child.nodeType) {
      case 1:
        // 子元素深度处理
        transferShadowRoot(child as Node, now.childNodes.item(index) as Node);
        break;
    }
  }
};

/**
 * 遍历处理元素
 * @param element 元素
 * @param layer 当前层级别
 */
export const creatNewHtml = function (element: Node, layer: number): void {
  let childs = element.childNodes; // 仅获取第一层的子元素
  let childsLength = element.childNodes.length; // 节点长度、可能会存在变化
  for (let index = 0; index < childsLength; index++) {
    // 为空就不会循环,存在调整index值可能
    const child = childs.item(index);
    try {
      if (child == null) {
        continue;
      }
      switch (child.nodeType) {
        case 1:
          // 元素节点
          // 对当前元素处理
          primaryElement(child as HTMLElement);
          // 对子子元素继续深度处理
          creatNewHtml(child, layer + 1);
          break;
        case 3:
          // 文本节点
          primaryText(child as Text);
          break;
        default:
        // 默认不处理
      }
    } catch (err) {
      if (typeof err === "string" && err.startsWith("节点已变动影响数")) {
        const errList = err.split(" ");
        if (errList.length == 3 && layer > parseInt(errList[2])) {
          // 如果当前层大于预期层，说明当前在更加深处
          // 不是这一层递归
          const error = errList[1] + " " + errList[2]; // 减去后为0说明就是上一层
          throw errList[0] + " " + error;
        }
        index = parseInt(errList[1]);
        childs = element.childNodes; // 重新更新节点信息
        childsLength = element.childNodes.length; // 重新更新节点的长度
        continue;
      }
      console.log(child);
      throw err;
    }
  }
};

/**
 * 循环重置
 * @param element 元素
 * @param layer 层，最高为0层,md下面层处理要传2
 * @param offset 值，默认是0,指定元素开始重新解析，大于则跳过指定数量元素再解析，小于则从前面指定数量元素前重新解析
 */
export const cycleReset = function (element: Node, layer: number | null, offset: number | null): never {
  let cycleIndex = -1;
  cycleIndex = Array.prototype.indexOf.call(element.parentNode?.childNodes || [], element) - 1;
  let templayer = -2; // null 下面是一层、虚拟节点下面是一层；所以要先减 2
  let tempElement = element.parentNode;
  while (tempElement != null) {
    // 循环退出则代表，layer为空，或者layer大于templayer，直接使用了当前元素所在层级
    templayer += 1;
    if (layer != null && layer == templayer) {
      // 相等了说明层级和预期层级一至，去预期层级的父元素下标
      cycleIndex = Array.prototype.indexOf.call(element.parentNode?.childNodes || [], element) - 1;
      break; // 已经到达预期的层级，找个这个层级对应的父元素了
    }
    tempElement = tempElement.parentNode;
  }
  layer = templayer;
  if (offset != null) {
    cycleIndex = cycleIndex + parseInt(offset.toString());
  }
  throw `节点已变动影响数 ${cycleIndex} ${layer}`; // 发起重新处理,向前处理1位
};

// 文章底部工具栏事件处理:点赞
export const footerUtilEvent = function (): void {
  const postFooterUtil = document.getElementById("post-footer-util");
  if (postFooterUtil == null) {
    return;
  }
  const plural = postFooterUtil.getAttribute("data-plural");
  // 点赞
  const uLike = postFooterUtil.querySelector(".u-like") as HTMLElement;
  if (uLike != null) {
    const postName = uLike.getAttribute("data-post-name");
    // 缓存里取出是否已经点击过了
    const exist = localStorageUtil.concatArrayData("likePostNames", postName);
    if (exist) {
      // 已经点过赞了直接加样式
      uLike.classList.add("u-like-click");
    } else {
      // 在这里编写点击事件触发时要执行的代码
      uLike.onclick = function (): void {
        uLike.classList.add("u-like-click");
        fetchUtil.post("/apis/api.halo.run/v1alpha1/trackers/upvote", {
          group: "content.halo.run",
          plural: plural,
          name: postName,
        });
        // 更新数字 + 1
        const span = uLike.querySelector("span");
        if (span) {
          span.innerText = (parseInt(span.innerText) + 1).toString();
        }
        // 写入缓存
        localStorageUtil.addArrayData("likePostNames", postName);
        // 移除点击事件
        uLike.onclick = function (): void {};
      };
    }
  }
};

/**
 * 元素的子元素第一个或者最后一个为br、空字符、\n字符时，移除
 * @param element 元素
 */
export const clearBr = (element: Node | null): void => {
  if (element == null) {
    return;
  }
  if (
    element.firstChild != null &&
    ((element.firstChild as Element).localName == "br" || element.firstChild.textContent?.trim() == "")
  ) {
    element.firstChild.remove();
  }
  if (
    element.lastChild != null &&
    ((element.lastChild as Element).localName == "br" || element.lastChild.textContent?.trim() == "")
  ) {
    element.lastChild.remove();
  }
};

/**
 * 清除目标元素，如果目标元素清除后，父元素下的字元素为空则一并清除，只做一层父级元素判断
 * @param element 目标元素
 * @param flagBr 是否清除br
 */
export const clearGoalOrFater = (element: Node | null, flagBr: boolean): void => {
  if (element == null) {
    return;
  }
  const parentNode = element.parentNode;
  removeElement(element);
  if (flagBr) {
    clearBr(parentNode);
  }
  if (parentNode != null && parentNode.firstChild == null) {
    removeElement(parentNode);
  }
};
