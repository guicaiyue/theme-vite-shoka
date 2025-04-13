export interface ScrollAction {
  x: string | number;
  y: string | number;
}

export interface LoaderObject {
  timer: ReturnType<typeof setTimeout> | null;
  lock: boolean;
  show: () => void;
  hide: (sec?: number) => void;
  vanish: () => void;
}
