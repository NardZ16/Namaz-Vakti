
import React, { useState, useEffect } from 'react';
import { NotificationConfig } from '../types';
import { requestNotificationPermission, checkNotificationPermission, testNotification, scheduleDailyVerseNotification } from '../services/notificationService';
import { isNative } from '../services/nativeService';

const PRAYER_KEYS = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const PRAYER_NAMES: Record<string, string> = {
  Fajr: 'İmsak',
  Sunrise: 'Güneş',
  Dhuhr: 'Öğle',
  Asr: 'İkindi',
  Maghrib: 'Akşam',
  Isha: 'Yatsı'
};

const SOUND_OPTIONS = [
  { id: 'default', name: 'Sessiz / Sistem' },
  { id: 'beep', name: 'Bip Sesi' },
  { id: 'bird', name: 'Kuş Sesi' },
  { id: 'water', name: 'Su Sesi' },
  { id: 'adhan', name: 'Ezan Sesi (Kısa)' },
];

const NotificationSettings: React.FC = () => {
  const [permission, setPermission] = useState<string>('default');
  const [verseEnabled, setVerseEnabled] = useState<boolean>(() => {
    return localStorage.getItem('verseNotificationEnabled') === 'true';
  });

  const [config, setConfig] = useState<NotificationConfig>(() => {
    const saved = localStorage.getItem('notificationConfig');
    if (saved) return JSON.parse(saved);
    
    const initial: NotificationConfig = {};
    PRAYER_KEYS.forEach(key => {
      initial[key] = { enabled: true, minutesBefore: 30, sound: 'beep' };
    });
    return initial;
  });

  useEffect(() => {
    checkNotificationPermission().then(granted => {
        setPermission(granted ? 'granted' : 'default');
    });
  }, []);

  useEffect(() => {
    localStorage.setItem('notificationConfig', JSON.stringify(config));
  }, [config]);

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setPermission(granted ? 'granted' : 'denied');
  };

  const handleTestNotification = async () => {
      if (permission !== 'granted') {
          alert("Önce bildirim izni vermelisiniz.");
          handleRequestPermission();
          return;
      }
      
      alert("5 saniye içinde bir test bildirimi gönderilecek. Uygulamayı arka plana atıp bekleyebilirsiniz.");
      await testNotification();
  };

  const togglePrayer = (key: string) => {
    setConfig(prev => ({
      ...prev,
      [key]: { ...prev[key], enabled: !prev[key].enabled }
    }));
    if (permission !== 'granted') handleRequestPermission();
  };

  const toggleVerseNotification = async () => {
      if (permission !== 'granted') {
          await handleRequestPermission();
      }
      const newState = !verseEnabled;
      setVerseEnabled(newState);
      localStorage.setItem('verseNotificationEnabled', String(newState));
      
      // Anlık olarak planlayıcıyı tetikle
      scheduleDailyVerseNotification(newState);
  };

  const updateMinutes = (key: string, min: number) => {
    setConfig(prev => ({
      ...prev,
      [key]: { ...prev[key], minutesBefore: min }
    }));
  };

  const updateSound = (key: string, sound: string) => {
    setConfig(prev => ({
      ...prev,
      [key]: { ...prev[key], sound: sound }
    }));
  };

  return (
    <div className="h-full overflow-y-auto p-4 pb-24">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Bildirim Ayarları</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Vakitlerden önce bildirim ve ses alın.</p>

      {/* İzin ve Test Alanı */}
      <div className="bg-amber-50 dark:bg-slate-800 p-4 rounded-xl mb-6 border border-amber-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300">İzin Durumu:</span>
              <span className={`text-xs font-bold px-2 py-1 rounded ${permission === 'granted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {permission === 'granted' ? 'İZİN VERİLDİ' : 'İZİN YOK'}
              </span>
          </div>
          
          <div className="flex gap-2">
            {permission !== 'granted' && (
                <button 
                    onClick={handleRequestPermission}
                    className="flex-1 bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-600 transition-colors"
                >
                    İzin İste
                </button>
            )}
            
            {isNative() && (
                <button 
                    onClick={handleTestNotification}
                    className="flex-1 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    Test Et
                </button>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-2 italic">Test butonuna basınca 5 saniye sonra bildirim gelir.</p>
      </div>

      {/* Diğer Bildirimler */}
      <div className="mb-6">
          <h3 className="font-bold text-gray-600 dark:text-gray-400 text-sm mb-3 uppercase tracking-wider">Diğer Bildirimler</h3>
          <div className="bg-white dark:bg-slate-700 p-4 rounded-xl border border-gray-100 dark:border-slate-600 shadow-sm">
             <div className="flex items-center justify-between">
                <div>
                   <span className="font-bold text-gray-700 dark:text-gray-200 block">Günün Ayeti / Meali</span>
                   <span className="text-xs text-gray-400">Her gün öğle saatlerinde bir ayet meali bildirimi al.</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={verseEnabled}
                      onChange={toggleVerseNotification}
                    />
                    <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${verseEnabled ? 'peer-checked:bg-emerald-500' : ''}`}></div>
                </label>
             </div>
          </div>
      </div>

      <h3 className="font-bold text-gray-600 dark:text-gray-400 text-sm mb-3 uppercase tracking-wider">Vakit Bildirimleri</h3>
      <div className="space-y-4">
        {PRAYER_KEYS.map(key => (
          <div key={key} className="bg-white dark:bg-slate-700 p-4 rounded-xl border border-gray-100 dark:border-slate-600 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-gray-700 dark:text-gray-200 text-lg">{PRAYER_NAMES[key]}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={config[key]?.enabled || false}
                  onChange={() => togglePrayer(key)}
                />
                <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${config[key]?.enabled ? 'peer-checked:bg-emerald-500' : ''}`}></div>
              </label>
            </div>
            
            {config[key]?.enabled && (
              <div className="space-y-3 bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg animate-in slide-in-from-top-2 duration-200">
                 {/* Time Slider */}
                 <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400 w-16">Süre:</span>
                    <div className="flex-1 flex items-center gap-2">
                        <input 
                        type="range" 
                        min="5" 
                        max="60" 
                        step="5"
                        value={config[key].minutesBefore}
                        onChange={(e) => updateMinutes(key, parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-600 accent-emerald-500"
                        />
                        <span className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 w-10 text-right">
                        {config[key].minutesBefore}dk
                        </span>
                    </div>
                 </div>

                 {/* Sound Selector */}
                 <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400 w-16">Ses:</span>
                    <select 
                        value={config[key].sound || 'default'} 
                        onChange={(e) => updateSound(key, e.target.value)}
                        className="flex-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-gray-200 text-sm rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                        {SOUND_OPTIONS.map(opt => (
                            <option key={opt.id} value={opt.id}>{opt.name}</option>
                        ))}
                    </select>
                 </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationSettings;
