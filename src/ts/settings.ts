import { Config, LocalConfig } from "./dto/configTypes";

// 创建一个初始化函数
export function initializeConfig(): void {
  // 防止重复初始化
  if (window.CONFIG) {
    console.warn("CONFIG already initialized");
    return;
  }

  // 确保全局变量存在
  if (typeof site === "undefined" || typeof haloConfig === "undefined") {
    console.error("Required global variables are not initialized yet");
    return;
  }

  try {
    const siteUrl: string = site.url;

    const CONFIG: Config = {
      version: "0.2.5",
      hostname: siteUrl.endsWith("/") ? siteUrl.substr(0, siteUrl.length - 1) : siteUrl,
      root: "/themes/theme-shoka/",
      statics: "/",
      favicon: {
        normal: "assets/images/favicon.ico",
        hidden: "assets/images/failure.ico",
      },
      darkmode: false,
      auto_scroll: true,
      js: {
        chart: "npm/frappe-charts@1.5.0/dist/frappe-charts.min.iife.min.js",
        copy_tex: "npm/katex@0.12.0/dist/contrib/copy-tex.min.js",
        fancybox:
          "combine/npm/alpinejs@3.0.0/dist/alpine.min.js,npm/@fancyapps/fancybox@3.5.7/dist/jquery.fancybox.min.js,npm/justifiedGallery@3.8.1/dist/js/jquery.justifiedGallery.min.js",
      },
      css: {
        katex: "npm/katex@0.12.0/dist/katex.min.css",
        mermaid: "css/mermaid.css",
        fancybox: "assets/plugins/fancybox/jquery.fancybox.min.css",
      },
      loader: {
        start: haloConfig.layout.loader_start === "开启",
        switch: false,
      },
      search: {
        empty: "",
        appID: "CDQ9HDQ1JI",
        apiKey: "7cbbb473a44d5288b244bb20edc73489",
        indexName: "xrz",
        hits: {
          per_page: 10,
        },
      },
      audio: [
        {
          title: "列表1",
          list: ["https://music.163.com/#/playlist?id=2943811283", "https://music.163.com/#/playlist?id=2297706586"],
        },
        {
          title: "列表2",
          list: ["https://music.163.com/#/playlist?id=2031842656"],
        },
      ],
      quicklink: {
        timeout: 3000,
        priority: true,
        ignores: [null, null],
      },
      fireworks: ["rgba(255,182,185,.9)", "rgba(250,227,217,.9)", "rgba(187,222,214,.9)", "rgba(138,198,209,.9)"],
    };

    const LOCAL: LocalConfig = {
      path: "",
      favicon: {
        show: "（●´3｀●）やれやれだぜ",
        hide: "(´Д｀)大変だ！",
      },
      search: {
        placeholder: "文章搜索",
        empty: "关于 「 ${query} 」，什么也没搜到",
        stats: "${time} ms 内找到 ${hits} 条结果",
      },
      valine: true,
      fancybox: true,
      copyright: '复制成功，转载请遵守 <i class="ic i-creative-commons"></i>BY-NC-SA 协议。',
      ignores: [
        function (uri: string) {
          return uri.includes("#");
        },
        function (uri: string) {
          return new RegExp(LOCAL.path + "$").test(uri);
        },
      ],
    };

    // 动态刷新样式
    if (CONFIG.loader.start) {
      document.getElementById("loading")?.classList.add("block");
    } else {
      const loadingElement = document.getElementById("loading");
      if (loadingElement) {
        loadingElement.style.display = "none";
      }
    }

    // head 后面添加动态 html 片段
    document.head.insertAdjacentHTML("beforeend", haloConfig.html.head);
    // head 后面添加动态 js 代码
    let headScript = document.createElement("script");
    headScript.insertAdjacentHTML("beforeend", haloConfig.html.headJs);
    document.head.appendChild(headScript);

    // 将配置赋值给全局 window 对象
    window.CONFIG = CONFIG;
    // 将配置赋值给全局 window 对象
    window.LOCAL = LOCAL;
  } catch (error) {
    console.error("Failed to initialize CONFIG:", error);
  }
}

// 导出类型声明
declare global {
  const site: { url: string };
  const haloConfig: {
    layout: {
      loader_start: string;
    };
    html: {
      head: string;
      headJs: string;
    };
    base: {
      security_number: string;
      blog_name: string;
      blog_master: string;
      blog_master_head_image: string;
      blog_description: string;
      headCoverUrl: string;
      postCoverUrl: string;
      icp_number: string;
    };
    seo: {
      ogImage: string;
    };
    self: {
      external: Array<{
        name: string;
        url: string;
      }>;
    };
  };
}

// 不再在这里自动初始化，让 main.ts 来控制初始化时机
