import { JsonBlockItem, LinksBlockItem } from "../dto/markdown/markdownTypes";

/**
 * json 块美化
 * @param nodeText 文本节点
 */
export const jsonBlackBeautification = function (nodeText: Text): void {
  const text = nodeText.textContent || "";
  if (!text.startsWith("blackType:")) {
    return; // 如果不是这个开头就不管
  }
  // 组装出 json
  const tagName = (nodeText.parentNode as HTMLElement).tagName.toLowerCase();
  const parentNode = "p" == tagName ? nodeText.parentNode : nodeText; // 如果父元素不是 p 元素就返回自身
  const liParentNode = parentNode?.parentNode as HTMLElement; // li 元素
  const arrList: JsonBlockItem[] = [];
  let currentNode: HTMLElement | null = liParentNode;

  while (currentNode) {
    const hands = currentNode.innerText.split("\n").filter((hand) => hand != null && hand !== "");
    const json = hands.reduce((result: Record<string, string>, hand: string) => {
      const [key, value] = hand.split(": ").map((item) => item.trim());
      result[key] = value;
      return result;
    }, {} as Record<string, string>);
    arrList.push(json as JsonBlockItem);
    currentNode = currentNode.nextElementSibling as HTMLElement | null; // 下一个 li
  }

  const ulParentNode = parentNode?.parentNode?.parentNode as HTMLElement; // ul层了
  let newElement: HTMLElement | null = null;
  let marking = "";

  for (const item of arrList) {
    switch (item["blackType"]) {
      case "links":
        if (marking == "links") {
          if (newElement) {
            newElement.innerHTML += jsonLinksBlack(item as LinksBlockItem);
          }
          break;
        }
        if (marking != "" && marking != "links") {
          ulParentNode.parentNode?.insertBefore(newElement as Node, ulParentNode); //放进去
        }
        newElement = document.createElement("div") as HTMLElement;
        newElement.addClass("links");
        newElement.innerHTML += jsonLinksBlack(item as LinksBlockItem);
        marking = "links";
        break;
    }
  }

  if (newElement && newElement.innerHTML != null && newElement.innerHTML != "") {
    ulParentNode.parentNode?.insertBefore(newElement as Node, ulParentNode);
  }
  ulParentNode.parentNode?.removeChild(ulParentNode);
  throw "节点已变动影响数 1 0"; // 发起重新处理,向前处理1位,回到最上一层
};

/**
 * 小伙伴,块美化
 * @param item 链接块项
 */
export const jsonLinksBlack = function (item: LinksBlockItem): string {
  let extendedHtml = ``;
  if (item.exturl != null && item.exturl != "" && item.extinfo != null && item.extinfo != "") {
    extendedHtml = `<div class="extended"><a href="${item.exturl}" target="_blank" class="title">${item.extinfo}</a></div>`;
  }
  return `<div class="item" title="${item.owner || item.site}" style="--block-color:${item.color};"><a href="${
    item.url
  }" class="image" data-background-image="${item.image}"></a><div class="info"><a href="${
    item.url
  }" target="_blank" class="title">${item.site}</a><p class="desc">${
    item.desc || item.url
  }</p></div>${extendedHtml}</div>`;
};
