export type RegionDevise = 'africa' | 'europe' | 'usa';

const CFA_COUNTRIES = ['CI', 'SN', 'CM', 'TG', 'BJ', 'BF', 'ML', 'NE', 'GA', 'CG', 'TD', 'CF', 'GQ', 'GW'];
const EURO_COUNTRIES = ['FR', 'DE', 'IT', 'ES', 'BE', 'NL', 'LU', 'AT', 'FI', 'IE', 'PT', 'GR', 'CY', 'EE', 'LV', 'LT', 'SK', 'SI', 'MT', 'HR'];

// Offline guess based on timezone and language
export function guessOfflineRegion(): RegionDevise {
  if (typeof window === 'undefined') return 'africa';

  // Check language
  const lang = (navigator.language || '').toUpperCase();
  if (CFA_COUNTRIES.some(code => lang.endsWith(code) || lang.includes(`-${code}`))) {
    return 'africa';
  }
  if (EURO_COUNTRIES.some(code => lang.endsWith(code) || lang.includes(`-${code}`))) {
    return 'europe';
  }

  // Check timezone
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) {
      if (
        tz.startsWith('Africa/Abidjan') || 
        tz.startsWith('Africa/Dakar') || 
        tz.startsWith('Africa/Douala') || 
        tz.startsWith('Africa/Libreville') || 
        tz.startsWith('Africa/Brazzaville') || 
        tz.startsWith('Africa/Lome') || 
        tz.startsWith('Africa/Bamako') || 
        tz.startsWith('Africa/Niamey') || 
        tz.startsWith('Africa/Ouagadougou') || 
        tz.startsWith('Africa/Porto-Novo')
      ) {
        return 'africa';
      }
      if (tz.startsWith('Europe/')) {
        return 'europe';
      }
    }
  } catch (e) {
    // Ignore timezone error
  }

  return 'usa';
}

export async function detectCurrency(): Promise<RegionDevise> {
  if (typeof window === 'undefined') return 'africa';

  // Check cache
  const cached = sessionStorage.getItem('fotodesk_detected_currency') || localStorage.getItem('fotodesk_detected_currency');
  if (cached === 'africa' || cached === 'europe' || cached === 'usa') {
    return cached;
  }

  // Set offline guess as early fallback
  const fallback = guessOfflineRegion();

  try {
    const res = await fetch('https://ipapi.co/json/');
    if (!res.ok) throw new Error('API fetch failed');
    const data = await res.json();
    const countryCode = (data.country_code || '').toUpperCase();

    let detected: RegionDevise = fallback;
    if (CFA_COUNTRIES.includes(countryCode)) {
      detected = 'africa';
    } else if (EURO_COUNTRIES.includes(countryCode)) {
      detected = 'europe';
    } else if (countryCode) {
      detected = 'usa';
    }

    sessionStorage.setItem('fotodesk_detected_currency', detected);
    localStorage.setItem('fotodesk_detected_currency', detected);
    return detected;
  } catch (e) {
    console.warn('Geolocation lookup failed, using offline fallback:', fallback, e);
    return fallback;
  }
}
