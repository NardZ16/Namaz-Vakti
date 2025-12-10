
import React, { useState, useEffect } from 'react';
import { triggerHaptic } from '../services/nativeService';

const Zikirmatik: React.FC = () => {
  const [count, setCount] = useState<number>(() => {
    try {
        return parseInt(localStorage.getItem('zikirmatik_count') || '0', 10);
    } catch {
        return 0;
    }
  });
  
  const [resetState, setResetState] = useState<'IDLE' | 'CONFIRM'>('IDLE');

  useEffect(() => {
    localStorage.setItem('zikirmatik_count', count.toString());
  }, [count]);

  useEffect(() => {
    if (resetState === 'CONFIRM') {
        const timer = setTimeout(() => setResetState('IDLE'), 3000);
        return () => clearTimeout(timer);
    }
  }, [resetState]);

  const increment = () => {
    setCount(c => c + 1);
    triggerHaptic('medium');
    if (resetState === 'CONFIRM') setResetState('IDLE');
  };

  const handleReset = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (resetState === 'IDLE') {
        setResetState('CONFIRM');
    } else {
        setCount(0);
        setResetState('IDLE');
        triggerHaptic('success');
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 pb-24 bg-[#f5f2eb] dark:bg-slate-900/50">
      
      {/* Changed w-72 to max-w-sm w-full to be responsive, remove fixed h-[30rem] to h-auto or min-h */}
      <div className="bg-[#fdfbf7] dark:bg-slate-800 rounded-[3rem] shadow-2xl p-6 w-full max-w-[300px] min-h-[450px] flex flex-col items-center justify-between border-8 border-gray-200 dark:border-slate-600 relative">
        
        {/* Screen Area - Ensure text fits */}
        <div className="w-full bg-[#9ea7ad] dark:bg-slate-700 rounded-xl p-4 mb-4 shadow-inner border-4 border-[#8b949a] dark:border-slate-600 relative overflow-hidden flex items-center justify-center h-28">
             <div className="absolute inset-0 bg-black opacity-5 pointer-events-none"></div>
             {/* Dynamic font size based on length */}
             <span className={`font-mono font-black text-slate-800 dark:text-slate-200 tracking-widest drop-shadow-sm block text-center select-none ${count.toString().length > 4 ? 'text-4xl' : 'text-5xl'}`}>
                {count.toString().padStart(5, '0')}
             </span>
        </div>

        {/* Big Button Area */}
        <div className="flex-1 flex items-center justify-center w-full relative my-2">
             <button 
              onClick={increment}
              className="w-40 h-40 rounded-full bg-emerald-500 dark:bg-emerald-600 active:bg-emerald-600 dark:active:bg-emerald-700 active:scale-95 transition-all shadow-[0_10px_20px_rgba(0,0,0,0.2)] border-[6px] border-emerald-400 dark:border-emerald-700 flex items-center justify-center z-10 outline-none tap-highlight-transparent"
              aria-label="Say"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <div className="w-32 h-32 rounded-full border-2 border-emerald-400/30 pointer-events-none"></div>
            </button>
        </div>

        {/* Reset Button */}
        <div className="w-full flex justify-end items-center px-2 pt-4">
           <button 
            type="button"
            onClick={handleReset}
            className={`
                group relative flex items-center justify-center rounded-full transition-all duration-200 shadow-md border-2
                ${resetState === 'CONFIRM' 
                    ? 'w-auto px-4 h-12 bg-red-600 border-red-700 text-white' 
                    : 'w-12 h-12 bg-gray-200 dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 hover:border-red-200'}
            `}
          >
              {resetState === 'CONFIRM' ? (
                  <span className="text-xs font-bold whitespace-nowrap animate-pulse">EMİN MİSİN?</span>
              ) : (
                  <svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              )}
          </button>
          {resetState === 'IDLE' && (
              <span className="absolute bottom-8 right-24 text-[10px] text-gray-400 uppercase tracking-wider font-bold mr-2 pointer-events-none select-none">Sıfırla</span>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default Zikirmatik;