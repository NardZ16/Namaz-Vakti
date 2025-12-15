
import { Capacitor } from '@capacitor/core';
import { AdMob, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';

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
        await AdMob.initialize({
            requestTrackingAuthorization: true,
            initializeForTesting: false, 
        });

        const consentInfo = await AdMob.requestConsentInfo();
        
        if (consentInfo.status === 'REQUIRED' || consentInfo.status === 'required') {
            await AdMob.showConsentForm();
        }

    } catch (e) {
        console.error("AdMob initialization warning:", e);
    }
};

export const showBottomBanner = async () => {
    if (!isNativePlatform()) return;

    try {
        const options = {
            adId: 'ca-app-pub-4319080566007267/3273590664', 
            adSize: BannerAdSize.ADAPTIVE_BANNER,
            position: BannerAdPosition.BOTTOM,
            margin: 0,
            isTesting: false 
        };

        await AdMob.showBanner(options);
    } catch (e) {
        console.error("Show banner failed", e);
    }
};

export const hideBanner = async () => {
    if (isNativePlatform()) {
        try {
            await AdMob.hideBanner();
        } catch (e) {
            console.error("Hide banner failed", e);
        }
    }
};

export const isNative = isNativePlatform;
