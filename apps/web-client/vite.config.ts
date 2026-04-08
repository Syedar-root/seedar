import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react() as any, tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "#pkg/seedar/ui-react": path.resolve(
        __dirname,
        "../../packages/ui-react/src/index.tsx",
      ),
      "#pkg/seedar/ui-core": path.resolve(
        __dirname,
        "../../packages/ui-core/src/index.ts",
      ),
      "#pkg/seedar/types": path.resolve(
        __dirname,
        "../../packages/types/src/index.ts",
      ),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  build: { rollupOptions: { input: { main: "index.html" } } },
  css: {
    preprocessorOptions: {
      scss: {
        api: "modern-compiler",
      },
    },
  },
});
