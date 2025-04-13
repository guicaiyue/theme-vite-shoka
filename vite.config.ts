import { defineConfig } from "vite";
import { fileURLToPath } from "url";
import path from "path";
import { readFileSync } from "fs";

// 读取 theme.yaml 文件
const themeYaml = readFileSync("./theme.yaml", "utf8");
const version = themeYaml.match(/version:\s*(.+)/)?.[1] || "1.0.0";

export default defineConfig({
  plugins: [],
  css: {
    postcss: "./postcss.config.js",
    preprocessorOptions: {
      stylus: {
        additionalData: `@import "./src/styles/stylus/_variables.styl"`,
      },
    },
  },
  build: {
    outDir: fileURLToPath(new URL("./templates/assets/dist", import.meta.url)),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "src/main.ts"),
      },
      output: {
        chunkFileNames: "js/[name]-[hash].js", // 引入文件名的名称
        entryFileNames: `[name]-${version}.js`, // 包的入口文件名称
        assetFileNames: (assetInfo) => {
          // 如果是 main.css，不添加哈希值
          if (assetInfo.name && ["main.css"].includes(assetInfo.name)) {
            return `[name]-${version}.[ext]`;
          }
          // 其他资源保持原有的命名方式
          return "[ext]/[name]-[hash].[ext]";
        },
      },
    },
  },
});
