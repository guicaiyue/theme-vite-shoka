import { cycleReset, clearBr, clearGoalOrFater, virtuallyHtml } from "./assemble";
import { pageScroll } from "../core/utils";

/**
 * 自定义美化，折叠块美化
 * 例子：
 * +++class 标题
 * 123
 * +++
 * 目前已有的class info,颜色
 * @param nodeText 文本节点
 */
export const definitionFoldingBeautification = function (nodeText: Text): void {
  const text = nodeText.data.trim();
  if (!text.startsWith("++")) {
    return;
  }
  const childText = text.substring(3); // 去掉前面的+++
  const oneClass = childText.substr(0, childText.indexOf(" ")); // 这个抽屉颜色样式,没有是''
  const oneTitle = childText.substring(oneClass.length).trim(); // 抽屉的标题
  if (oneTitle == null || oneTitle == "") {
    return; //标题为空就不搞了
  }

  const newElement = document.createElement("details") as HTMLElement;
  newElement.addClass(oneClass != "" ? oneClass : "info"); // 添加样式,没有就默认
  newElement.innerHTML = `<summary>${oneTitle}</summary>`; // 添加标题
  // 查找要放到抽屉的某个层级内容
  const divElement = document.createElement("div") as HTMLElement;
  newElement.appendChild(divElement); //抽屉内容
  loopEvent(nodeText.nextSibling as HTMLElement, nodeText.parentNode as HTMLElement, divElement, "+++");
  insetNewElement(nodeText, newElement, false); // 新元素插入
  clearBr(divElement);
  cycleReset(newElement, 0, 0);
};

/**
 * 自定义美化，选项卡美化
 * 例子：
 * ;;;id1 卡片1
 * 123
 * ;;;
 * 目前已有的class info,颜色
 * @param nodeText 文本节点
 */
export const definitionTabBeautification = function (nodeText: Text): void {
  const text = nodeText.data.trim();
  if (!text.startsWith(";;;")) {
    return;
  }
  const parentNode = nodeText.parentNode as HTMLElement; // 获取父节点
  const childText = text.substring(3); // 去掉前面的+++
  const oneIds = childText.substr(0, childText.indexOf(" ")); // 这个抽屉颜色样式,没有是''
  const oneTitle = childText.substring(oneIds.length).trim(); // 这个卡片的tab标题
  if (oneTitle == null || oneTitle == "") {
    return; //标题为空就不搞了
  }
  let newElement = virtuallyHtml.getElementById(oneIds) as HTMLElement | null;
  let ifNew = false; // tab是否第一次生成
  if (newElement == null) {
    ifNew = true;
    newElement = document.createElement("div") as HTMLElement;
    newElement.addClass("tabs");
    newElement.id = oneIds;
    const defaultHtml = `<div class="show-btn"></div><div class="nav"><ul></ul></div>`;
    newElement.innerHTML = defaultHtml;
    parentNode.parentNode?.insertBefore(newElement, parentNode); //将这个抽屉元素放进去
    // 添加响应式事件1
    (newElement.child(".show-btn") as HTMLElement).addEventListener("click", function (event) {
      pageScroll(newElement as HTMLElement);
    });
    // 添加响应式事件
    newElement.querySelector(".nav ul")?.addEventListener("click", function (event) {
      const element = event.target as HTMLElement;
      const children = element.parentNode?.children || [];
      const tabList = newElement?.querySelectorAll(".tab") || [];
      const index = Array.prototype.indexOf.call(children, element);
      const lastElement = element.parentNode?.querySelector(".active") as HTMLElement;
      const lastIndex = Array.prototype.indexOf.call(children, lastElement); // 支持 lastElement=null
      if (index == lastIndex) {
        // 和上次点击相同
        return;
      }
      if (lastElement != null) {
        lastElement.removeClass("active");
        (tabList[lastIndex] as HTMLElement).removeClass("active");
      }
      element.addClass("active");
      (tabList[index] as HTMLElement).addClass("active");
    });
  }
  const ulElement = newElement.querySelector(".nav ul");
  if (ulElement) {
    ulElement.innerHTML = ulElement.innerHTML + `<li class="">${oneTitle}</li>`;
  }
  const tab = document.createElement("div") as HTMLElement;
  tab.addClass("tab");
  tab.setAttribute("data-id", oneIds);
  tab.setAttribute("data-title", oneTitle);
  tab.setAttribute("data-ready", "true");
  newElement.appendChild(tab);

  // 循环查找要放到文本的内容
  loopEvent(nodeText.nextSibling as HTMLElement, nodeText.parentNode as HTMLElement, tab, ";;;");
  if (ifNew) {
    insetNewElement(nodeText, newElement, false); // 新元素插入
  } else {
    clearGoalOrFater(nodeText as unknown as HTMLElement, true);
  }
  clearBr(tab);

  // 默认打开第一个
  (newElement.querySelector(".tab") as HTMLElement)?.addClass("active");
  (newElement.querySelector(".nav ul li") as HTMLElement)?.addClass("active");

  cycleReset(newElement, 0, 0);
};

