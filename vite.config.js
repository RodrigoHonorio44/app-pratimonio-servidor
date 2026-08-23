// vite.config.js
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiUrl = env.VITE_API_URL || 'http://localhost:3000';

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: apiUrl.replace('/api', ''), // Remove o /api se já estiver incluído para o proxy injetar corretamente
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});