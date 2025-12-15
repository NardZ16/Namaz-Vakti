
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

// Android 8.0+ için Bildirim Kanalı ŞARTTIR
const CHANNEL_ID = 'namaz_vakti_channel_v1';

export const initNotifications = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      // 1. İzinleri Kontrol Et ve İste
      const permStatus = await LocalNotifications.checkPermissions();
      if (permStatus.display !== 'granted') {
          await LocalNotifications.requestPermissions();
      }
      
      // 2. Kanal oluştur (Android için kritik)
      await LocalNotifications.createChannel({
        id: CHANNEL_ID,
        name: 'Namaz Vakti Hatırlatıcı',
        description: 'Namaz vakitleri için hatırlatmalar',
        importance: 5, // Yüksek önem
        visibility: 1, // Kilit ekranında görünür
        sound: undefined, 
        vibration: true,
      });

      // 3. Ön Planda Bildirim Gösterme (iOS için Kritik)
      // Uygulama açıkken bildirim gelirse bunu alert olarak göster veya yoksayma
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

// Yeni Planlama Fonksiyonu (Scheduling)
export const scheduleNotification = async (id: number, title: string, body: string, scheduleDate: Date) => {
  // Geçmiş zaman kontrolü (1 saniye tolerans)
  if (scheduleDate.getTime() <= Date.now() + 1000) {
      console.warn("Geçmiş tarihli bildirim planlanamaz:", scheduleDate);
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
          channelId: CHANNEL_ID,
          sound: 'beep.wav', // iOS'te dosya yoksa default çalar
          smallIcon: 'ic_stat_icon_config_sample',
          actionTypeId: "",
          extra: null
        }]
      });
      console.log(`Bildirim planlandı [ID:${id}]: ${title} -> ${scheduleDate.toLocaleString()}`);
    } catch (e) {
      console.error("Bildirim planlama hatası:", e);
    }
  } else {
    console.log(`[WEB SIMULATION] Bildirim planlandı: ${scheduleDate.toLocaleTimeString()} - ${title}`);
  }
};

// Test Bildirimi (5 Saniye Sonraya)
export const testNotification = async () => {
    const testDate = new Date(Date.now() + 5000); // 5 saniye sonra
    await scheduleNotification(
        99999, 
        "Test Bildirimi", 
        "Bu bildirim çalışıyorsa ayarlarınız doğrudur.", 
        testDate
    );
    return testDate;
};

// Anlık bildirim
export const sendNotification = async (title: string, body: string) => {
    if (Capacitor.isNativePlatform()) {
        await LocalNotifications.schedule({
            notifications: [{
                title,
                body,
                id: Math.floor(Date.now() / 1000), // Unique ID
                schedule: { at: new Date(Date.now() + 1000) }, // 1 sn sonra
                channelId: CHANNEL_ID,
            }]
        });
    } else if (Notification.permission === "granted") {
        new Notification(title, { body });
    }
};
