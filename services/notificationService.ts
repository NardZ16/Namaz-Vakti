
export const requestNotificationPermission = async (): Promise<boolean> => {
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
};

export const sendNotification = (title: string, body: string) => {
  if (Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: '/favicon.ico', // Fallback icon
      badge: '/favicon.ico',
      silent: true // We handle sound manually
    });
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
      // 'default' or unknown -> No extra audio (relies on system notification sound if not silent, 
      // but we set silent:true above to prefer manual control if possible, or just generic beep)
      return; 
  }

  if (audioSrc) {
    try {
      const audio = new Audio(audioSrc);
      // Volume control can be added here
      audio.volume = 0.7;
      audio.play().catch(e => console.warn("Audio play failed (interaction required):", e));
      
      // For Adhan, stop after 10 seconds if it's a long file
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
