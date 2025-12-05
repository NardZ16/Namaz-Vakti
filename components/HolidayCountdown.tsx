
import React from 'react';
import { getUpcomingHolidays } from '../data/holidays';
import { ReligiousHoliday } from '../types';

const HolidayCountdown: React.FC = () => {
  const holidays = getUpcomingHolidays();

  // 1. Separate Major Holidays (Pinned to Top) vs Standard Holidays
  // Since 'holidays' is already sorted by date from the data source,
  // filtering them preserves that date order within the groups.
  const majorHolidays = holidays.filter(h => 
    h.name.includes('Ramazan') || h.name.includes('Kurban')
  );

  const standardHolidays = holidays.filter(h => 
    !h.name.includes('Ramazan') && !h.name.includes('Kurban')
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    });
  };

  const renderFeaturedCard = (holiday: ReligiousHoliday & { daysLeft: number }) => {
    let gradientClass = '';

    if (holiday.name === 'Ramazan Başlangıcı') {
        // Special: Deep Violet/Amber for the holy month start (Spiritual/Night vibe)
        gradientClass = 'bg-gradient-to-br from-[#2e1065] via-[#581c87] to-[#d97706]';
    } else if (holiday.name.includes('Ramazan')) {
        // Ramazan Bayramı: Teal/Emerald (Celebration/Green vibe)
        gradientClass = 'bg-gradient-to-br from-teal-700 via-teal-600 to-emerald-500';
    } else {
        // Kurban: Indigo/Purple
        gradientClass = 'bg-gradient-to-br from-indigo-800 via-indigo-700 to-purple-600';
    }
    
    return (
        <div key={`${holiday.name}-${holiday.date}`} className={`relative w-full p-6 rounded-2xl shadow-xl overflow-hidden mb-4 group ${gradientClass} animate-in slide-in-from-bottom duration-500`}>
            {/* Pattern Overlay */}
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] mix-blend-overlay"></div>
            
            {/* Decorative Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 blur-3xl rounded-full translate-x-12 -translate-y-12"></div>

            <div className="relative z-10 flex flex-col items-center text-center text-white">
                <div className="inline-flex items-center gap-2 mb-2 opacity-80">
                     <span className="h-px w-8 bg-white/50"></span>
                     <span className="text-xs font-bold tracking-widest uppercase font-sans">Mübarek Gün</span>
                     <span className="h-px w-8 bg-white/50"></span>
                </div>

                <h3 className="text-3xl font-sans font-bold mb-1 drop-shadow-md">{holiday.name}</h3>
                
                <div className="text-sm font-medium bg-white/20 backdrop-blur-sm px-4 py-1 rounded-full border border-white/20 mb-6 font-sans">
                    {formatDate(holiday.date)}
                </div>
                
                <div className="flex flex-col items-center justify-center bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-md min-w-[120px] shadow-inner transform group-hover:scale-105 transition-transform duration-300">
                     <span className="text-5xl font-cinzel font-bold tracking-tighter drop-shadow-sm">{holiday.daysLeft}</span>
                     <span className="text-sm font-bold opacity-90 uppercase tracking-widest mt-1 font-sans">Gün Kaldı</span>
                </div>
            </div>
        </div>
    );
  };

  const renderStandardCard = (holiday: ReligiousHoliday & { daysLeft: number }) => (
    <div key={`${holiday.name}-${holiday.date}`} className="relative group bg-white dark:bg-[#1e293b] rounded-xl border border-amber-200 dark:border-slate-700 p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all hover:border-amber-400 dark:hover:border-amber-700 mb-3 animate-in slide-in-from-bottom duration-500">
      
      {/* Decorative left border accent */}
      <div className="absolute left-0 top-3 bottom-3 w-1 bg-amber-400/50 rounded-r-md group-hover:bg-amber-500 transition-colors"></div>

      <div className="pl-4">
        <h3 className="font-sans text-lg font-bold text-slate-800 dark:text-slate-200 group-hover:text-teal-700 dark:group-hover:text-amber-500 transition-colors">
            {holiday.name}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium flex items-center gap-1 font-sans">
          <svg className="w-3 h-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          {formatDate(holiday.date)}
        </p>
      </div>

      <div className="flex flex-col items-center justify-center bg-teal-50 dark:bg-slate-800 border border-teal-100 dark:border-slate-600 rounded-lg p-2 min-w-[70px]">
        <span className="text-2xl font-cinzel font-bold text-teal-700 dark:text-amber-500 leading-none">{holiday.daysLeft}</span>
        <span className="text-[9px] uppercase font-bold text-teal-800/60 dark:text-slate-400 mt-0.5 font-sans">Gün</span>
      </div>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto p-4 pb-44 scroll-smooth">
      <div className="max-w-md mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-6 pt-2">
            <h2 className="text-2xl font-sans font-bold text-teal-900 dark:text-amber-500">Dini Günler Takvimi</h2>
        </div>

        {/* 1. MAJOR HOLIDAYS (Fixed at top) */}
        <div className="mb-6 space-y-4">
             {majorHolidays.map(holiday => renderFeaturedCard(holiday))}
        </div>

        {/* Divider if needed */}
        {majorHolidays.length > 0 && standardHolidays.length > 0 && (
             <div className="flex items-center gap-4 mb-4 opacity-50">
                <div className="h-px flex-1 bg-gray-300 dark:bg-slate-700"></div>
                <span className="text-xs font-bold uppercase text-slate-400 font-sans">Diğer Günler</span>
                <div className="h-px flex-1 bg-gray-300 dark:bg-slate-700"></div>
             </div>
        )}

        {/* 2. STANDARD HOLIDAYS (Listed below) */}
        <div className="space-y-1">
            {standardHolidays.map(holiday => renderStandardCard(holiday))}
            
            {holidays.length === 0 && (
                <div className="text-center py-10">
                   <div className="inline-block p-4 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-400 mb-3">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                   </div>
                   <p className="text-gray-500 dark:text-gray-400 text-sm font-medium font-sans">Yakın zamanda özel bir dini gün bulunmuyor.</p>
                </div>
            )}
        </div>

        <div className="mt-8 text-center opacity-50">
             <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-sans">~ {new Date().getFullYear()} / {new Date().getFullYear() + 1} ~</span>
        </div>
      </div>
    </div>
  );
};

export default HolidayCountdown;