/**
 * 自定义美化，提醒块美化
 * 例子：
 * :::样式名 no-icon(有这个代表没有图标)
 * 文本内容
 * :::
 * 目前已有的default primary info success warning danger danger no-icon颜色
 * @param nodeText 文本节点
 */
export const remindBeautification = function (nodeText: Text): void {
  const text = nodeText.data.trim();
  if (!text.startsWith(":::")) {
    return;
  }
  const childText = text.substring(3) + " "; // 去掉前面的:::
  const oneClass = childText.substring(0, childText.indexOf(" ")); // 这个颜色是图标,没有就设置默认 default
  const twoClass = childText.substring(oneClass.length).trim(); // 这个隐藏图标的样式

  const newElement = document.createElement("div") as HTMLElement;
  newElement.addClass("note");
  newElement.addClass(oneClass != "" ? oneClass : "default"); // 添加样式,没有就默认
  if (twoClass != "") {
    newElement.addClass(twoClass); // 是否隐藏样式
  }
  // 循环查找要放到文本的内容
  loopEvent(nodeText.nextSibling as HTMLElement, nodeText.parentNode as HTMLElement, newElement, ":::");
  insetNewElement(nodeText, newElement, false); // 新元素插入
  clearBr(newElement);
  cycleReset(newElement, 0, 0);
};

/**
 * 循环处理模块元素
 * @param nextSibling 下一个要处理的元素
 * @param faterElement 父级元素
 * @param containerElement 新的容器
 * @param endStr 结束字符，如：+++、:::
 * @returns void
 */
export function loopEvent(
  nextSibling: HTMLElement | null,
  faterElement: HTMLElement,
  containerElement: HTMLElement,
  endStr: string
): void {
  if (nextSibling == null) {
    // 没有下一个元素，找父级元素的下一个
    if (faterElement != null) {
      // 有父级
      loopEvent(
        faterElement.nextSibling as HTMLElement,
        faterElement.parentNode as HTMLElement,
        containerElement,
        endStr
      );
    }
    return;
  }
  // 预先获取下一个元素， 防止元素之后移动到其它节点导致无法获取下一个元素
  const preElement = nextSibling.nextSibling;
  if (nextSibling.textContent?.indexOf(endStr) != -1) {
    // 存在
    if (nextSibling.textContent?.trim() == endStr) {
      // 结束：直接存在
      //element?.remove();
      nextSibling?.remove();
    } else {
      // 说明是复杂的元素
      const firstChild = nextSibling.firstChild as HTMLElement;
      const cloneSibling = nextSibling.cloneNode(false); // 浅克隆
      containerElement.appendChild(cloneSibling);
      loopEvent(firstChild, nextSibling as HTMLElement, cloneSibling as HTMLElement, endStr);
      clearBr(cloneSibling as HTMLElement);
      clearBr(nextSibling as HTMLElement); //清理下内部的br元素
      if (nextSibling.firstChild == null) {
        nextSibling.remove(); //如果内部元素全部转换了，则移除
      }
    }
  } else {
    // 不存在继续向下找
    containerElement.appendChild(nextSibling);
    // 因为 nextSibling 被移动到虚拟节点里去了
    loopEvent(preElement as HTMLElement, faterElement, containerElement, endStr);
  }
}

/**
 * 新元素替换转换的元素
 * @param TransitionElement 转换元素
 * @param newElement 新元素
 * @param flag 是否强制转换元素与新元素平级,true是的
 */
export function insetNewElement(TransitionElement: Node, newElement: HTMLElement, flag: boolean): void {
  const parentNode = TransitionElement.parentNode as HTMLElement; // 获取父节点
  clearBr(parentNode); //清理转换元素父元素前后
  if (parentNode.childNodes.length == 1 && !flag) {
    // 只有这个元素本身，那转换元素父元素与新元素平级
    parentNode.parentNode?.insertBefore(newElement, parentNode); //将转换后新元素放进去
    newElement.parentNode?.removeChild(parentNode); // 原来的父节点删除
  } else {
    // 还有其它元素，那转换元素与新元素平级
    parentNode.insertBefore(newElement, TransitionElement); //将转换后新元素放进去
    parentNode.removeChild(TransitionElement); // 原来的转换元素删除
  }
}
