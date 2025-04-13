import { StrArrMap } from "../dto/baseTypes";
import {
  Callback,
  TransitionOptions,
  Store,
  LocalStorageUtil,
  FetchUtil,
  HeadersHandle,
  OptionsHandle,
  HeadersContentType,
} from "../dto/utilsTypes";
import { Config, LocalConfig } from "../dto/configTypes";
import anime from "animejs";
import { getSiteNavHeight } from "../global";

declare const CONFIG: Config;
declare const LOCAL: LocalConfig;
declare const statics: string;
const headersContentType: HeadersContentType = {
  urlParams: "urlParams", // 这个是url后拼接参数的转换
  json: "application/json;charset=UTF-8",
  "x-www-form-urlencoded": "application/x-www-form-urlencoded",
  "form-data": "application/multipart/form-data",
  "text/plain": "application/text/plain",
};

const getRndInteger = function (min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getDocHeight = function (): number {
  return (document.querySelector("main > .inner") as HTMLElement).offsetHeight;
};

const getScript = function (url: string, callback: Callback, condition: boolean): void {
  if (condition) {
    callback();
  } else {
    const script = document.createElement("script") as HTMLScriptElement;
    script.src = url;
    script.async = true;
    const cleanup = () => {
      script.onload = null;
      script.onerror = null;
      script.remove();
    };
    script.onload = () => {
      cleanup();
      callback();
    };
    script.onerror = (error) => {
      cleanup();
      console.error(`Failed to load script: ${url}`, error);
    };
    document.head.appendChild(script);
  }
};

const assetUrl = function (asset: string, type: string): string {
  const str = CONFIG[asset][type];
  if (str.includes("npm") || str.includes("gh") || str.includes("combine")) return "//gcore.jsdelivr.net/" + str;

  if (str.includes("http")) return str;

  return statics + str;
};

const vendorJs = function (type: string, callback?: Callback, condition?: boolean): void {
  if (LOCAL[type]) {
    getScript(
      assetUrl("js", type),
      callback ||
        function () {
          window[type] = true;
        },
      condition || window[type]
    );
  }
};

const vendorCss = function (type: string, condition?: boolean): void {
  if (window[`css${type}`]) {
    return;
  }

  if (LOCAL[type]) {
    let linkElement = document.createElement("link");
    linkElement.rel = "stylesheet";
    linkElement.href = assetUrl("css", type);
    let referenceNode = document.querySelector("head > link");
    document.head.insertBefore(linkElement, referenceNode);
    window[`css${type}`] = true;
  }
};

const pjaxScript = function (element: HTMLScriptElement): void {
  const code = element.text || element.textContent || element.innerHTML || "";
  const parent = element.parentNode!;
  parent.removeChild(element);
  const script = document.createElement("script");
  if (element.id) {
    script.id = element.id;
  }
  if (element.className) {
    script.className = element.className;
  }
  if (element.type) {
    script.type = element.type;
  }
  if (element.src) {
    script.src = element.src;
    script.async = false;
  }
  if (element.dataset.pjax !== undefined) {
    script.dataset.pjax = "";
  }
  if (code !== "") {
    script.appendChild(document.createTextNode(code));
  }
  parent.appendChild(script);
};

const pageScroll = function (target: HTMLElement, offset?: number | null, complete?: Callback): void {
  const opt: TransitionOptions = {
    targets: document.scrollingElement ? document.scrollingElement : document,
    duration: 500,
    easing: "easeInOutQuad",
    scrollTop:
      offset ||
      (typeof target === "number"
        ? target
        : target
        ? target.getBoundingClientRect().top + window.scrollY - getSiteNavHeight()
        : 0),
    complete: function () {
      complete && complete();
    },
  };
  anime(opt);
};

const transition = function (target: HTMLElement, type: any, complete?: Callback): void {
  let animation: any = {};
  let display = "none";
  switch (type) {
    case 0:
      animation = { opacity: [1, 0] };
      break;
    case 1:
      animation = { opacity: [0, 1] };
      display = "block";
      break;
    case "bounceUpIn":
      animation = {
        begin: function (anim: any) {
          target.style.display = "block";
        },
        translateY: [
          { value: -60, duration: 200 },
          { value: 10, duration: 200 },
          { value: -5, duration: 200 },
          { value: 0, duration: 200 },
        ],
        opacity: [0, 1],
      };
      display = "block";
      break;
    case "shrinkIn":
      animation = {
        begin: function (anim: any) {
          target.style.display = "block";
        },
        scale: [
          { value: 1.1, duration: 300 },
          { value: 1, duration: 200 },
        ],
        opacity: 1,
      };
      display = "block";
      break;
    case "slideRightIn":
      animation = {
        begin: function (anim: any) {
          target.style.display = "block";
        },
        translateX: [100, 0],
        opacity: [0, 1],
      };
      display = "block";
      break;
    case "slideRightOut":
      animation = {
        translateX: [0, 100],
        opacity: [1, 0],
      };
      break;
    default:
      animation = type;
      display = type.display;
      break;
  }
  anime(
    Object.assign(
      {
        targets: target,
        duration: 200,
        easing: "linear",
      },
      animation
    )
  ).finished.then(function () {
    target.style.display = display;
    complete && complete();
  });
};

const addEvent = function (element: Element | Window | null, eventName: string, handler: EventListener): void {
  if (element) {
    element.addEventListener(eventName, handler);
  }
};

const removeEvent = function (element: HTMLElement | null, eventName: string, handler: EventListener): void {
  if (element) {
    element.removeEventListener(eventName, handler);
  }
};

const store: Store = {
  get: function (item: string): string | null {
    return localStorage.getItem(item);
  },
  set: function (item: string, str: string): string {
    localStorage.setItem(item, str);
    return str;
  },
  del: function (item: string): void {
    localStorage.removeItem(item);
  },
};

const arraysUtil = {
  shuffle: function (arr: any[]): any[] {
    const len = arr.length;
    for (let i = 0; i < len - 1; i++) {
      const index = Math.floor(Math.random() * (len - i));
      const temp = arr[index];
      arr[index] = arr[len - i - 1];
      arr[len - i - 1] = temp;
    }
    return arr;
  },
};

const sleep = (timeout: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, timeout);
  });
};

