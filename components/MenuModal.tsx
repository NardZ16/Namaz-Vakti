
import React from 'react';

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTool: (tool: string) => void;
}

const MenuModal: React.FC<MenuModalProps> = ({ isOpen, onClose, onSelectTool }) => {
  const tools = [
    { id: 'quran', name: 'Kuran-ı Kerim', icon: '📖', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    { id: 'holidays', name: 'Dini Günler', icon: '📅', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    { id: 'notifications', name: 'Bildirimler', icon: '🔔', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    { id: 'qibla', name: 'Kıble Pusulası', icon: '🧭', color: 'bg-sky-100 text-sky-700 border-sky-200' },
    { id: 'dhikr', name: 'Zikirmatik', icon: '📿', color: 'bg-rose-100 text-rose-700 border-rose-200' },
    { id: 'contact', name: 'İletişim', icon: '📩', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  ];

  return (
    <div className={`fixed inset-0 z-[120] flex flex-col justify-end items-center transition-all duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      
      {/* Overlay - Navigasyon çubuğunun üzerini kapatmamalı, z-index hiyerarşisi App.tsx içinde çözüldü */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" 
        onClick={onClose}
      ></div>
      
      {/* Modal Content - Bottom Sheet Style - Positioned right above the new navbar top edge */}
      <div 
        className={`w-full max-w-md bg-white dark:bg-[#1e293b] rounded-t-[2.5rem] p-6 shadow-[0_-20px_50px_rgba(0,0,0,0.1)] transition-transform duration-500 ease-out border-t border-amber-200/50 dark:border-slate-700 relative overflow-hidden mb-[150px] mx-4 ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        
        {/* Drag Handle Indicator */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full"></div>

        {/* Background Pattern */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-5 pointer-events-none"></div>

        <div className="flex justify-between items-center mb-6 mt-2 relative z-10">
           <h3 className="text-xl font-sans font-bold text-teal-900 dark:text-amber-500">Araçlar Menüsü</h3>
           <button onClick={onClose} className="p-2 bg-black/5 dark:bg-slate-700 rounded-full text-gray-500 hover:text-red-500 transition-colors">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4 relative z-10">
          {tools.map((tool, index) => (
            <button
              key={tool.id}
              onClick={() => onSelectTool(tool.id)}
              style={{ transitionDelay: `${index * 30}ms` }}
              className={`group relative flex flex-col items-center justify-center p-5 rounded-2xl bg-white dark:bg-slate-800 shadow-sm hover:shadow-lg border border-gray-100 dark:border-slate-700 transition-all active:scale-95 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            >
              <div className={`w-14 h-14 rounded-2xl rotate-3 group-hover:rotate-6 group-hover:scale-110 transition-transform mb-3 flex items-center justify-center text-2xl border-2 ${tool.color}`}>
                {tool.icon}
              </div>
              <span className="font-sans font-bold text-slate-700 dark:text-slate-200 text-sm tracking-tight">{tool.name}</span>
              
              {/* Highlight Effect */}
              <div className="absolute inset-0 bg-teal-500/0 group-hover:bg-teal-500/5 rounded-2xl transition-colors"></div>
            </button>
          ))}
        </div>

        {/* Bottom Decorative Space */}
        <div className="h-2"></div>
      </div>
    </div>
  );
};

export default MenuModal;
