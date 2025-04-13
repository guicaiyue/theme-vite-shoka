/// <reference types="vite/client" />

import type { Alpine } from "alpinejs";
import type { Page } from "./ts/page";
import { Config, LocalConfig } from "./ts/dto/configTypes";
import type { MediaPlayer } from "./ts/player";
import type { Fireworks } from "./ts/fireworks";
import type { Sidebar } from "./ts/sidebar";

export {};

declare global {
  interface Window {
    Alpine: Alpine;
    CONFIG: Config;
    LOCAL: LocalConfig;
    Page: Page;
    [key: string]: any;
    css: { [key: string]: boolean };
    MediaPlayer: MediaPlayer | null;
    fireworks: Fireworks | null;
    Sidebar: Sidebar;
  }
}
