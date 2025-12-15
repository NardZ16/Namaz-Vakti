
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

// Android 8.0+ için Bildirim Kanalı ŞARTTIR
const CHANNEL_ID = 'namaz_vakti_channel_v1';

export const initNotifications = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      // Önce izin iste
      await LocalNotifications.requestPermissions();
      
      // Kanal oluştur (Android için kritik)
      await LocalNotifications.createChannel({
        id: CHANNEL_ID,
        name: 'Namaz Vakti Hatırlatıcı',
        description: 'Namaz vakitleri için hatırlatmalar',
        importance: 5, // Yüksek önem (Sesli ve titreşimli)
        visibility: 1, // Kilit ekranında görünür
        sound: undefined, // Varsayılan sistem sesi
        vibration: true,
      });
    } catch (e) {
      console.error("Bildirim kanalı oluşturma hatası:", e);
    }
  }
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (Capacitor.isNativePlatform()) {
    const result = await LocalNotifications.requestPermissions();
    return result.display === 'granted';
  } else {
    // Web Fallback
    if (!("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
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

export const cancelAllNotifications = async () => {
    if (Capacitor.isNativePlatform()) {
        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length > 0) {
            await LocalNotifications.cancel(pending);
        }
    }
};

// Yeni Planlama Fonksiyonu (Scheduling)
export const scheduleNotification = async (id: number, title: string, body: string, scheduleDate: Date) => {
  if (scheduleDate.getTime() <= Date.now()) return; // Geçmiş zamanı planlama

  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.schedule({
        notifications: [{
          title,
          body,
          id: id, // Benzersiz ID (Prayer time timestamp vb.)
          schedule: { at: scheduleDate },
          channelId: CHANNEL_ID,
          sound: undefined, // Varsayılan sistem bildirim sesi
          smallIcon: 'ic_stat_icon_config_sample',
          actionTypeId: "",
          extra: null
        }]
      });
      console.log(`Bildirim planlandı: ${title} - ${scheduleDate.toLocaleTimeString()}`);
    } catch (e) {
      console.error("Native notification error", e);
    }
  } else {
    // Web'de ileri tarihli bildirim desteği yoktur, sadece konsola yazıyoruz.
    console.log(`[WEB SIMULATION] Bildirim planlandı: ${scheduleDate} - ${title}`);
  }
};

// Anlık bildirim (Test veya manuel tetikleme için)
export const sendNotification = async (title: string, body: string) => {
    if (Capacitor.isNativePlatform()) {
        await LocalNotifications.schedule({
            notifications: [{
                title,
                body,
                id: new Date().getTime() % 2147483647,
                schedule: { at: new Date(Date.now() + 100) },
                channelId: CHANNEL_ID,
            }]
        });
    } else if (Notification.permission === "granted") {
        new Notification(title, { body, icon: '/favicon.ico' });
    }
};

// Uygulama içi ses oynatma (Opsiyonel - Sadece uygulama açıkken çalışır)
export const playNotificationSound = (soundType: string) => {
  let audioSrc = '';
  switch (soundType) {
    case 'adhan': audioSrc = 'https://media.islamway.net/several/305/03_Athan_Makkah.mp3'; break;
    case 'water': audioSrc = 'https://actions.google.com/sounds/v1/water/stream_flowing.ogg'; break;
    case 'bird': audioSrc = 'https://actions.google.com/sounds/v1/animals/sparrow_chirp.ogg'; break;
    case 'beep': audioSrc = 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg'; break;
    default: return; 
  }

  if (audioSrc) {
    try {
      const audio = new Audio(audioSrc);
      audio.volume = 0.7;
      audio.play().catch(e => console.warn("Audio play failed:", e));
      if (soundType === 'adhan') {
          setTimeout(() => audio.pause(), 15000);
      }
    } catch (error) {
      console.error("Audio playback error", error);
    }
  }
};
