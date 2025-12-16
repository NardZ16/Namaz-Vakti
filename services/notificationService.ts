
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { getRandomVerse } from './geminiService';

// Tek bir kanal kullanıyoruz artık
const CUSTOM_SOUND_CHANNEL = 'namaz_vakti_custom_sound';
const VERSE_NOTIF_ID = 90000; 

// Ses dosyası adı (Uzantı Android için genellikle gerekmez ama iOS ve bazı sürümler için .wav ekliyoruz)
const SOUND_FILE = 'notification.wav'; 

export const initNotifications = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      const permStatus = await LocalNotifications.checkPermissions();
      if (permStatus.display !== 'granted') {
          await LocalNotifications.requestPermissions();
      }
      
      // Tek ve özel bir kanal oluştur
      await LocalNotifications.createChannel({
        id: CUSTOM_SOUND_CHANNEL,
        name: 'Namaz Vakti Bildirimleri',
        description: 'Vakit ve hatırlatma bildirimleri',
        importance: 5,
        visibility: 1,
        sound: SOUND_FILE, // assets/notification.wav -> native folders
        vibration: true,
      });

      await LocalNotifications.addListener('localNotificationReceived', (notification) => {
          console.log('Bildirim alındı (Ön Plan):', notification);
      });

    } catch (e) {
      console.error("Bildirim servisi başlatma hatası:", e);
    }
  }
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (Capacitor.isNativePlatform()) {
    try {
        const result = await LocalNotifications.requestPermissions();
        return result.display === 'granted';
    } catch (e) {
        console.error("İzin isteme hatası:", e);
        return false;
    }
  } else {
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
        try {
            const pending = await LocalNotifications.getPending();
            if (pending.notifications.length > 0) {
                await LocalNotifications.cancel(pending);
            }
        } catch (e) {
            console.error("Bildirim iptal hatası:", e);
        }
    }
};

export const scheduleNotification = async (id: number, title: string, body: string, scheduleDate: Date) => {
  if (scheduleDate.getTime() <= Date.now() + 1000) {
      return; 
  }

  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.schedule({
        notifications: [{
          title,
          body,
          id: id,
          schedule: { at: scheduleDate },
          channelId: CUSTOM_SOUND_CHANNEL, // Özel ses kanalı
          sound: SOUND_FILE,               // Özel ses dosyası
          smallIcon: 'ic_stat_icon_config_sample',
        }]
      });
      console.log(`Bildirim planlandı [ID:${id}]: ${title} -> ${scheduleDate.toLocaleString()} (Ses: ${SOUND_FILE})`);
    } catch (e) {
      console.error("Bildirim planlama hatası:", e);
    }
  }
};

export const scheduleDailyVerseNotification = async (enabled: boolean) => {
    if (!Capacitor.isNativePlatform()) return;

    try {
        await LocalNotifications.cancel({ notifications: [{ id: VERSE_NOTIF_ID }] });

        if (!enabled) return;

        const verse = getRandomVerse();
        const now = new Date();
        const scheduleDate = new Date();
        scheduleDate.setHours(12, 0, 0, 0);

        if (scheduleDate <= now) {
            scheduleDate.setDate(scheduleDate.getDate() + 1);
        }

        await LocalNotifications.schedule({
            notifications: [{
                title: "Günün Ayeti",
                body: `"${verse.turkish}" - ${verse.reference}`,
                id: VERSE_NOTIF_ID,
                schedule: { at: scheduleDate, every: 'day' },
                channelId: CUSTOM_SOUND_CHANNEL, // Özel ses
                sound: SOUND_FILE,
                smallIcon: 'ic_stat_icon_config_sample',
            }]
        });
    } catch (e) {
        console.error("Ayet bildirimi planlama hatası:", e);
    }
};

export const sendNotification = async (title: string, body: string) => {
    if (Capacitor.isNativePlatform()) {
        await LocalNotifications.schedule({
            notifications: [{
                title,
                body,
                id: Math.floor(Date.now() / 1000), 
                schedule: { at: new Date(Date.now() + 1000) },
                channelId: CUSTOM_SOUND_CHANNEL,
                sound: SOUND_FILE
            }]
        });
    } else if (Notification.permission === "granted") {
        new Notification(title, { body });
    }
};
