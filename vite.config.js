import { defineConfig } from "vite";

export default defineConfig({
  server: {
    open: false,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
