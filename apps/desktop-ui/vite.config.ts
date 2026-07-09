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
    target: "esnext",
    minify: "terser",
    cssMinify: true,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom"],
          "three-vendor": ["three", "@react-three/fiber", "@react-three/drei"],
          "ui-vendor": ["lucide-react", "framer-motion", "clsx"],
        },
      },
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  server: {
    port: 1420,
    strictPort: true,
  },
});
