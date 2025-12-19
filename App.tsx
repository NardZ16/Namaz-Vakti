
import React, { useEffect, useState, useCallback } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { fetchPrayerCalendar, fetchPrayerCalendarByCity, fetchCityCoordinates } from './services/aladhanService';
import { fetchDailyVerse } from './services/geminiService';
import { initNotifications, scheduleNotification, cancelAllNotifications, sendNotification, scheduleDailyVerseNotification } from './services/notificationService';
import { initializeAds, showBottomBanner, isNative } from './services/nativeService';
import { getUpcomingHolidays } from './data/holidays';
import CountdownTimer from './components/CountdownTimer';
import DailyList from './components/DailyList';
import WeeklyList from './components/WeeklyList';
import VerseCard from './components/VerseCard';
import LocationModal from './components/LocationModal';
import MenuModal from './components/MenuModal';
import HolidayCountdown from './components/HolidayCountdown';
import NotificationSettings from './components/NotificationSettings';
import QiblaCompass from './components/QiblaCompass';
import Zikirmatik from './components/Zikirmatik';
import QuranReader from './components/QuranReader';
import Contact from './components/Contact';
import { AladhanData, NextPrayerInfo, VerseData, NotificationConfig, ReligiousHoliday } from './types';

const PRAYER_MAP: Record<string, string> = {
  Fajr: 'İmsak',
  Sunrise: 'Güneş',
  Dhuhr: 'Öğle',
  Asr: 'İkindi',
  Maghrib: 'Akşam',
  Isha: 'Yatsı'
};

const ORDERED_PRAYERS = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

