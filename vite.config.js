import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const proxyTarget =
    env.VITE_DEV_API_PROXY_TARGET?.trim() || "http://localhost:4000";

  return {
    plugins: [react()],
    server: {
      proxy: {
        "/users": {
          target: proxyTarget,
          changeOrigin: true,
        },
        "/courses": {
          target: proxyTarget,
          changeOrigin: true,
        },
        "/coursewares": {
          target: proxyTarget,
          changeOrigin: true,
        },
        "/questions": {
          target: proxyTarget,
          changeOrigin: true,
        },
        "/keywords": {
          target: proxyTarget,
          changeOrigin: true,
        },
        "/ai": {
          target: proxyTarget,
          changeOrigin: true,
        },
        "/review-cards": {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