const localStorageUtil: LocalStorageUtil = (function () {
  const encryption = (str: string): string | null => (str ? window.btoa(encodeURIComponent(str)) : null);
  const decrypt = (str: string): string | null => (str ? decodeURIComponent(window.atob(str)) : null);

  const updateStrData = (key: string, data: string): void => localStorage.setItem(key, encryption(data)!);
  const getStrData = (key: string): string | null => decrypt(localStorage.getItem(key)!);
  const delStrData = (key: string): void => localStorage.removeItem(key);

  const updateObjectData = (key: string, data: object): void => updateStrData(key, JSON.stringify(data));
  const getObjectData = (key: string): object | null => {
    const objectData = getStrData(key);
    return objectData ? JSON.parse(objectData) : null;
  };
  const delObjectData = (key: string): void => delStrData(key);

  const updateObjectKeyData = (key: string, objectKey: string, objectValue: any): void => {
    const oldData = getObjectData(key);
    const newDate = { [objectKey]: objectValue };
    updateObjectData(key, oldData ? { ...oldData, ...newDate } : newDate);
  };
  const getObjectKeyData = (key: string, objectKey: string): any => {
    const oldData = getObjectData(key);
    return oldData ? (oldData as Record<string, any>)[objectKey] : null;
  };
  const delObjectKeyData = (key: string, objectKey: string): void => {
    const oldData = getObjectData(key);
    if (oldData != null) {
      delete (oldData as Record<string, any>)[objectKey];
      updateObjectData(key, oldData);
    }
  };

  const updateArrayData = (key: string, data: any[]): void => updateStrData(key, JSON.stringify(data));
  const getArrayData = (key: string): any[] | null => {
    const arrayData = getStrData(key);
    return arrayData ? JSON.parse(arrayData) : null;
  };
  const delArrayData = (key: string): void => delStrData(key);

  const concatArrayData = (key: string, arrayValue: any): boolean => {
    const oldData = getArrayData(key);
    return oldData ? oldData.includes(arrayValue) : false;
  };
  const addArrayData = (key: string, arrayValue: any): void => {
    let oldData = getArrayData(key);
    oldData = oldData ? oldData : [];
    oldData.push(arrayValue);
    updateArrayData(key, oldData);
  };

  return {
    updateStrData,
    getStrData,
    delStrData,
    updateObjectData,
    getObjectData,
    delObjectData,
    updateObjectKeyData,
    getObjectKeyData,
    delObjectKeyData,
    updateArrayData,
    getArrayData,
    delArrayData,
    concatArrayData,
    addArrayData,
  };
})();

// 创建一个工具类
export class Utils {
  private static instance: Utils;
  private urlHost: string;
  private urlPath: string;
  private urlSearch: string;
  private urlHash: string;

