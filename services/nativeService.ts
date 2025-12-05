import { Capacitor } from '@capacitor/core';

// AdMob Configuration
// IMPORTANT: Replace with your Real AdMob App ID in capacitor.config.ts
const ADMOB_AD_UNITS = {
    ios: {
        banner: 'ca-app-pub-4319080566007267/3273590664', // Real Banner ID
        interstitial: 'ca-app-pub-3940256099942544/4411468910' // Test ID
    },
    android: {
        banner: 'ca-app-pub-3940256099942544/6300978111', // Test ID
        interstitial: 'ca-app-pub-3940256099942544/1033173712' // Test ID
    }
};

const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

export const triggerHaptic = async (pattern: 'light' | 'medium' | 'heavy' | 'success' | 'warning') => {
  if (isNativePlatform()) {
    try {
        const { Haptics, NotificationType, ImpactStyle } = await import('@capacitor/haptics');

        if (pattern === 'success') {
             await Haptics.notification({ type: NotificationType.Success });
        } else if (pattern === 'warning') {
             await Haptics.notification({ type: NotificationType.Warning });
        } else {
             const style = pattern === 'heavy' ? ImpactStyle.Heavy : pattern === 'medium' ? ImpactStyle.Medium : ImpactStyle.Light;
             await Haptics.impact({ style });
        }
    } catch (e) {
        console.warn("Native Haptics failed or not loaded", e);
    }
  } else {
    // Web Fallback
    if (!navigator.vibrate) return;
    
    switch (pattern) {
        case 'light': navigator.vibrate(10); break;
        case 'medium': navigator.vibrate(40); break;
        case 'heavy': navigator.vibrate([50, 50]); break;
        case 'success': navigator.vibrate([50, 50, 50]); break;
        case 'warning': navigator.vibrate([100, 50, 100]); break;
    }
  }
};

export const initializeAds = async () => {
    if (!isNativePlatform()) return;

    try {
        const { AdMob } = await import('@capacitor-community/admob');
        
        // AdMob v5 Initialization
        await AdMob.initialize({
            requestTrackingAuthorization: true,
            // initializeForTesting is a v6 feature, removed for v5 stability
        });
        
        console.log("AdMob Initialized (v5)");
    } catch (e) {
        console.error("AdMob Init Failed", e);
    }
};

export const showBottomBanner = async () => {
    if (!isNativePlatform()) return;

    try {
         const { AdMob, BannerAdSize, BannerAdPosition } = await import('@capacitor-community/admob');
         
         const platform = Capacitor.getPlatform();
         const adId = platform === 'ios' ? ADMOB_AD_UNITS.ios.banner : ADMOB_AD_UNITS.android.banner;

         await AdMob.showBanner({
             adId: adId,
             adSize: BannerAdSize.ADAPTIVE_BANNER,
             position: BannerAdPosition.BOTTOM_CENTER,
             margin: 0,
             // isTesting flag handling differs in v5, usually handled by device ID or ad unit
         });

    } catch (e) {
        console.error("AdMob Show Banner Failed", e);
    }
};

export const hideBanner = async () => {
    if (!isNativePlatform()) return;
    try {
        const { AdMob } = await import('@capacitor-community/admob');
        await AdMob.hideBanner();
    } catch (e) {}
};

export const isNative = isNativePlatform;