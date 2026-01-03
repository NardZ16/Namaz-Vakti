
import React from 'react';

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTool: (tool: string) => void;
  isAdVisible?: boolean; 
}

const MenuModal: React.FC<MenuModalProps> = ({ isOpen, onClose, onSelectTool, isAdVisible = false }) => {
  const tools = [
    { id: 'quran', name: 'Kuran-ı Kerim', icon: '📖', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    { id: 'holidays', name: 'Dini Günler', icon: '📅', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    { id: 'notifications', name: 'Bildirimler', icon: '🔔', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    { id: 'qibla', name: 'Kıble Pusulası', icon: '🧭', color: 'bg-sky-100 text-sky-700 border-sky-200' },
    { id: 'dhikr', name: 'Zikirmatik', icon: '📿', color: 'bg-rose-100 text-rose-700 border-rose-200' },
    { id: 'contact', name: 'İletişim', icon: '📩', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  ];

  // Navbar'ın konumuyla senkronize bottom değeri
  // Reklam varsa Navbar yerden 60px yukardadır, menü de oradan başlamalı.
  // Reklam yoksa Navbar yerden 24px (bottom-6) yukardadır, menü oradan başlamalı.
  const bottomOffset = isAdVisible ? 'calc(60px + 64px)' : 'calc(24px + 64px)';

  return (
    <div className={`fixed inset-0 z-[200] flex flex-col justify-end items-center transition-all duration-500 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" 
        onClick={onClose}
      ></div>
      
      {/* Modal Content */}
      <div 
        className={`w-full max-w-lg bg-white dark:bg-[#1e293b] rounded-t-[2.5rem] rounded-b-[1.5rem] p-6 pt-8 shadow-[0_-20px_50px_rgba(0,0,0,0.3)] transition-all duration-500 ease-out border border-white/20 dark:border-slate-700 relative overflow-hidden mx-4 ${isOpen ? 'translate-y-0 scale-100' : 'translate-y-10 scale-95 opacity-0'}`}
        style={{
          position: 'fixed',
          bottom: isOpen ? bottomOffset : '-100%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 32px)' // Yanlardan boşluk bırakarak havada duran modal yapısı
        }}
      >
        
        {/* Drag Handle Indicator */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full"></div>

        <div className="flex justify-between items-center mb-8 mt-2 relative z-10">
           <h3 className="text-2xl font-sans font-bold text-teal-900 dark:text-amber-500">Araçlar Menüsü</h3>
           <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-slate-700 rounded-full text-gray-500 hover:text-red-500 transition-colors">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 relative z-10">
          {tools.map((tool, index) => (
            <button
              key={tool.id}
              onClick={() => onSelectTool(tool.id)}
              className="group relative flex flex-col items-center justify-center p-6 rounded-2xl bg-white dark:bg-slate-800 shadow-sm hover:shadow-lg border border-gray-100 dark:border-slate-700 transition-all active:scale-95"
            >
              <div className={`w-14 h-14 rounded-2xl group-hover:scale-110 transition-transform mb-3 flex items-center justify-center text-2xl border-2 ${tool.color}`}>
                {tool.icon}
              </div>
              <span className="font-sans font-bold text-slate-700 dark:text-slate-200 text-sm tracking-tight">{tool.name}</span>
            </button>
          ))}
        </div>

        <div className="h-2"></div>
      </div>
    </div>
  );
};

export default MenuModal;
