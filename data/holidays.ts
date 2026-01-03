
import { ReligiousHoliday } from '../types';

// Standart Hicri Takvim Eşleşmeleri
const FIXED_HOLIDAYS = [
  { name: "Hicri Yılbaşı", month: 1, day: 1 },
  { name: "Aşure Günü", month: 1, day: 10 },
  { name: "Mevlid Kandili", month: 3, day: 12 },
  { name: "Miraç Kandili", month: 7, day: 27 },
  { name: "Berat Kandili", month: 8, day: 15 },
  { name: "Ramazan Başlangıcı", month: 9, day: 1 },
  { name: "Kadir Gecesi", month: 9, day: 27 },
  { name: "Ramazan Bayramı", month: 10, day: 1 },
  { name: "Kurban Bayramı", month: 12, day: 10 },
];

// Türkiye Diyanet Takvimi için kesin tarihler (Görseldeki 2026 verileri entegre edildi)
const FIXED_OVERRIDES: Record<string, string[]> = {
  "Üç Ayların Başlangıcı": ["2026-12-10"],
  "Regaib Kandili": ["2026-12-10"],
  "Miraç Kandili": ["2026-01-15"],
  "Berat Kandili": ["2026-02-02"],
  "Ramazan Başlangıcı": ["2026-02-19"],
  "Kadir Gecesi": ["2026-03-16"],
  "Ramazan Bayramı": ["2026-03-20"],
  "Kurban Bayramı": ["2026-05-27"],
  "Hicri Yılbaşı": ["2026-06-16"],
  "Aşure Günü": ["2026-06-25"],
  "Mevlid Kandili": ["2026-08-24"]
};

export const getUpcomingHolidays = (): (ReligiousHoliday & { daysLeft: number })[] => {
  const holidays: (ReligiousHoliday & { daysLeft: number })[] = [];
  const foundHolidayNames = new Set<string>(); 
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // 1. Önce kesinleşmiş override tarihlerini kontrol et
  for (const [name, dates] of Object.entries(FIXED_OVERRIDES)) {
      for (const dateStr of dates) {
          const d = new Date(dateStr);
          d.setHours(0,0,0,0);
          
          if (d >= today) {
              const diffTime = d.getTime() - today.getTime();
              const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              holidays.push({
                  name: name,
                  date: dateStr,
                  daysLeft: daysLeft
              });
              foundHolidayNames.add(name);
          }
      }
  }

  // 2. Eksik kalanlar için Hicri Takvim taraması yap (Gelecek yıllar için fallback)
  let formatter: Intl.DateTimeFormat;
  try {
    formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric'
    });

    const scanLimit = 400; 
    const cursor = new Date(today);
    
    for (let i = 0; i < scanLimit; i++) {
      const parts = formatter.formatToParts(cursor);
      const hDay = parseInt(parts.find(p => p.type === 'day')?.value || '0', 10);
      const hMonth = parseInt(parts.find(p => p.type === 'month')?.value || '0', 10);
      
      const fixed = FIXED_HOLIDAYS.find(h => h.month === hMonth && h.day === hDay);
      if (fixed && !foundHolidayNames.has(fixed.name)) {
          const holidayDate = new Date(cursor);
          holidayDate.setDate(holidayDate.getDate() + 1);
          
          if (holidayDate >= today) {
              const diffTime = holidayDate.getTime() - today.getTime();
              const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              holidays.push({
                name: fixed.name,
                date: holidayDate.toISOString().split('T')[0],
                daysLeft: daysLeft
              });
              foundHolidayNames.add(fixed.name);
          }
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  } catch (e) {
    console.error("Islamic calendar scan failed", e);
  }

  return holidays.sort((a, b) => a.daysLeft - b.daysLeft);
};
