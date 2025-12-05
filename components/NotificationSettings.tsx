
import React, { useState, useEffect } from 'react';
import { NotificationConfig } from '../types';
import { requestNotificationPermission } from '../services/notificationService';

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
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
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
    localStorage.setItem('notificationConfig', JSON.stringify(config));
  }, [config]);

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setPermission(granted ? 'granted' : 'denied');
  };

  const togglePrayer = (key: string) => {
    setConfig(prev => ({
      ...prev,
      [key]: { ...prev[key], enabled: !prev[key].enabled }
    }));
    if (permission === 'default') handleRequestPermission();
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
    <div className="h-full overflow-y-auto p-4 pb-44">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Bildirim Ayarları</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Vakitlerden önce bildirim ve ses alın.</p>

      {permission !== 'granted' && permission !== 'denied' && (
        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl mb-6 border border-amber-200 dark:border-amber-800">
          <p className="text-amber-800 dark:text-amber-200 mb-2 text-sm font-semibold">Bildirim izni gerekli</p>
          <button 
            onClick={handleRequestPermission}
            className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-600 transition-colors"
          >
            Bildirimlere İzin Ver
          </button>
        </div>
      )}

      {permission === 'denied' && (
         <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl mb-6 border border-red-200 dark:border-red-800">
            <p className="text-red-800 dark:text-red-200 text-xs">
               Bildirimlere tarayıcı ayarlarından izin verilmedi. Sesler çalmaya devam edebilir ancak görsel uyarı gelmeyebilir.
            </p>
         </div>
      )}

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
