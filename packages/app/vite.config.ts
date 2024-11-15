import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import { UserConfig } from "vite";

export default {
  plugins: [wasm(), topLevelAwait()],
  build: {
    rollupOptions: {
      treeshake: false,
    },
  },
} satisfies UserConfig;
