
import { AladhanResponse } from '../types';

const BASE_URL = 'https://api.aladhan.com/v1';

export const fetchPrayerCalendar = async (
  latitude: number,
  longitude: number,
  month: number,
  year: number
): Promise<AladhanResponse> => {
  // Method 13 is Diyanet İşleri Başkanlığı (Turkey)
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    method: '13', 
    month: month.toString(),
    year: year.toString()
  });

  const response = await fetch(`${BASE_URL}/calendar?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Aladhan API error: ${response.statusText}`);
  }

  return response.json();
};

export const fetchPrayerCalendarByCity = async (
  city: string,
  country: string,
  month: number,
  year: number
): Promise<AladhanResponse> => {
  const params = new URLSearchParams({
    city: city,
    country: country,
    method: '13',
    month: month.toString(),
    year: year.toString()
  });

  const response = await fetch(`${BASE_URL}/calendarByCity?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Aladhan API error: ${response.statusText}`);
  }

  return response.json();
};

// New function to get precise coordinates for districts
export const fetchCityCoordinates = async (city: string, district?: string): Promise<{lat: number, lng: number} | null> => {
  try {
    // Prioritize district if available, otherwise city
    const query = district && district !== 'Merkez' ? `${district}, ${city}` : city;
    
    // Using OpenStreetMap Nominatim for highly accurate search results without API key
    // Limiting to 1 result, JSON format, RESTRICTED TO TURKEY (countrycodes=tr)
    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=tr`);
    
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data && data.length > 0) {
      return { 
        lat: parseFloat(data[0].lat), 
        lng: parseFloat(data[0].lon) 
      };
    }
    return null;
  } catch (e) {
    console.error("Geocoding failed", e);
    return null;
  }
};
