import "./styles/app.styl";
// import "./styles/tailwind.css";  // 暂时注释掉
import "./styles/main.css";
import Alpine from "alpinejs";
import { initializeConfig } from "./ts/settings";
import { utils } from "./ts/core/utils";
import { initGlobal } from "./ts/global";
import "./ts/global.ts";
import "./ts/fireworks.ts";
import { Page } from "./ts/page";
import { MediaPlayer } from "./ts/player";
import { Fireworks } from "./ts/fireworks";
import { Sidebar } from "./ts/sidebar";
import { PJAX } from "./ts/pjax";

// 初始化应用
function initializeApp() {
  // 首先初始化配置
  initializeConfig();

  // 然后初始化全局变量
  initGlobal();

  // 初始化工具类
  utils.init();

  // 初始化 Alpine.js
  window.Alpine = Alpine;
  Alpine.start();

  // 初始化页面实例
  window.Page = new Page();

  // 导出全局侧边栏实例
  window.Sidebar = new Sidebar();

  // Prism 不主动初始化美化代码
  window.Prism = window.Prism || {};
  window.Prism.manual = true;

  // 初始化 PJAX 实例
  window.PJAX = new PJAX();

  // 注册媒体播放器和烟花效果类
  Object.defineProperty(window, "MediaPlayer", {
    value: new MediaPlayer(window.t, window.CONFIG),
    writable: false,
    configurable: true,
  });

  // 初始化烟花效果
  const fireworks = new Fireworks();
  fireworks.init();
  Object.defineProperty(window, "fireworks", {
    value: fireworks,
    writable: true,
    configurable: true,
  });

  console.log(
    "%c Theme.Shoka v" + window.CONFIG.version + " %c https://shoka.lostyu.me/ ",
    "color: white; background: #e9546b; padding:5px 0;",
    "padding:4px;border:1px solid #e9546b;"
  );
}

// 在正确的时机执行初始化
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}

export function count(x: number, y: number) {
  return x + y;
}
