
export interface PrayerTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Sunset: string;
  Maghrib: string;
  Isha: string;
  Imsak: string;
  Midnight: string;
  Firstthird: string;
  Lastthird: string;
}

export interface HijriDate {
  date: string;
  format: string;
  day: string;
  weekday: { en: string; ar: string };
  month: { number: number; en: string; ar: string };
  year: string;
  designation: { abbreviated: string; expanded: string };
}

export interface GregorianDate {
  date: string;
  format: string;
  day: string;
  weekday: { en: string };
  month: { number: number; en: string };
  year: string;
}

export interface AladhanDate {
  readable: string;
  timestamp: string;
  hijri: HijriDate;
  gregorian: GregorianDate;
}

export interface AladhanData {
  timings: PrayerTimings;
  date: AladhanDate;
  meta: {
    latitude: number;
    longitude: number;
    timezone: string;
    method: {
      id: number;
      name: string;
      params: { Fajr: number; Isha: number };
    };
    latitudeAdjustmentMethod: string;
    midnightMode: string;
    school: string;
    offset: { [key: string]: number };
  };
}

export interface AladhanResponse {
  code: number;
  status: string;
  data: AladhanData[];
}

export interface VerseData {
  arabic: string;
  turkish: string;
  reference: string;
}

export interface NextPrayerInfo {
  prayerName: string; // Turkish name
  prayerTime: Date;
  remainingTimeMs: number;
  isTomorrow: boolean;
}

export interface ReligiousHoliday {
  name: string;
  date: string; // YYYY-MM-DD
  description?: string;
}

export interface NotificationConfig {
  [key: string]: {
    enabled: boolean;
    minutesBefore: number;
    sound: string; // 'default' | 'adhan' | 'beep' | 'water'
  };
}

// Helper type for English to Turkish mapping
export type PrayerNameKey = keyof PrayerTimings;
