import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Served from https://denysovski.github.io/VaultX/ on GitHub Pages.
// Override with BASE=/ for a root deployment (Netlify, Vercel, custom domain).
export default defineConfig({
  base: process.env.BASE ?? '/VaultX/',
  plugins: [react()],
  build: {
    target: 'es2022',
    cssMinify: true,
    assetsInlineLimit: 0,
  },
});