const App: React.FC = () => {
  const [prayerData, setPrayerData] = useState<AladhanData[]>([]);
  const [verse, setVerse] = useState<VerseData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [nextPrayer, setNextPrayer] = useState<NextPrayerInfo | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  
  const [locationName, setLocationName] = useState<string>('Konum Alınıyor...');
  const [selectedCity, setSelectedCity] = useState<string | null>(() => localStorage.getItem('selectedCity'));
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(() => localStorage.getItem('selectedDistrict'));
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [upcomingAlerts, setUpcomingAlerts] = useState<(ReligiousHoliday & { daysLeft: number })[]>([]);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') !== 'light';
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    initNotifications();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
     if (isNative()) {
        initializeAds().then(() => {
            setTimeout(() => {
                showBottomBanner();
            }, 1500);
        });
     }
  }, []);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
        setToastMessage(null);
    }, 2500);
  };

  const parseTime = (timeStr: string): { h: number, m: number } | null => {
    if (!timeStr) return null;
    const clean = timeStr.split(' ')[0]; 
    const parts = clean.split(':');
    if (parts.length < 2) return null;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return null;
    return { h, m };
  };

  const calculateNextPrayer = useCallback((todayData: AladhanData, tomorrowData: AladhanData | undefined) => {
    const now = new Date();
    let upcoming: NextPrayerInfo | null = null;

    for (const key of ORDERED_PRAYERS) {
      const timeStr = (todayData.timings as any)[key];
      const parsed = parseTime(timeStr);
      if (!parsed) continue;

      const prayerDate = new Date();
      prayerDate.setHours(parsed.h, parsed.m, 0, 0);

      if (prayerDate > now) {
        upcoming = {
          prayerName: PRAYER_MAP[key],
          prayerTime: prayerDate,
          remainingTimeMs: prayerDate.getTime() - now.getTime(),
          isTomorrow: false
        };
        break;
      }
    }

    if (!upcoming && tomorrowData) {
      const key = 'Fajr';
      const timeStr = tomorrowData.timings.Fajr;
      const parsed = parseTime(timeStr);
      
      if (parsed) {
        const prayerDate = new Date();
        prayerDate.setDate(prayerDate.getDate() + 1); 
        prayerDate.setHours(parsed.h, parsed.m, 0, 0);

        upcoming = {
          prayerName: PRAYER_MAP[key],
          prayerTime: prayerDate,
          remainingTimeMs: prayerDate.getTime() - now.getTime(),
          isTomorrow: true
        };
      }
    }

    setNextPrayer(upcoming);
  }, []);

  const handleTimerExpire = useCallback(() => {
    if (prayerData.length === 0) return;

    const date = new Date();
    const todayData = prayerData.find((d: AladhanData) => {
        const dPart = d.date.gregorian.date.split('-')[0];
        return parseInt(dPart) === date.getDate();
    });

    if (todayData) {
        const tomorrowDate = new Date(date);
        tomorrowDate.setDate(date.getDate() + 1);
        const tomorrowData = prayerData.find((d: AladhanData) => {
            const dPart = d.date.gregorian.date.split('-')[0];
            return parseInt(dPart) === tomorrowDate.getDate();
        });
        
        calculateNextPrayer(todayData, tomorrowData);
    }
  }, [prayerData, calculateNextPrayer]);

  const schedulePrayerNotifications = useCallback(async (data: AladhanData[]) => {
     if (!isNative()) return; 

     const configStr = localStorage.getItem('notificationConfig');
     const verseEnabled = localStorage.getItem('verseNotificationEnabled') === 'true';

     await cancelAllNotifications();
     
     if (verseEnabled) {
         await scheduleDailyVerseNotification(true);
     }

     if (!configStr || data.length === 0) return;
     
     const config: NotificationConfig = JSON.parse(configStr);
     const now = new Date();

     const currentDayIndex = data.findIndex(d => {
         const dPart = d.date.gregorian.date.split('-')[0];
         return parseInt(dPart) === now.getDate();
     });

     const safeStartIndex = currentDayIndex !== -1 ? currentDayIndex : 0;
     const targetDays = data.slice(safeStartIndex, safeStartIndex + 3); 

     for (const dayData of targetDays) {
        const dateParts = dayData.date.gregorian.date.split('-');
        const day = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]) - 1;
        const year = parseInt(dateParts[2]);

        for (const key of ORDERED_PRAYERS) {
            const settings = config[key];
            if (!settings) continue;

            const timeStr = (dayData.timings as any)[key];
            const parsedTime = parseTime(timeStr);
            if (!parsedTime) continue;

            const prayerDate = new Date(year, month, day, parsedTime.h, parsedTime.m, 0);
            const baseIdStr = `${month+1}${day}${parsedTime.h.toString().padStart(2,'0')}${parsedTime.m.toString().padStart(2,'0')}`;
            
            if (settings.enabled && settings.minutesBefore > 0) {
                const notificationDate = new Date(prayerDate.getTime() - (settings.minutesBefore * 60000));
                
                if (notificationDate.getTime() > now.getTime()) {
                    const id = parseInt(`1${baseIdStr}`);
                    await scheduleNotification(
                        id, 
                        "Namaz Vakti Hatırlatıcı", 
                        `${PRAYER_MAP[key]} vaktine ${settings.minutesBefore} dakika kaldı.`, 
                        notificationDate
                    );
                }
            }

            if (settings.notifyOnTime) {
                if (prayerDate.getTime() > now.getTime()) {
                    const id = parseInt(`2${baseIdStr}`);
                    await scheduleNotification(
                        id,
                        PRAYER_MAP[key] + " Vakti",
                        `${PRAYER_MAP[key]} vakti girdi. Haydi namaza!`,
                        prayerDate
                    );
                }
            }
        }
     }
  }, []);

  useEffect(() => {
    const checkHolidayNotifications = () => {
      const holidays = getUpcomingHolidays();
      const nearHolidays = holidays.filter(h => h.daysLeft >= 0 && h.daysLeft <= 14);
      setUpcomingAlerts(nearHolidays);

      const lastCheck = localStorage.getItem('last_holiday_check');
      const today = new Date().toDateString();
      
      if (lastCheck !== today) {
        const alertHoliday = holidays.find(h => h.daysLeft === 1 || h.daysLeft === 0);
        if (alertHoliday) {
           let msg = `${alertHoliday.name} bugün!`;
           if (alertHoliday.daysLeft === 1) msg = `${alertHoliday.name} yarın!`;
           sendNotification("Dini Gün Hatırlatması", msg);
        }
        localStorage.setItem('last_holiday_check', today);
      }
    };
    
    setTimeout(checkHolidayNotifications, 2000);
  }, []);


  const initApp = useCallback(async (city: string | null, district: string | null, lat?: number, lng?: number) => {
    setLoading(true);
    setError(null);
    setIsOfflineMode(false);
    
    try {
      const date = new Date();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      let response;
      let currentCoords = { lat: 41.0082, lng: 28.9784 }; 
      let newLocationName = '';

      if (lat && lng) {
        response = await fetchPrayerCalendar(lat, lng, month, year);
        newLocationName = `GPS Konumu`;
        currentCoords = { lat, lng };
      } else if (city) {
        newLocationName = district ? `${city}, ${district}` : city;
        const preciseCoords = await fetchCityCoordinates(city, district || undefined);
        if (preciseCoords) currentCoords = preciseCoords;

        try {
             const queryLocation = (district && district !== 'Merkez') ? district : city;
             response = await fetchPrayerCalendarByCity(queryLocation, 'Turkey', month, year);
             if (!preciseCoords && response.data && response.data[0]?.meta) {
                 currentCoords = {
                     lat: response.data[0].meta.latitude,
                     lng: response.data[0].meta.longitude
                 };
             }
        } catch (cityErr) {
             console.warn("City name lookup failed, falling back to coordinates", cityErr);
             if (preciseCoords) {
                 response = await fetchPrayerCalendar(preciseCoords.lat, preciseCoords.lng, month, year);
             } else {
                 throw cityErr;
             }
        }
        
        const saved = localStorage.getItem('savedLocations');
        if ((!saved || JSON.parse(saved).length === 0) && district) {
           const loc = { city, district };
           localStorage.setItem('savedLocations', JSON.stringify([loc]));
        }

      } else {
        response = await fetchPrayerCalendarByCity('Istanbul', 'Turkey', month, year);
        newLocationName = 'İstanbul';
      }

      setLocationName(newLocationName);
      setCoords(currentCoords);

      if (response.code === 200 && response.data) {
        setPrayerData(response.data);
        localStorage.setItem('offline_prayerData', JSON.stringify(response.data));
        localStorage.setItem('offline_locationName', newLocationName);
        localStorage.setItem('offline_timestamp', Date.now().toString());

        const todayData = response.data.find((d: AladhanData) => {
            const dPart = d.date.gregorian.date.split('-')[0];
            return parseInt(dPart) === date.getDate();
        });

        if (todayData) {
            const tomorrowDate = new Date(date);
            tomorrowDate.setDate(date.getDate() + 1);
            const tomorrowData = response.data.find((d: AladhanData) => {
                const dPart = d.date.gregorian.date.split('-')[0];
                return parseInt(dPart) === tomorrowDate.getDate();
            });

            calculateNextPrayer(todayData, tomorrowData);
            schedulePrayerNotifications(response.data);
        }
      } else {
        setError('Namaz vakitleri alınamadı.');
      }
    } catch (err) {
      console.error("Network error, attempting offline load", err);
      const cachedData = localStorage.getItem('offline_prayerData');
      const cachedLoc = localStorage.getItem('offline_locationName');
      
      if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          setPrayerData(parsedData);
          if (cachedLoc) setLocationName(cachedLoc);
          setIsOfflineMode(true);
          
          const date = new Date();
          const todayData = parsedData.find((d: AladhanData) => {
            const dPart = d.date.gregorian.date.split('-')[0];
            return parseInt(dPart) === date.getDate();
          });

          if (todayData) {
            const tomorrowDate = new Date(date);
            tomorrowDate.setDate(date.getDate() + 1);
            const tomorrowData = parsedData.find((d: AladhanData) => {
                const dPart = d.date.gregorian.date.split('-')[0];
                return parseInt(dPart) === tomorrowDate.getDate();
            });
            calculateNextPrayer(todayData, tomorrowData);
            schedulePrayerNotifications(parsedData);
          }
      } else {
          setError('Veri alınırken hata oluştu ve kayıtlı veri bulunamadı.');
      }
    } finally {
      setLoading(false);
      setLastFetchTime(Date.now());
    }
  }, [calculateNextPrayer, schedulePrayerNotifications]);

  useEffect(() => {
    if (Date.now() - lastFetchTime > 30 * 60 * 1000 || prayerData.length === 0) {
        const savedLat = localStorage.getItem('gpsLat');
        const savedLng = localStorage.getItem('gpsLng');
        if (savedLat && savedLng) {
            initApp(null, null, parseFloat(savedLat), parseFloat(savedLng));
        } else if (selectedCity) {
            initApp(selectedCity, selectedDistrict);
        } else {
            initApp('Istanbul', 'Merkez'); 
        }
    }
    if (!verse) {
        fetchDailyVerse().then(setVerse);
    }
  }, [selectedCity, selectedDistrict, initApp, verse, lastFetchTime, prayerData.length]);

  const handleRefresh = () => {
     setLastFetchTime(0); 
     const savedLat = localStorage.getItem('gpsLat');
     const savedLng = localStorage.getItem('gpsLng');
     if (savedLat && savedLng) {
        initApp(null, null, parseFloat(savedLat), parseFloat(savedLng));
     } else {
        initApp(selectedCity || 'Istanbul', selectedDistrict || 'Merkez');
     }
  };

  const handleCitySelect = (city: string, district?: string) => {
    localStorage.removeItem('gpsLat');
    localStorage.removeItem('gpsLng');
    localStorage.setItem('selectedCity', city);
    if (district) localStorage.setItem('selectedDistrict', district);
    setSelectedCity(city);
    setSelectedDistrict(district || null);
    initApp(city, district || null);
  };

  const handleGPSSelect = async () => {
    setLoading(true);
    try {
      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });
      const { latitude, longitude } = coordinates.coords;
      localStorage.setItem('gpsLat', latitude.toString());
      localStorage.setItem('gpsLng', longitude.toString());
      localStorage.removeItem('selectedCity');
      localStorage.removeItem('selectedDistrict');
      setSelectedCity(null);
      setSelectedDistrict(null);
      initApp(null, null, latitude, longitude);
    } catch (err) {
      console.error("Native Geolocation Error", err);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                initApp(null, null, latitude, longitude);
            },
            () => {
                setError('Konum alınamadı. Lütfen ayarlardan izin verin.');
                setLoading(false);
            }
        );
      } else {
        setError('Konum alınamadı. Lütfen şehir seçin.');
        setLoading(false);
      }
    }
  };

  const getCurrentDayData = () => {
      if (!prayerData.length) return null;
      const today = new Date().getDate();
      return prayerData.find((d) => parseInt(d.date.gregorian.date.split('-')[0]) === today) || null;
  };

  const closeTool = () => {
      setActiveTool(null);
      if (prayerData.length > 0) {
          schedulePrayerNotifications(prayerData).then(() => {
              showToast('Bildirimler güncellendi.');
          });
      }
  };

  return (
    <div className="min-h-screen bg-[#f5f2eb] dark:bg-[#0c1218] text-gray-800 dark:text-gray-100 font-sans transition-colors duration-300 selection:bg-teal-500 selection:text-white relative overflow-hidden flex flex-col">
      
      <div className="fixed inset-0 z-0 bg-islamic-pattern opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-repeat"></div>

      {toastMessage && (
        <div className="fixed bottom-40 left-1/2 -translate-x-1/2 bg-gray-800 dark:bg-slate-200 text-white dark:text-slate-900 px-6 py-3 rounded-full shadow-xl text-sm font-bold z-[120] animate-in slide-in-from-bottom-2 fade-in duration-300 flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-400 dark:text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
            {toastMessage}
        </div>
      )}

      {/* Header - Only on Main Screen */}
      {!activeTool && (
        <header className="fixed top-0 left-0 right-0 z-50 pt-[env(safe-area-inset-top)] bg-[#f5f2eb]/95 dark:bg-[#0c1218]/95 backdrop-blur-md border-b border-amber-200/50 dark:border-slate-800 transition-all duration-300">
            <div className="h-16 px-4 max-w-screen-xl mx-auto flex items-center justify-between">
                
                <button 
                  onClick={() => setIsLocationModalOpen(true)}
                  className="flex flex-col items-start group"
                >
                    <div className="flex items-center gap-1.5 text-teal-800 dark:text-amber-500 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        <span className="font-bold text-sm tracking-wide max-w-[140px] truncate">{locationName}</span>
                        <svg className="w-3 h-3 opacity-50 group-hover:translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        
                        {isOfflineMode && (
                            <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-500 ml-1 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 011.414 0l4.242 4.242" /></svg>
                                <span>Offline</span>
                            </div>
                        )}
                    </div>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium pl-0.5">
                        {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })}
                    </span>
                </button>

                <div className="flex items-center gap-2">
                    <button 
                      onClick={handleRefresh}
                      className="p-2 rounded-full bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-400 shadow-sm border border-gray-100 dark:border-slate-700 hover:rotate-180 transition-transform duration-500"
                      title="Vakitleri Yenile"
                    >
                        <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </button>

                    <button
                      onClick={toggleDarkMode}
                      className="p-2 rounded-full bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-amber-400 transition-colors border border-indigo-100 dark:border-slate-700"
                    >
                      {darkMode ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                      ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                      )}
                    </button>
                </div>
            </div>
        </header>
      )}

      {/* Main Scroll Content - Increased pb for higher navbar */}
      <main className={`flex-1 relative z-10 px-4 max-w-screen-xl mx-auto flex flex-col items-center gap-4 overflow-y-auto pb-[200px] ${activeTool ? 'hidden' : 'pt-[74px]'}`}>
        
        {error && (
          <div className="w-full bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {upcomingAlerts.length > 0 && (
            <button 
                onClick={() => setActiveTool('holidays')}
                className="w-full relative overflow-hidden bg-gradient-to-r from-amber-500 to-orange-600 text-white p-3 rounded-xl shadow-lg shadow-orange-500/20 flex items-center justify-between group transition-transform hover:scale-[1.01]"
            >
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-10"></div>
                <div className="relative z-10 flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </div>
                    <div className="text-left">
                        <div className="text-xs font-bold text-orange-100 uppercase tracking-wide">Yaklaşan Dini Gün</div>
                        <div className="font-bold text-lg leading-tight">{upcomingAlerts[0].name}</div>
                    </div>
                </div>
                <div className="relative z-10 flex flex-col items-center justify-center bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1">
                    <span className="text-xl font-bold font-cinzel">{upcomingAlerts[0].daysLeft}</span>
                    <span className="text-sm font-bold uppercase">Gün</span>
                </div>
            </button>
        )}

        <CountdownTimer nextPrayer={nextPrayer} onExpire={handleTimerExpire} />
        
        <DailyList 
            data={getCurrentDayData()} 
            currentPrayerName={nextPrayer && !nextPrayer.isTomorrow ? PRAYER_MAP[Object.keys(PRAYER_MAP).find(k => PRAYER_MAP[k] === nextPrayer.prayerName) || ''] : ''} 
        />
        <VerseCard verse={verse} />
        <WeeklyList data={prayerData} />

      </main>

      {/* Floating Bottom Navigation - Positioned 85px from bottom as requested */}
      <div className="fixed left-0 right-0 z-[130] flex justify-center pointer-events-none transition-all duration-300 bottom-[85px]">
         <nav className="bg-white/95 dark:bg-[#1e293b]/95 backdrop-blur-xl border border-gray-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-md px-2 py-3 flex items-center justify-around pointer-events-auto transform transition-all hover:scale-[1.02] mx-4">
            <button 
                onClick={() => { setActiveTool(null); setIsMenuOpen(false); }}
                className={`flex flex-col items-center gap-1 transition-colors ${activeTool === null && !isMenuOpen ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'}`}
            >
                <svg className="w-6 h-6" fill={activeTool === null && !isMenuOpen ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                <span className="text-[10px] font-bold">Ana Sayfa</span>
            </button>

            <button 
                onClick={() => { setActiveTool('quran'); setIsMenuOpen(false); }}
                className={`flex flex-col items-center gap-1 transition-colors ${activeTool === 'quran' ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'}`}
            >
                <svg className="w-6 h-6" fill={activeTool === 'quran' ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                <span className="text-[10px] font-bold">Kuran</span>
            </button>

            <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`flex flex-col items-center gap-1 transition-colors ${isMenuOpen ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400 dark:text-gray-500 hover:text-teal-600 dark:hover:text-teal-400'}`}
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                <span className="text-[10px] font-bold">Araçlar</span>
            </button>
         </nav>
      </div>

      <LocationModal 
        isOpen={isLocationModalOpen} 
        onClose={() => setIsLocationModalOpen(false)}
        onSelectCity={handleCitySelect}
        onSelectGPS={handleGPSSelect}
        currentCity={selectedCity}
        currentDistrict={selectedDistrict}
      />

      {/* Menu Modal - Adjusted mb to start from navbar top */}
      <MenuModal 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        onSelectTool={(tool) => {
            setActiveTool(tool);
            setIsMenuOpen(false);
        }}
      />

      {/* Tool Container - Content Layer */}
      {activeTool && (
         <div className="fixed inset-0 z-[70] bg-[#f5f2eb] dark:bg-[#0c1218] flex flex-col animate-in slide-in-from-right duration-300 pt-[env(safe-area-inset-top)] pb-[160px]">
            {activeTool !== 'quran' && (
                <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-slate-800 bg-[#f5f2eb] dark:bg-[#0c1218] shrink-0">
                    <button onClick={closeTool} className="flex items-center text-gray-600 dark:text-gray-300">
                        <svg className="w-6 h-6 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        Geri
                    </button>
                    <h2 className="font-bold text-lg text-gray-800 dark:text-white capitalize font-sans">
                        {activeTool === 'qibla' && 'Kıble Pusulası'}
                        {activeTool === 'holidays' && 'Dini Günler'}
                        {activeTool === 'notifications' && 'Bildirim Ayarları'}
                        {activeTool === 'dhikr' && 'Zikirmatik'}
                        {activeTool === 'contact' && 'İletişim & Destek'}
                    </h2>
                    <div className="w-6"></div>
                </div>
            )}
            
            <div className="flex-1 overflow-y-auto relative">
                {activeTool === 'qibla' && coords && <QiblaCompass latitude={coords.lat} longitude={coords.lng} />}
                {activeTool === 'holidays' && <HolidayCountdown />}
                {activeTool === 'notifications' && <NotificationSettings />}
                {activeTool === 'dhikr' && <Zikirmatik />}
                {activeTool === 'contact' && <Contact />}
                {activeTool === 'quran' && <QuranReader />}
            </div>
         </div>
      )}

    </div>
  );
};

export default App;
