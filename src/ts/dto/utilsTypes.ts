export type Callback = () => void;

// 或者如果确实需要扩展一些其他属性，应该只添加 HTMLScriptElement 中没有的属性

export interface TransitionOptions {
  targets: HTMLElement | Document | ParentNode;
  duration: number;
  easing: string;
  scrollTop?: number;
  complete?: Callback;
}

export interface Store {
  get(item: string): string | null;
  set(item: string, str: string): string;
  del(item: string): void;
}

export interface LocalStorageUtil {
  updateStrData(key: string, data: string): void;
  getStrData(key: string): string | null;
  delStrData(key: string): void;
  updateObjectData(key: string, data: object): void;
  getObjectData(key: string): object | null;
  delObjectData(key: string): void;
  updateObjectKeyData(key: string, objectKey: string, objectValue: any): void;
  getObjectKeyData(key: string, objectKey: string): any;
  delObjectKeyData(key: string, objectKey: string): void;
  updateArrayData(key: string, data: any[]): void;
  getArrayData(key: string): any[] | null;
  delArrayData(key: string): void;
  concatArrayData(key: string, arrayValue: any): boolean;
  addArrayData(key: string, arrayValue: any): void;
}

export interface FetchUtil {
  post(url: string, params: any): Promise<string>;
  get(url: string, params?: any): Promise<string>;
  put(url: string, params: any): Promise<string>;
  delete(url: string, params?: any): Promise<string>;
  headers: {
    get(): Record<string, any>;
    merge(headers: Record<string, any>): Record<string, any>;
    insert(headers: Record<string, any>): void;
    delete(headers: Record<string, any>, key: string): void;
    update(headers: Record<string, any>): void;
  };
  options: {
    get(): Record<string, any>;
    merge(options: Record<string, any>): Record<string, any>;
    insert(options: Record<string, any>): void;
    delete(key: string): void;
    update(options: Record<string, any>): void;
  };
}

// 首先定义类型
export type HeadersContentType = {
  json: string;
  "x-www-form-urlencoded": string;
  "form-data": string;
  "text/plain": string;
  urlParams: string;
};

export type HeadersHandle = {
  get: () => Record<string, any>;
  merge: (headers: Record<string, any>) => Record<string, any>;
  insert: (headers: Record<string, any>) => void;
  delete: (headers: Record<string, any>, key: string) => void;
  update: (headers: Record<string, any>) => void;
};

export type OptionsHandle = {
  get: () => Record<string, any>;
  merge: (options: Record<string, any>) => Record<string, any>;
  insert: (options: Record<string, any>) => void;
  delete: (key: string) => void;
  update: (options: Record<string, any>) => void;
};
