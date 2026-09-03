import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        // Inject header di Vite proxy — tidak sampai ke browser
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            proxyReq.setHeader(
              "X-API-Key",
              process.env.API_KEY ?? ""  // dari .env (bukan VITE_ prefix!)
            );
          });
        },
      },
    },
  },
});