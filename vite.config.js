import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_ACTIONS === 'true' ? '/KisanConnect/' : '/',
  server: { proxy: { '/api': 'http://localhost:5000' } },
});
