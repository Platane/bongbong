import wasm from "vite-plugin-wasm";
import { UserConfig } from "vite";

export default {
  plugins: [wasm()],
  build: {
    rollupOptions: {
      treeshake: false,
    },
  },
} satisfies UserConfig;
