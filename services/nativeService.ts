
import { Capacitor } from '@capacitor/core';
import { AdMob, BannerAdSize, BannerAdPosition, AdmobConsentStatus } from '@capacitor-community/admob';

export const isNative = (): boolean => {
  return Capacitor.isNativePlatform();
};

export const triggerHaptic = async (pattern: 'light' | 'medium' | 'heavy' | 'success' | 'warning') => {
  if (isNative()) {
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
    // Web Fallback: Tarayıcı titreşim desteği
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        switch (pattern) {
            case 'light': navigator.vibrate(10); break;
            case 'medium': navigator.vibrate(40); break;
            case 'heavy': navigator.vibrate([50, 50]); break;
            case 'success': navigator.vibrate([50, 50, 50]); break;
            case 'warning': navigator.vibrate([100, 50, 100]); break;
        }
    } else {
        console.log(`[Web Haptic Feedback]: ${pattern}`);
    }
  }
};

export const initializeAds = async () => {
    if (!isNative()) {
        console.log("ℹ️ Web ortamında AdMob devre dışı bırakıldı.");
        return;
    }

    try {
        await AdMob.initialize({
            initializeForTesting: false, 
        });

        const consentInfo = await AdMob.requestConsentInfo();
        
        if (consentInfo.status === AdmobConsentStatus.REQUIRED) {
            await AdMob.showConsentForm();
        }

    } catch (e) {
        console.warn("AdMob initialization warning:", e);
    }
};

export const showBottomBanner = async () => {
    if (!isNative()) return;

    try {
        // Pozisyonu BOTTOM_CENTER olarak sabitledik ve margin'i 0 yaptık.
        // Bu, reklamın sistem navigasyon çubuğunun hemen üzerine yapışmasını sağlar.
        const options = {
            adId: 'ca-app-pub-4319080566007267/3273590664', 
            adSize: BannerAdSize.ADAPTIVE_BANNER,
            position: BannerAdPosition.BOTTOM_CENTER,
            margin: 0,
            isTesting: false 
        };

        await AdMob.showBanner(options);
    } catch (e) {
        console.error("Show banner failed", e);
    }
};

export const hideBanner = async () => {
    if (isNative()) {
        try {
            await AdMob.hideBanner();
        } catch (e) {
            console.error("Hide banner failed", e);
        }
    }
};
