import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Fundi Wangu',
  slug: 'fundi-wangu',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#00875A',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'tz.co.fundiwangu.app',
    infoPlist: {
      NSLocationWhenInUseUsageDescription: 'Tunahitaji eneo lako kupata Mafundi karibu nawe.',
      NSLocationAlwaysAndWhenInUseUsageDescription: 'Eneo lako linatumika kukufuatilia unapokuwa mtandaoni kama Fundi.',
      NSCameraUsageDescription: 'Kamera inatumika kupiga picha za kazi na kitambulisho.',
      NSPhotoLibraryUsageDescription: 'Tunahitaji kupata picha zako kwa kazi na wasifu.',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#00875A',
    },
    package: 'tz.co.fundiwangu.app',
    permissions: [
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
      'ACCESS_BACKGROUND_LOCATION',
      'CAMERA',
      'READ_EXTERNAL_STORAGE',
      'RECEIVE_SMS',
    ],
    googleServicesFile: './google-services.json',
  },
  plugins: [
    'expo-router',
    'expo-location',
    'expo-camera',
    'expo-image-picker',
    'expo-notifications',
    'expo-secure-store',
  ],
  extra: {
    eas: {
      projectId: 'fundi-wangu',
    },
  },
};

export default config;
