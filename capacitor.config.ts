
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.namazvaktipro.app',
  appName: 'Namaz Vakti Pro',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    AdMob: {
      // AdMob configuration if needed
    }
  }
};

export default config;
