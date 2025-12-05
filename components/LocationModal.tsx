import React, { useState, useEffect } from 'react';
import { TURKEY_DISTRICTS } from '../data/districts';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCity: (city: string, district?: string) => void;
  onSelectGPS: () => void;
  currentCity?: string | null;
  currentDistrict?: string | null;
}

interface SavedLocation {
  city: string;
  district: string;
}

type ViewState = 'LIST' | 'PROVINCE' | 'DISTRICT';

const LocationModal: React.FC<LocationModalProps> = ({ isOpen, onClose, onSelectCity, onSelectGPS, currentCity, currentDistrict }) => {
  const [view, setView] = useState<ViewState>('LIST');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);

  const cities = Object.keys(TURKEY_DISTRICTS);

  // Load saved locations on mount
  useEffect(() => {
    const saved = localStorage.getItem('savedLocations');
    if (saved) {
      try {
        setSavedLocations(JSON.parse(saved));
      } catch (e) {
        setSavedLocations([]);
      }
    }
  }, []);

  // Reset view when opening
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      // If no saved locations exist, go straight to search to help new users
      const saved = localStorage.getItem('savedLocations');
      if (!saved || JSON.parse(saved).length === 0) {
         setView('PROVINCE');
      } else {
         setView('LIST');
      }
      setSelectedProvince(null);
    }
  }, [isOpen]);

  const saveLocation = (city: string, district: string) => {
    const newLoc = { city, district };
    // Check if exists
    const exists = savedLocations.some(l => l.city === city && l.district === district);
    
    if (!exists) {
      const updated = [...savedLocations, newLoc];
      setSavedLocations(updated);
      localStorage.setItem('savedLocations', JSON.stringify(updated));
    }
  };

  const deleteLocation = (e: React.MouseEvent, city: string, district: string) => {
    e.stopPropagation();
    const updated = savedLocations.filter(l => !(l.city === city && l.district === district));
    setSavedLocations(updated);
    localStorage.setItem('savedLocations', JSON.stringify(updated));
  };

  const handleCityClick = (city: string) => {
    setSelectedProvince(city);
    setSearchTerm('');
    setView('DISTRICT');
  };

  const handleDistrictSelect = (district: string) => {
    if (selectedProvince) {
      saveLocation(selectedProvince, district);
      onSelectCity(selectedProvince, district);
      onClose();
    }
  };

  const handleBack = () => {
    if (view === 'DISTRICT') {
      setView('PROVINCE');
      setSelectedProvince(null);
      setSearchTerm('');
    } else if (view === 'PROVINCE') {
      if (savedLocations.length > 0) {
        setView('LIST');
      } else {
        onClose(); // If no history, back closes modal
      }
    }
  };

  if (!isOpen) return null;

  const filteredCities = cities.filter(city =>
    city.toLocaleLowerCase('tr').includes(searchTerm.toLocaleLowerCase('tr'))
  );

  const filteredDistricts = selectedProvince 
    ? TURKEY_DISTRICTS[selectedProvince].filter(d => d.toLocaleLowerCase('tr').includes(searchTerm.toLocaleLowerCase('tr')))
    : [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 transition-opacity animate-in fade-in duration-200">
      <div className="bg-[#fdfbf7] dark:bg-slate-800 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl transform transition-all scale-100 border border-amber-200/50 dark:border-slate-700">
        
        {/* Header */}
        <div className="p-5 border-b border-amber-100 dark:border-slate-700 flex justify-between items-center bg-[#fdfbf7] dark:bg-slate-900 rounded-t-2xl">
          <div className="flex items-center gap-2">
            {view !== 'LIST' && (
              <button onClick={handleBack} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              </button>
            )}
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">
              {view === 'LIST' && 'Konumlarım'}
              {view === 'PROVINCE' && 'Şehir Seçimi'}
              {view === 'DISTRICT' && `${selectedProvince} İlçeleri`}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
            
            {/* LIST VIEW */}
            {view === 'LIST' && (
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {/* GPS Option */}
                    <button
                        onClick={() => { onSelectGPS(); onClose(); }}
                        className="w-full flex items-center justify-between p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-emerald-200 dark:bg-emerald-800 p-2 rounded-full">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            </div>
                            <span className="font-bold">GPS Konumu</span>
                        </div>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    </button>

                    <div className="h-px bg-amber-100 dark:bg-slate-700 my-2"></div>

                    {/* Saved Items */}
                    {savedLocations.map((loc, idx) => {
                        const isActive = currentCity === loc.city && currentDistrict === loc.district;
                        return (
                            <button
                                key={`${loc.city}-${loc.district}-${idx}`}
                                onClick={() => { onSelectCity(loc.city, loc.district); onClose(); }}
                                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                                    isActive 
                                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 shadow-sm' 
                                    : 'bg-white dark:bg-slate-700/50 border-gray-100 dark:border-slate-600 hover:bg-amber-50 dark:hover:bg-slate-700'
                                }`}
                            >
                                <div className="text-left">
                                    <div className={`font-bold ${isActive ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-800 dark:text-white'}`}>
                                        {loc.city}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">{loc.district}</div>
                                </div>
                                
                                {isActive ? (
                                    <div className="text-indigo-500 text-xs font-bold px-2 py-1 bg-indigo-100 dark:bg-indigo-900 rounded-md">SEÇİLİ</div>
                                ) : (
                                    <div 
                                        onClick={(e) => deleteLocation(e, loc.city, loc.district)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
                                        title="Sil"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </div>
                                )}
                            </button>
                        );
                    })}

                    {/* Add New Button */}
                    <button
                        onClick={() => setView('PROVINCE')}
                        className="w-full py-4 mt-2 flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-slate-600 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                        <span>Yeni Konum Ekle</span>
                    </button>
                </div>
            )}

            {/* SEARCH VIEWS */}
            {(view === 'PROVINCE' || view === 'DISTRICT') && (
                <>
                    <div className="p-4 pb-2 bg-[#fdfbf7] dark:bg-slate-800">
                        <div className="relative">
                            <input
                            type="text"
                            placeholder={view === 'PROVINCE' ? "Şehir ara..." : "İlçe ara..."}
                            className="w-full p-3 pl-10 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-shadow"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                            />
                            <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600">
                        {view === 'PROVINCE' ? (
                            <>
                                {filteredCities.map(city => (
                                    <button
                                    key={city}
                                    onClick={() => handleCityClick(city)}
                                    className="w-full text-left px-4 py-3 rounded-lg transition-colors mb-1 flex items-center justify-between hover:bg-amber-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200"
                                    >
                                    <span>{city}</span>
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                    </button>
                                ))}
                                {filteredCities.length === 0 && (
                                    <div className="text-center py-8 text-gray-400 dark:text-slate-500">Şehir bulunamadı</div>
                                )}
                            </>
                        ) : (
                            <>
                                {filteredDistricts.map(district => (
                                    <button
                                    key={district}
                                    onClick={() => handleDistrictSelect(district)}
                                    className="w-full text-left px-4 py-3 rounded-lg transition-colors mb-1 flex items-center justify-between hover:bg-amber-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200"
                                    >
                                    <span>{district}</span>
                                    </button>
                                ))}
                                {filteredDistricts.length === 0 && (
                                    <div className="text-center py-8 text-gray-400 dark:text-slate-500">İlçe bulunamadı</div>
                                )}
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
      </div>
    </div>
  );
};

export default LocationModal;