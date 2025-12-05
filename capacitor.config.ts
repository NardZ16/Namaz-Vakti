
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
      // Real AdMob App ID
      appId: "ca-app-pub-4319080566007267~6922736225", 
    }
  }
};

export default config;
