import wasm from "vite-plugin-wasm";
import { UserConfig } from "vite";

export default {
  plugins: [wasm()],
} satisfies UserConfig;
