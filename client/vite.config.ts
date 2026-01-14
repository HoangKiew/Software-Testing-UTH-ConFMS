// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  // Tất cả config server gộp vào đây
  server: {
    // Proxy để forward /api sang backend gateway (localhost:3000)
    proxy: {
      '/api': {
        target: 'http://localhost:3000',          // port của NestJS gateway
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,                  // Giữ nguyên /api (gateway dùng prefix /api)
        // Nếu backend KHÔNG có prefix /api, uncomment dòng này:
        // rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },

    // Tùy chọn: tăng timeout cho proxy
    proxyTimeout: 30000,  // 30 giây
    timeout: 30000,

    // Tùy chọn: mở browser tự động khi dev
    open: true,

    // Tùy chọn: đổi port nếu 5173 bị chiếm
    // port: 3000,
  },

  // Alias để import dễ dàng hơn
  resolve: {
    alias: {
      '@': '/src',
      '@pages': '/src/pages',
      '@redux': '/src/redux',
      '@api': '/src/redux/api',
      '@components': '/src/components',
    },
  },
});