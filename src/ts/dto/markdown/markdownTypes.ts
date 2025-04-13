// 用于代码块处理的选项
export interface CodeBlockOptions {
  firstLine?: number;
  caption?: string;
  mark?: number[] | boolean;
  command?: Record<number, string> | boolean;
}

// 用于折叠块处理的选项
export interface FoldingBeautificationOptions {
  className: string;
  title: string;
}

// 用于标签卡处理的选项
export interface TabBeautificationOptions {
  id: string;
  title: string;
}

// 用于提醒块处理的选项
export interface RemindBeautificationOptions {
  className: string;
  hideIcon: boolean;
}

// JSON黑块处理的接口
export interface JsonBlockItem {
  blackType: string;
  [key: string]: string;
}

// 链接块的接口
export interface LinksBlockItem extends JsonBlockItem {
  owner: string;
  site: string;
  url: string;
  image: string;
  color: string;
  desc: string;
  exturl: string;
  extinfo: string;
}

export const removeElement = function <T extends Node>(element: T | undefined | null) {
  element?.parentNode?.removeChild(element);
};
