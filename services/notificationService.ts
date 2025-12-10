
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (Capacitor.isNativePlatform()) {
    const result = await LocalNotifications.requestPermissions();
    return result.display === 'granted';
  } else {
    // Web Fallback
    if (!("Notification" in window)) {
      console.log("Bu tarayıcı bildirimleri desteklemiyor.");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }

    return false;
  }
};

export const checkNotificationPermission = async (): Promise<boolean> => {
    if (Capacitor.isNativePlatform()) {
        const result = await LocalNotifications.checkPermissions();
        return result.display === 'granted';
    } else {
        return Notification.permission === "granted";
    }
};

export const sendNotification = async (title: string, body: string, useSystemSound: boolean = false) => {
  if (Capacitor.isNativePlatform()) {
    // Native Notification
    try {
      await LocalNotifications.schedule({
        notifications: [{
          title,
          body,
          id: new Date().getTime() % 2147483647, // Unique Int32 ID for Android
          // If useSystemSound is true, we leave 'sound' undefined to let OS play default.
          // If useSystemSound is false (we play custom audio), we ideally want silence.
          // Note: Creating a truly silent channel on Android programmatically requires more config,
          // but for now relying on default behavior or 'null' logic. 
          // On iOS, leaving sound undefined plays default.
          sound: useSystemSound ? undefined : undefined, 
          schedule: { at: new Date(Date.now() + 100) }, // Trigger almost immediately
          smallIcon: 'ic_stat_icon_config_sample', // Default icon fallback
        }]
      });
    } catch (e) {
      console.error("Native notification error", e);
    }
  } else {
    // Web Fallback
    if (Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        silent: true // Web: always silent so we can handle sound manually if needed
      });
    }
  }
};

export const playNotificationSound = (soundType: string) => {
  let audioSrc = '';

  switch (soundType) {
    case 'adhan':
      // Short 'Allah-u Akbar' clip
      audioSrc = 'https://media.islamway.net/several/305/03_Athan_Makkah.mp3'; 
      break;
    case 'water':
      // Gentle water sound
      audioSrc = 'https://actions.google.com/sounds/v1/water/stream_flowing.ogg';
      break;
    case 'bird':
      // Bird chirp
      audioSrc = 'https://actions.google.com/sounds/v1/animals/sparrow_chirp.ogg';
      break;
    case 'beep':
      // Simple notification beep
      audioSrc = 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg';
      break;
    default:
      // 'default' implies system sound, handled by Native Notification.
      return; 
  }

  if (audioSrc) {
    try {
      const audio = new Audio(audioSrc);
      audio.volume = 0.7;
      audio.play().catch(e => console.warn("Audio play failed (interaction required):", e));
      
      // For Adhan, stop after 15 seconds
      if (soundType === 'adhan') {
          setTimeout(() => {
              audio.pause();
          }, 15000);
      }
    } catch (error) {
      console.error("Audio playback error", error);
    }
  }
};