  private constructor() {
    // 延迟初始化，等待 CONFIG 可用
    this.urlHost = "";
    this.urlPath = "";
    this.urlSearch = "";
    this.urlHash = "";
  }

  public static getInstance(): Utils {
    if (!Utils.instance) {
      Utils.instance = new Utils();
    }
    return Utils.instance;
  }

  public init(): void {
    if (!window.CONFIG) {
      console.warn("CONFIG not initialized yet, waiting...");
      return;
    }

    this.urlHost = window.CONFIG.hostname;
    this.urlPath = window.location.pathname;
    this.urlSearch = window.location.search;
    this.urlHash = window.location.hash;
  }

  // ... rest of the methods ...
}

// 导出单例实例
export const utils = Utils.getInstance();

export const fetchUtil: FetchUtil = (function () {
  let urlHost = window.CONFIG?.hostname || "";
  let defaultHeaders = {
    "Content-Type": headersContentType["json"],
  };

  let defaultOptions = {
    credentials: "include",
    mode: "cors",
    redirect: "follow",
  };

  // 请求头处理
  const headersHandle: HeadersHandle = {
    get: () => ({ ...defaultHeaders }),
    merge: (headers) => ({ ...defaultHeaders, ...headers }),
    insert: (headers) => {
      defaultHeaders = { ...defaultHeaders, ...headers };
    },
    delete: (headers, key) => delete headers[key],
    update: (headers) => {
      defaultHeaders = { ...defaultHeaders, ...headers };
    },
  };

  // fetch options 参数处理
  const optionsHandle: OptionsHandle = {
    get: () => ({ ...defaultOptions }),
    merge: (options) => ({ ...defaultOptions, ...options }),
    insert: (options) => {
      defaultOptions = { ...defaultOptions, ...options };
    },
    delete: (key) => delete defaultOptions[key],
    update: (options) => {
      defaultOptions = { ...defaultOptions, ...options };
    },
  };

  // 参数转换
  const paramsDataConvert = (contentType: string, params: any): string | null => {
    if (params == null || params === "") {
      return null;
    }

    switch (contentType) {
      case headersContentType["json"]:
        return JSON.stringify(params);
      case headersContentType["x-www-form-urlencoded"]:
        return Object.keys(params)
          .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
          .join("&");
      case headersContentType["form-data"]:
        const formData = new FormData();
        Object.keys(params).forEach((key) => {
          formData.append(key, params[key]);
        });
        return formData as any;
      case headersContentType["text/plain"]:
        return params.toString();
      case headersContentType.urlParams:
        const urlParams = new URLSearchParams();
        for (const key in params) {
          if (Object.prototype.hasOwnProperty.call(params, key)) {
            urlParams.append(key, params[key]);
          }
        }
        return "?" + urlParams.toString();
      default:
        return JSON.stringify(params);
    }
  };

  const interceptHeaders = async (
    url: string,
    params: any,
    headers: Record<string, any> = {},
    urlParams: any = null,
    options: Record<string, any> = {}
  ) => {
    const fetchHeaders = headersHandle.merge(headers);
    const fetchOptions = optionsHandle.merge({
      ...options,
      headers: fetchHeaders,
      body: paramsDataConvert(fetchHeaders["Content-Type"], params),
    });

    const urlParam = paramsDataConvert(headersContentType.urlParams, urlParams) || "";
    const fullUrl = urlHost + url + urlParam;

    try {
      const response = await fetch(fullUrl, fetchOptions);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.text();
      return result;
    } catch (error) {
      console.error("Fetch error:", error);
      throw error;
    }
  };

  return {
    post: (url: string, params: any) => interceptHeaders(url, params, {}, null, { method: "POST" }),
    get: (url: string, params: any = null) => interceptHeaders(url, null, {}, params, { method: "GET" }),
    put: (url: string, params: any) => interceptHeaders(url, params, {}, null, { method: "PUT" }),
    delete: (url: string, params: any = null) => interceptHeaders(url, params, {}, null, { method: "DELETE" }),
    headers: headersHandle,
    options: optionsHandle,
  };
})();

// 导出需要的函数和对象
export {
  getRndInteger,
  addEvent,
  removeEvent,
  store,
  getDocHeight,
  getScript,
  assetUrl,
  vendorJs,
  vendorCss,
  pjaxScript,
  pageScroll,
  transition,
  arraysUtil,
  sleep,
  localStorageUtil,
};
