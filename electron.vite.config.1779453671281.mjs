// electron.vite.config.mjs
import { defineConfig, loadEnv } from "electron-vite";
import { resolve } from "path";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import { createSvgIconsPlugin } from "vite-plugin-svg-icons";
import viteCompression from "vite-plugin-compression";
import vueSetupExtend from "unplugin-vue-setup-extend-plus/vite";
var baseUrl = "http://154.8.139.48:8080";
var electron_vite_config_default = defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd());
  const { VITE_APP_ENV } = env;
  return {
    main: {
      resolve: {
        alias: {
          "@main": resolve("src/main")
        }
      }
    },
    preload: {
      resolve: {
        alias: {
          "@preload": resolve("src/preload")
        }
      }
    },
    renderer: {
      base: VITE_APP_ENV === "production" ? "/" : "/",
      resolve: {
        alias: {
          "@": resolve("src/renderer"),
          "~": resolve("src/renderer"),
          "@renderer": resolve("src/renderer")
        },
        extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json", ".vue"]
      },
      plugins: [
        vue(),
        // vueSetupExtend 可能有类似问题，也改用命名导入试试
        vueSetupExtend(),
        createSvgIconsPlugin({
          iconDirs: [resolve(process.cwd(), "src/renderer/assets/icons/svg")],
          symbolId: "icon-[dir]-[name]"
        }),
        viteCompression({
          verbose: true,
          disable: command !== "build"
        }),
        AutoImport({
          // 自动导入这些库的 API
          imports: [
            "vue",
            "vue-router",
            "pinia"
            // 如果使用 Pinia
          ],
          // 生成类型声明文件（TypeScript 项目）
          dts: "auto-imports.d.ts",
          // 生成 ESLint 配置（如果使用 ESLint）
          eslintrc: {
            enabled: true,
            filepath: "./.eslintrc-auto-import.json"
          }
        })
      ],
      server: {
        port: 80,
        host: true,
        open: false,
        proxy: {
          "/dev-api": {
            target: baseUrl,
            changeOrigin: true,
            rewrite: (p) => p.replace(/^\/dev-api/, "")
          },
          "^/v3/api-docs/(.*)": {
            target: baseUrl,
            changeOrigin: true
          }
        }
      },
      build: {
        sourcemap: command === "build" ? false : "inline",
        outDir: "out/renderer",
        assetsDir: "assets",
        chunkSizeWarningLimit: 2e3,
        rollupOptions: {
          output: {
            chunkFileNames: "static/js/[name]-[hash].js",
            entryFileNames: "static/js/[name]-[hash].js",
            assetFileNames: "static/[ext]/[name]-[hash].[ext]"
          }
        }
      },
      root: resolve("src/renderer"),
      css: {
        postcss: {
          plugins: [
            {
              postcssPlugin: "internal:charset-removal",
              AtRule: {
                charset: (atRule) => {
                  if (atRule.name === "charset") {
                    atRule.remove();
                  }
                }
              }
            }
          ]
        }
      }
    }
  };
});
export {
  electron_vite_config_default as default
};
