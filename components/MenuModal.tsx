import React from 'react';

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTool: (tool: string) => void;
}

const MenuModal: React.FC<MenuModalProps> = ({ isOpen, onClose, onSelectTool }) => {
  if (!isOpen) return null;

  const tools = [
    { id: 'quran', name: 'Kuran-ı Kerim', icon: '📖', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    { id: 'holidays', name: 'Dini Günler', icon: '📅', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    { id: 'notifications', name: 'Bildirimler', icon: '🔔', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    { id: 'qibla', name: 'Kıble Pusulası', icon: '🧭', color: 'bg-sky-100 text-sky-700 border-sky-200' },
    { id: 'dhikr', name: 'Zikirmatik', icon: '📿', color: 'bg-rose-100 text-rose-700 border-rose-200' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center items-center bg-[#0c1218]/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#fdfaf6] dark:bg-[#1e293b] rounded-t-[2.5rem] sm:rounded-3xl p-6 shadow-2xl transform transition-transform duration-300 slide-in-from-bottom border-t border-amber-200 dark:border-slate-600 relative overflow-hidden">
        
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-10 pointer-events-none"></div>

        <div className="flex justify-between items-center mb-8 relative z-10">
           <h3 className="text-xl font-sans font-bold text-teal-900 dark:text-amber-500">Araçlar Menüsü</h3>
           <button onClick={onClose} className="p-2 bg-black/5 dark:bg-slate-700 rounded-full text-gray-500 hover:text-red-500 transition-colors">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4 relative z-10">
          {tools.map(tool => (
            <button
              key={tool.id}
              onClick={() => onSelectTool(tool.id)}
              className="group relative flex flex-col items-center justify-center p-6 rounded-2xl bg-white dark:bg-slate-800 shadow-sm hover:shadow-md border border-gray-100 dark:border-slate-700 transition-all active:scale-95"
            >
              <div className={`w-14 h-14 rounded-2xl rotate-3 group-hover:rotate-6 transition-transform mb-4 flex items-center justify-center text-2xl border-2 ${tool.color}`}>
                {tool.icon}
              </div>
              <span className="font-sans font-bold text-slate-700 dark:text-slate-200">{tool.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MenuModal;