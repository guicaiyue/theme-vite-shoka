import { cycleReset } from "./assemble";
import { definitionFoldingBeautification, definitionTabBeautification, remindBeautification } from "./moduleHandler";
import { jsonBlackBeautification } from "./jsonBlackHandler";
import { removeElement } from "../dto/markdown/markdownTypes";

// 一级处理
export const primaryText = function (nodeText: Text): void {
  if (nodeText.data == null || nodeText.data == "") {
    return;
  }
  //const parentNode = nodeText.parentNode; // 获取父节点
  //const parentTag = (parentNode as ElementNode).tagName.toLowerCase();
  AllBracketText(nodeText); // 美化处理文本前后包裹字符串规则
  curlyBracesText(nodeText); // 特殊美化处理 {} 包裹字符串规则
  definitionFoldingBeautification(nodeText); // 根据文本内容渲染抽屉
  definitionTabBeautification(nodeText); // 根据文本内容渲染标签卡
  remindBeautification(nodeText); //根据文本内容渲染提醒卡
  jsonBlackBeautification(nodeText); // 指定字符转JSON，美化成块
};

/**
 * 普通文本美化
 * @param nodeText 文本节点
 */
export const AllBracketText = function (nodeText: Text): Text {
  const dataText = nodeText.data.trim();
  if (dataText == null || dataText == "" || dataText == "\n") {
    return nodeText;
  }
  // 美化
  let htmlFragment = allBracketText(dataText);
  // 没有变化不处理
  if (htmlFragment == dataText) {
    return nodeText;
  }
  const nextSiblingNode = nodeText.nextSibling as Element;
  // 有变化就向下找
  while (nextSiblingNode != null && (nextSiblingNode.tagName?.toLowerCase() == "br" || nextSiblingNode.nodeType == 3)) {
    // 如果下一个元素是 br 或者是文本节点就直接美化减少循环
    if (nextSiblingNode.localName == "br") {
      htmlFragment += "<br>";
    } else {
      const childDataText = nextSiblingNode.textContent?.trim();
      if (childDataText == null || childDataText == "" || childDataText == "\n") {
        htmlFragment += childDataText;
      } else {
        // 美化下一个节点
        htmlFragment = htmlFragment + allBracketText(childDataText);
      }
    }
    // 删掉下一个节点
    removeElement(nodeText.nextSibling);
  }
  const newElement = document.createElement("p");
  newElement.innerHTML = htmlFragment;
  const parentNode = nodeText.parentNode; // 获取父节点
  while (newElement.childNodes.length > 0) {
    parentNode?.insertBefore(newElement.childNodes[0], nodeText); //将所有节点移动节点前面
  }
  parentNode?.removeChild(nodeText); // 删除原来的文字节点
  if (parentNode) {
    cycleReset(parentNode, null, 0);
  }
  return nodeText;
};

/**
 * 美化处理 {} 字符串规则
 * {.one #two height=100}、空格分隔、.代表clss样式、#代表id、其他字符开头代表属性
 * {}使用存在以下处理
 * 1、<p>{.one #two height=100}</p>;这时要通过父级节点p，找p的同级别处理
 * 2、<p>123{.one #two height=100}123</p>;{}这时{}前面有文本时，就应该正常展示
 * 结论
 * 当节点内文本{}前面有文本时，或者文本节点时，{}不应该处理，要正常展示
 * 当节点内文本仅{}内容时，同节点应该为上级节点
 * 不存在前一个元素节点时，赋予在父节点
 * 存在前一个结点且节点不为<br>时且不为文本节点时，赋予在前一个节点，否则不处理
 * 存在前一个结点且节点为<br>再向上查找，直到非<br>节点，赋予在n重父节点上，也就是父节点的父节点...
 *
 * @param nodeText 文本节点
 */
export const curlyBracesText = function (nodeText: Text): void {
  const matches = nodeText.data.match(/\{([^}]+)\}/g);
  if (matches == null) {
    return;
  }
  const childText = nodeText.data.trim();
  let currentNode: Text | ParentNode | null = nodeText;
  let parentNode: Text | ParentNode | null | undefined = currentNode.parentNode; // 获取父节点
  let preNode: ChildNode | ParentNode | null | undefined = currentNode.previousSibling; //获取前一个节点
  nodeText.data = childText.replace(/\{([^}]+)\}/g, function (match, text) {
    if (text.trim() == "") {
      return "{" + text + "}"; // {} 括号内是空字符也不处理
    }
    if (parentNode?.childNodes.length == 1 && childText == "{" + text + "}") {
      // 说明下面只有它一个节点，且内容就是{xx}
      currentNode = nodeText.parentNode;
      preNode = currentNode?.previousSibling; //升级获取前一个节点
      parentNode = currentNode?.parentNode; // 升级父节点
    }
    if (preNode != null && preNode.textContent == "\n") {
      parentNode?.removeChild(preNode);
      preNode = currentNode?.previousSibling; //升级获取前一个节点
    }

    if (!childText.startsWith("{" + text + "}") || (preNode != null && preNode.nodeType == 3)) {
      // 不是以这开头，或者前一个节点是文本，则不处理
      return "{" + text + "}";
    }

    if (preNode == null) {
      preNode = parentNode;
    } else {
      //这是元素节点
      let cycleSum = 0;
      while (preNode != null && (preNode as Element).localName == "br") {
        // 前一个节点不为null并且还是br元素
        cycleSum += 1;
        preNode = preNode.previousSibling; // 获取它前面的元素
        removeElement(preNode?.nextSibling); // 删掉它后面的已确定的br元素
      }
      // 如果为 0 就用这个元素，不为0就不停的去找父元素
      while (cycleSum > 0) {
        cycleSum -= 1;
        if (preNode?.parentNode != null) {
          preNode = preNode.parentNode;
        }
      }
    }
    if (preNode == null || preNode.nodeType == 3) {
      return "{" + text + "}"; //最终使用原字符
    }
    const arrList = text.split(" ");
    for (let index = 0; index < arrList.length; index++) {
      const childText = arrList[index];
      if (["%"].includes(childText)) {
        // 特殊字符不处理
        continue;
      }
      if (childText.startsWith(".")) {
        // 加到class
        (preNode as Element).classList.add(childText.substr(1));
      } else if (childText.startsWith("#")) {
        // 加到id
        (preNode as Element).id = childText.substr(1);
      } else {
        // 加到属性上
        const attribute = childText.split("=");
        (preNode as Element).setAttribute(attribute[0], attribute[1]);
      }
    }
    return ""; //最终替换为空字符
  });
  // 如果最后整个字符为空字符了，就删掉这个节点返回前一个节点
  if (nodeText.data.trim() == "") {
    (parentNode as Element).removeChild(currentNode); // 删除这个当前节点
    cycleReset(preNode as Node, null, 0); // 被赋予样式变动的元素要重置
  }
  return;
};

