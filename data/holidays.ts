
import { ReligiousHoliday } from '../types';

// Standard Islamic Holidays (Hijri Month/Day)
const FIXED_HOLIDAYS = [
  { name: "Hicri Yılbaşı", month: 1, day: 1 },
  { name: "Aşure Günü", month: 1, day: 10 },
  { name: "Mevlid Kandili", month: 3, day: 12 },
  { name: "Miraç Kandili", month: 7, day: 27 },
  { name: "Berat Kandili", month: 8, day: 15 },
  { name: "Ramazan Başlangıcı", month: 9, day: 1 },
  { name: "Kadir Gecesi", month: 9, day: 27 },
  { name: "Ramazan Bayramı 1. Gün", month: 10, day: 1 },
  { name: "Kurban Bayramı 1. Gün", month: 12, day: 10 },
];

// Holidays that need a +1 day correction for Turkey (Diyanet) vs Umm al-Qura
const TURKEY_OFFSET_HOLIDAYS = [
  "Kadir Gecesi", 
  "Ramazan Bayramı 1. Gün", 
  "Kurban Bayramı 1. Gün",
  "Hicri Yılbaşı",
  "Aşure Günü",
  "Mevlid Kandili",
  "Miraç Kandili",
  "Berat Kandili"
];

// Specific overrides for complex dates to guarantee Diyanet accuracy for upcoming years
const FIXED_OVERRIDES: Record<string, string[]> = {
  "Regaip Kandili": [
    "2024-01-11",
    "2025-01-02",
    "2025-12-25", 
    "2026-12-14" // Projected
  ]
};

export const getUpcomingHolidays = (): (ReligiousHoliday & { daysLeft: number })[] => {
  const holidays: (ReligiousHoliday & { daysLeft: number })[] = [];
  const foundHolidayNames = new Set<string>(); 
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let formatter: Intl.DateTimeFormat;
  try {
    formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric'
    });
  } catch (e) {
    console.error("Islamic calendar not supported", e);
    return []; 
  }

  // Increased scan limit to 700 days (~2 years) to ensure we always find the next occurrence
  // even if it's 350+ days away (e.g. just passed yesterday)
  const scanLimit = 700; 
  const cursor = new Date(today);
  
  // 1. First, populate known overrides if they are in the future
  for (const [name, dates] of Object.entries(FIXED_OVERRIDES)) {
      for (const dateStr of dates) {
          const d = new Date(dateStr);
          d.setHours(0,0,0,0);
          
          if (d >= today && !foundHolidayNames.has(name)) {
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

  // 2. Scan for dynamic holidays
  for (let i = 0; i < scanLimit; i++) {
    const parts = formatter.formatToParts(cursor);
    const hDay = parseInt(parts.find(p => p.type === 'day')?.value || '0', 10);
    const hMonth = parseInt(parts.find(p => p.type === 'month')?.value || '0', 10);
    
    let holidayName: string | null = null;

    // Check Fixed Date Holidays
    const fixed = FIXED_HOLIDAYS.find(h => h.month === hMonth && h.day === hDay);
    if (fixed) {
        holidayName = fixed.name;
    }

    // Regaip Kandili Logic (Dynamic Fallback if not in overrides)
    // First Friday of Rajab logic: Month 7, Day is Friday, hDay <= 7. Regaip is yesterday.
    if (!foundHolidayNames.has("Regaip Kandili") && hMonth === 7 && cursor.getDay() === 5 && hDay <= 7) {
         const regaipDate = new Date(cursor);
         regaipDate.setDate(regaipDate.getDate() - 1);
         
         // Only add if strictly future/today (scan starts at today)
         if (i - 1 >= 0) {
             holidays.push({
                name: "Regaip Kandili",
                date: regaipDate.toISOString().split('T')[0],
                daysLeft: i - 1
             });
             foundHolidayNames.add("Regaip Kandili");
         }
    }

    if (holidayName && !foundHolidayNames.has(holidayName)) {
      let holidayDate = new Date(cursor);
      let daysLeft = i;

      // Apply Turkey Offset
      if (TURKEY_OFFSET_HOLIDAYS.includes(holidayName)) {
          holidayDate.setDate(holidayDate.getDate() + 1);
      }

      holidays.push({
        name: holidayName,
        date: holidayDate.toISOString().split('T')[0],
        daysLeft: daysLeft
      });
      
      foundHolidayNames.add(holidayName);
    }

    // Stop if we found all + Regaip
    if (foundHolidayNames.size >= FIXED_HOLIDAYS.length + 1) {
        break;
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return holidays.sort((a, b) => a.daysLeft - b.daysLeft);
};