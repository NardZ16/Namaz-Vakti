
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
      // OFFICIAL GOOGLE TEST APP ID (Safe for dev)
      // Replace this with your REAL APP ID from AdMob Console (ca-app-pub-xxx~xxx) before publishing
      appId: "ca-app-pub-3940256099942544~1458002511", 
    }
  }
};

export default config;