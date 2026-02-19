import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  return {
    base: mode === 'production' ? '/ai-financial-analyst/' : '/',
    server: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: ['.trycloudflare.com', 'localhost', '10.53.33.100', '172.18.0.1'],
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
