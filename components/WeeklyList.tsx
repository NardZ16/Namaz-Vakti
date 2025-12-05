import React, { useState } from 'react';
import { AladhanData } from '../types';

interface WeeklyListProps {
  data: AladhanData[];
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
const TR_DAYS: Record<string, string> = {
    'Monday': 'Pazartesi',
    'Tuesday': 'Salı',
    'Wednesday': 'Çarşamba',
    'Thursday': 'Perşembe',
    'Friday': 'Cuma',
    'Saturday': 'Cumartesi',
    'Sunday': 'Pazar'
};

const WeeklyList: React.FC<WeeklyListProps> = ({ data }) => {
  const [isOpen, setIsOpen] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const weekData = data.filter(d => {
    if (!d.date.gregorian.date) return false;
    const dateParts = d.date.gregorian.date.split('-');
    if (dateParts.length !== 3) return false;
    const dateObj = new Date(
      parseInt(dateParts[2], 10), 
      parseInt(dateParts[1], 10) - 1, 
      parseInt(dateParts[0], 10)
    );
    return dateObj >= today;
  }).slice(0, 7);

  const formatTime = (time: string) => {
    if (!time) return '-';
    return time.split(' ')[0];
  };

  const formatDate = (dateStr: string) => {
     const parts = dateStr.split('-');
     if (parts.length !== 3) return dateStr;
     const day = parseInt(parts[0], 10);
     const month = parseInt(parts[1], 10);
     
     const date = new Date();
     date.setDate(day);
     date.setMonth(month - 1);
     return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
  };

  if (weekData.length === 0) return null;

  return (
    <div className="w-full bg-[#fdfbf7] dark:bg-[#1e293b] rounded-2xl shadow-sm border border-amber-200 dark:border-slate-700 overflow-hidden">
       <button 
         onClick={() => setIsOpen(!isOpen)}
         className="w-full p-5 flex items-center justify-between bg-[#fdfbf7] dark:bg-[#1e293b] hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors"
       >
         <div className="flex items-center gap-3">
            <div className="bg-teal-50 dark:bg-teal-900/30 p-2 rounded-lg text-teal-700 dark:text-teal-400 border border-teal-100 dark:border-transparent">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <h2 className="text-teal-900 dark:text-amber-500 font-sans font-bold text-lg">Haftalık İmsakiye</h2>
         </div>
         <div className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
           <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
           </svg>
         </div>
       </button>
       
       <div className={`transition-all duration-500 ease-in-out overflow-hidden bg-[#f5f2eb] dark:bg-[#0c1218] ${isOpen ? 'max-h-[2000px] border-t border-amber-100 dark:border-slate-700' : 'max-h-0'}`}>
         <div className="p-3 space-y-3">
           {weekData.map((day, index) => {
             const enDay = day.date.gregorian.weekday.en;
             const trDay = TR_DAYS[enDay] || enDay;
             const dateStr = day.date.gregorian.date;
             const isFriday = enDay === 'Friday';
             
             return (
               <div key={index} className={`rounded-xl p-4 border ${isFriday ? 'bg-teal-50/50 dark:bg-teal-900/10 border-teal-100 dark:border-teal-900/30' : 'bg-white dark:bg-[#1e293b] border-gray-100 dark:border-slate-700'}`}>
                 <div className="flex justify-between items-baseline mb-4 border-b border-gray-100 dark:border-slate-600 pb-2 border-dashed">
                    <div className="flex items-center gap-2">
                        <span className="font-sans font-bold text-teal-800 dark:text-amber-500 text-lg">{formatDate(dateStr)}</span>
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded font-sans ${isFriday ? 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300' : 'text-slate-400'}`}>
                        {trDay}
                    </span>
                 </div>
                 <div className="grid grid-cols-6 gap-2 text-center">
                   {DISPLAY_KEYS.map(key => (
                     <div key={key} className="flex flex-col items-center">
                       <span className="text-[9px] uppercase text-slate-400 font-bold mb-1 font-sans">{TR_NAMES[key]}</span>
                       <span className="text-sm font-cinzel font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                          {formatTime((day.timings as any)[key])}
                       </span>
                     </div>
                   ))}
                 </div>
               </div>
             );
           })}
         </div>
       </div>
    </div>
  );
};

export default WeeklyList;