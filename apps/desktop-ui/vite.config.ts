import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@ipc": fileURLToPath(new URL("../../packages/ipc-contract-ts/src", import.meta.url)),
      "@ui-kit": fileURLToPath(new URL("../../packages/ui-kit/src", import.meta.url)),
    },
  },
  build: {
    target: "es2022",
  },
  server: {
    port: 1420,
    strictPort: true,
  },
});
