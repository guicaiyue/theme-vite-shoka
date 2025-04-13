// DOM 选择器函数类型
export type SelectorFunction = (selector: string, element?: Document | HTMLElement) => HTMLElement | null;

// DOM 多选择器函数类型
export type SelectorAllFunction = (selector: string, element?: Document | HTMLElement) => NodeListOf<HTMLElement>;

// DOM 遍历函数类型
export type EachFunction = (
  selector: string,
  callback: (el: HTMLElement | HTMLScriptElement, index: number) => void,
  element?: Document | HTMLElement
) => void;

// DOM 工具函数集合
export interface DOMUtils {
  (selector: string, element?: Document | HTMLElement): HTMLElement | null;
  all: SelectorAllFunction;
  each: EachFunction;
}

// 元素位置枚举
export type ElementPosition = "after" | "replace" | "default";

// HTMLElement 扩展接口
declare global {
  interface HTMLElement {
    createChild(tag: string, obj?: Record<string, any>, position?: ElementPosition): HTMLElement | HTMLTextAreaElement;
    wrap(obj: Record<string, any>): void;
    height(h?: number | string): number;
    width(w?: number | string): number;
    top(): number;
    left(): number;
    attr(type: string, value?: string | null): string | null | HTMLElement;
    insertAfter(element: HTMLElement): void;
    display(d?: string): string | HTMLElement;
    child(selector: string): HTMLElement | null;
    find(selector: string): NodeListOf<HTMLElement>;
    _class(type: "add" | "remove" | "toggle", className: string, display?: boolean): void;
    addClass(className: string): HTMLElement;
    removeClass(className: string): HTMLElement;
    toggleClass(className: string, display?: boolean): HTMLElement;
    hasClass(className: string): boolean;
  }
}
