import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.splitravel',
  appName: 'SpliTravel',
  webDir: 'dist',
  plugins: {
    StatusBar: {
      style: 'Light',
      backgroundColor: '#4F46E5',
      overlaysWebView: false  // ✅ Critical - don't overlay
    }
  }
};

export default config;