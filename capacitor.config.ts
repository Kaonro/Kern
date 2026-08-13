import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kaonro.kern',
  appName: 'Kern',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 600,
      launchAutoHide: true,
      launchFadeOutDuration: 350,
      backgroundColor: '#1f2a24',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1f2a24',
      overlaysWebView: false,
    },
  },
};

export default config;