/**
 * 所有文本规则一起处理
 * @param dataText 文本内容
 */
export const allBracketText = function (dataText: string): string {
  let htmlFragment = SquareBracketText(dataText);
  htmlFragment = spoilerBeautification(htmlFragment);
  htmlFragment = underlineBeautification(htmlFragment);
  htmlFragment = middleLineBeautification(htmlFragment);
  htmlFragment = equalSignBeautification(htmlFragment);
  htmlFragment = subBeautification(htmlFragment);
  htmlFragment = supBeautification(htmlFragment);
  return htmlFragment;
};

/**
 * 美化处理 [] 字符串规则
 * 将[xx]包裹的字符、换成 <span class="label">xx</span>
 * 新修改：后面必须携带{}
 * @param dataText 文本内容
 */
export const SquareBracketText = function (dataText: string): string {
  const matches = dataText.match(/\[([^\]]+)\]\{/g);
  if (matches == null) {
    return dataText;
  }
  return dataText.replace(/\[([^\]]+)\]/g, function (match, text) {
    return `<span>${text}</span>`; //已去掉首尾的[]
  });
};

/**
 * 美化处理 !!到！！ 字符串规则
 * 例子：
 * !!黑幕黑幕黑幕黑幕黑幕黑幕！！： 鼠标滑过显示内容
 * !!模糊模糊模糊模糊模糊模糊！！{.bulr} ： 选中文字显示内容
 * @param dataText 文本内容
 */
export const spoilerBeautification = function (dataText: string): string {
  const matches = dataText.match(/\!\!([^\！]+)\！\！/g);
  if (matches == null) {
    return dataText;
  }
  return dataText.replace(/\!\!([^\！]+)\！\！/g, function (match, text) {
    return `<span class="spoiler" title="你知道得太多了">${text}</span>`; //已去掉首!!尾的！！
  });
};

/**
 * 美化处理 ++到++ 字符串规则
 * 例子：
 * ++下划线下划线下划线下划线++： 下划线
 * @param dataText 文本内容
 */
export const underlineBeautification = function (dataText: string): string {
  const matches = dataText.match(/\+\+([^\+]+)\+\+/g);
  if (matches == null) {
    return dataText;
  }
  return dataText.replace(/\+\+([^\+]+)\+\+/g, function (match, text) {
    return `<span class="underline">${text}</span>`; //已去掉首++尾的++
  });
};

/**
 * 美化处理 ~~到~~ 字符串规则
 * 例子：
 * ~~中划线中划线中划线中划线~~： 中划线
 * @param dataText 文本内容
 */
export const middleLineBeautification = function (dataText: string): string {
  const matches = dataText.match(/\~\~([^\~]+)\~\~/g);
  if (matches == null) {
    return dataText;
  }
  return dataText.replace(/\~\~([^\~]+)\~\~/g, function (match, text) {
    return `<span class="line-through">${text}</span>`; //已去掉首~~尾的~~
  });
};

/**
 * 美化处理 ==到== 字符串规则
 * 例子：
 * ==标记标记标记标记标记标记==： 标记
 * @param dataText 文本内容
 */
export const equalSignBeautification = function (dataText: string): string {
  const matches = dataText.match(/\=\=([^\=]+)\=\=/g);
  if (matches == null) {
    return dataText;
  }
  return dataText.replace(/\=\=([^\=]+)\=\=/g, function (match, text) {
    return `<span class="mark">${text}</span>`; //已去掉首==尾的==
  });
};

/**
 * 美化处理 ~到~ 字符串规则
 * 例子：
 * H~2~O： 水
 * @param dataText 文本内容
 */
export const subBeautification = function (dataText: string): string {
  const matches = dataText.match(/~([^~]+)~/g);
  if (matches == null) {
    return dataText;
  }
  return dataText.replace(/~([^~]+)~/g, function (match, text) {
    return `<sub>${text}</sub>`; //已去掉首~尾的~
  });
};

/**
 * 美化处理 ^到^ 字符串规则
 * 例子：
 * 2^10^=1024： 2的10次方
 * @param dataText 文本内容
 */
export const supBeautification = function (dataText: string): string {
  const matches = dataText.match(/\^([^\^]+)\^/g);
  if (matches == null) {
    return dataText;
  }
  return dataText.replace(/\^([^\^]+)\^/g, function (match, text) {
    return `<sup>${text}</sup>`; //已去掉首^尾的^
  });
};
