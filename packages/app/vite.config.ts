import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import linaria from "@wyw-in-js/vite";
import { visualizer } from "rollup-plugin-visualizer";
import { runtimeLinaria } from "vite-plugin-runtime-linaria";
import { defineConfig, UserConfig } from "vite";

export default defineConfig(
  ({ command }) =>
    ({
      plugins: [
        wasm(),
        topLevelAwait(),

        // visualizer({ filename: "dist/bundle-stats.html", template: "treemap" }),

        command === "build"
          ? linaria({
              include: ["**/*.tsx"],
              babelOptions: {
                presets: ["@babel/preset-typescript", "@babel/preset-react"],
              },
            })
          : runtimeLinaria({ include: ["**/*.tsx"] }),
      ],
      build: {
        rollupOptions: {
          treeshake: false,
        },
      },
    } satisfies UserConfig)
);
