
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  publicDir: 'public', // Statik dosyaların yeri açıkça belirtildi
  base: './', // Mobil uyumluluk için relative path
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'assets',
    // app-ads.txt gibi dosyaların kopyalandığından emin olmak için rollup ayarları
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    }
  },
  server: {
    // Geliştirme sunucusu ayarları
    host: true
  }
});
