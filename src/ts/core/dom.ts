import { DOMUtils, ElementPosition } from "../dto/domTypes";

const $ = function (selector: string, element?: Document | HTMLElement): HTMLElement | null {
  element = element || document;
  if (selector.indexOf("#") === 0) {
    return (element instanceof Document ? element : document).getElementById(selector.replace("#", "")) as HTMLElement;
  }
  return element.querySelector(selector) as HTMLElement | null;
} as DOMUtils;

$.all = function (selector: string, element?: Document | HTMLElement): NodeListOf<HTMLElement> {
  element = element || document;
  return element.querySelectorAll(selector) as NodeListOf<HTMLElement>;
};

$.each = function (
  selector: string,
  callback: (el: HTMLElement, index: number) => void,
  element?: Document | HTMLElement
): void {
  $.all(selector, element).forEach(callback);
};

// 定义扩展方法的接口
interface HTMLElementExtensions {
  createChild(tag: string, obj?: Record<string, any>, position?: ElementPosition): HTMLElement;
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

// 扩展 HTMLElement 的类型定义
declare global {
  interface HTMLElement extends HTMLElementExtensions {}
}

// 实现扩展方法
const elementProto: HTMLElementExtensions = {
  createChild(this: HTMLElement, tag: string, obj?: Record<string, any>, position?: ElementPosition): HTMLElement {
    const child = document.createElement(tag);
    if (obj) {
      Object.assign(child, obj);
    }

    switch (position) {
      case "after":
        this.insertAfter(child);
        break;
      case "replace":
        this.innerHTML = "";
      default:
        this.appendChild(child);
    }
    return child;
  },

  wrap(this: HTMLElement, obj: Record<string, any>): void {
    const box = document.createElement("div");
    Object.assign(box, obj);
    this.parentNode?.insertBefore(box, this);
    this.parentNode?.removeChild(this);
    box.appendChild(this);
  },

  height(this: HTMLElement, h?: number | string): number {
    if (h !== undefined) {
      this.style.height = typeof h === "number" ? h + "rem" : h;
    }
    return this.getBoundingClientRect().height;
  },

  width(this: HTMLElement, w?: number | string): number {
    if (w !== undefined) {
      this.style.width = typeof w === "number" ? w + "rem" : w;
    }
    return this.getBoundingClientRect().width;
  },

  top(this: HTMLElement): number {
    return this.getBoundingClientRect().top;
  },

  left(this: HTMLElement): number {
    return this.getBoundingClientRect().left;
  },

  attr(this: HTMLElement, type: string, value?: string | null): string | null | HTMLElement {
    if (value === null) {
      this.removeAttribute(type);
      return this;
    }

    if (value !== undefined) {
      this.setAttribute(type, value);
      return this;
    } else {
      return this.getAttribute(type);
    }
  },

  insertAfter(this: HTMLElement, element: HTMLElement): void {
    const parent = this.parentNode;
    if (!parent) return;

    if (parent.lastChild === this) {
      parent.appendChild(element);
    } else {
      parent.insertBefore(element, this.nextSibling);
    }
  },

  display(this: HTMLElement, d?: string): string | HTMLElement {
    if (d === undefined) {
      return this.style.display;
    } else {
      this.style.display = d;
      return this;
    }
  },

  child(this: HTMLElement, selector: string): HTMLElement | null {
    return $(selector, this);
  },

  find(this: HTMLElement, selector: string): NodeListOf<HTMLElement> {
    return $.all(selector, this);
  },

  _class(this: HTMLElement, type: "add" | "remove" | "toggle", className: string, display?: boolean): void {
    const classNames = className.indexOf(" ") > -1 ? className.split(" ") : [className];
    const that = this;
    classNames.forEach(function (name: string) {
      if (type === "toggle") {
        that.classList.toggle(name, display);
      } else {
        that.classList[type](name);
      }
    });
  },

  addClass(this: HTMLElement, className: string): HTMLElement {
    this._class("add", className);
    return this;
  },

  removeClass(this: HTMLElement, className: string): HTMLElement {
    this._class("remove", className);
    return this;
  },

  toggleClass(this: HTMLElement, className: string, display?: boolean): HTMLElement {
    this._class("toggle", className, display);
    return this;
  },

  hasClass(this: HTMLElement, className: string): boolean {
    return this.classList.contains(className);
  },
};

// 使用 Object.defineProperties 正确地扩展原型
Object.entries(elementProto).forEach(([key, descriptor]) => {
  if (!(key in HTMLElement.prototype)) {
    Object.defineProperty(HTMLElement.prototype, key, {
      value: descriptor,
      configurable: true,
      writable: true,
      enumerable: false,
    });
  }
});

export default $;
