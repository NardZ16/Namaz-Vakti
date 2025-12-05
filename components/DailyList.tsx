
import React from 'react';
import { AladhanData } from '../types';

interface DailyListProps {
  data: AladhanData | null;
  currentPrayerName: string;
}

const TR_NAMES: Record<string, string> = {
  Fajr: 'İmsak',
  Sunrise: 'Güneş',
  Dhuhr: 'Öğle',
  Asr: 'İkindi',
  Maghrib: 'Akşam',
  Isha: 'Yatsı'
};

const DISPLAY_KEYS = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

const DailyList: React.FC<DailyListProps> = ({ data, currentPrayerName }) => {
  if (!data) return null;

  const timings = data.timings;

  const formatTime = (time: string) => {
      if (!time) return '--:--';
      return time.split(' ')[0];
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-4 px-2">
        <div className="w-1 h-5 bg-amber-500 rounded-full"></div>
        <h2 className="text-teal-900 dark:text-amber-500 font-sans font-bold text-xl">Günün Vakitleri</h2>
      </div>
      
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {DISPLAY_KEYS.map((key) => {
          const trName = TR_NAMES[key];
          const time = formatTime((timings as any)[key]);
          const isActive = currentPrayerName === trName;

          return (
            <div 
              key={key} 
              className={`
                relative overflow-hidden group rounded-t-2xl rounded-b-lg border-b-[6px] transition-all duration-300
                ${isActive 
                  ? 'bg-teal-700 border-amber-500 -translate-y-2 shadow-xl shadow-teal-700/30 cursor-default' 
                  : 'bg-[#fdfbf7] dark:bg-[#1e293b] border-stone-200 dark:border-slate-700 hover:border-orange-500 hover:-translate-y-1 hover:shadow-md cursor-pointer'
                }
              `}
            >
              {/* Active Background Pattern */}
              {isActive && (
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]"></div>
              )}

              <div className="p-3 flex flex-col items-center justify-center relative z-10">
                 <span className={`text-[11px] uppercase font-bold tracking-wider mb-1 font-sans ${isActive ? 'text-amber-300' : 'text-slate-400 group-hover:text-orange-500 transition-colors'}`}>
                    {trName}
                 </span>
                 <span className={`text-lg font-cinzel font-bold ${isActive ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>
                    {time}
                 </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DailyList;
