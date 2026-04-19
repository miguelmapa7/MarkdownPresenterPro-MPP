import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// Build condicional: VITE_BUILD_TARGET=web genera artefactos para hosting estático
const isWebBuild = process.env.VITE_BUILD_TARGET === "web";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Web build → dist-web, Tauri build → dist (default)
    outDir: isWebBuild ? "dist-web" : "dist",
    rollupOptions: isWebBuild
      ? {
          // Excluir dependencias de Tauri del bundle web
          external: [
            "@tauri-apps/api",
            "@tauri-apps/plugin-fs",
            "@tauri-apps/plugin-dialog",
          ],
        }
      : undefined,
  },
  // Prevent vite from obscuring Rust errors
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
});
