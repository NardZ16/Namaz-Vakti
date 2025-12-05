import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // Telefonda beyaz ekranı önler (Relative path)
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});