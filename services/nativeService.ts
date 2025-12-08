import { Capacitor } from '@capacitor/core';

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
    // AdMob removed
    return Promise.resolve();
};

export const showBottomBanner = async () => {
    // AdMob removed
    return Promise.resolve();
};

export const hideBanner = async () => {
    // AdMob removed
    return Promise.resolve();
};

export const isNative = isNativePlatform;