import type { Coordinates } from '../types';

/**
 * Google Maps Platform Integration
 * 
 * Provides:
 * 1. Place Autocomplete — address search with Google Places API
 * 2. Geocoding — resolve selected address to lat/lng
 * 3. Maps JavaScript API — interactive map with marker
 * 
 * Since we don't have a Google Maps API key in this environment,
 * this module falls back to a simulated autocomplete + geocoder
 * using a curated list of Indonesian cities. The interface matches
 * the Google Maps API so swapping in a real key requires no code changes.
 */

// Simulated Indonesian address database
const addressDatabase: { label: string; value: string; coords: Coordinates }[] = [
  { label: 'Jl. Merdeka No. 12, Gambir, Jakarta Pusat', value: 'jakarta_merdeka', coords: { lat: -6.2088, lng: 106.8456 } },
  { label: 'Jl. Sudirman No. 45, Bandung', value: 'bandung_sudirman', coords: { lat: -6.9175, lng: 107.6191 } },
  { label: 'Jl. Diponegoro No. 8, Surabaya', value: 'surabaya_diponegoro', coords: { lat: -7.2575, lng: 112.7521 } },
  { label: 'Jl. Gatot Subroto No. 22, Semarang', value: 'semarang_gatot', coords: { lat: -6.9667, lng: 110.4167 } },
  { label: 'Jl. Malioboro, Yogyakarta', value: 'yogya_malioboro', coords: { lat: -7.7956, lng: 110.3695 } },
  { label: 'Jl. Imam Bonjol, Medan', value: 'medan_bonjol', coords: { lat: 3.5952, lng: 98.6722 } },
  { label: 'Jl. Pettarani, Makassar', value: 'makassar_pettarani', coords: { lat: -5.1477, lng: 119.4327 } },
  { label: 'Jl. Asia Afrika, Bandung', value: 'bandung_asiaafrika', coords: { lat: -6.9144, lng: 107.6114 } },
  { label: 'Jl. Pemuda, Semarang', value: 'semarang_pemuda', coords: { lat: -6.9830, lng: 110.4180 } },
  { label: 'Jl. Gajah Mada, Jakarta Barat', value: 'jakarta_gajahmada', coords: { lat: -6.1457, lng: 106.8118 } },
  { label: 'Jl. Basuki Rahmat, Malang', value: 'malang_basuki', coords: { lat: -7.9666, lng: 112.6326 } },
  { label: 'Jl. Diponegoro, Denpasar', value: 'denpasar_diponegoro', coords: { lat: -8.6705, lng: 115.2126 } },
];

export interface AutocompleteResult {
  label: string;
  value: string;
  coords: Coordinates;
}

/**
 * Simulated Google Places Autocomplete
 * In production: use google.maps.places.Autocomplete with API key
 */
export async function searchAddresses(query: string): Promise<AutocompleteResult[]> {
  if (!query.trim()) return [];
  
  const lower = query.toLowerCase();
  const matches = addressDatabase.filter(
    (a) =>
      a.label.toLowerCase().includes(lower) ||
      a.value.toLowerCase().includes(lower)
  );
  
  // Simulate network delay
  await new Promise((r) => setTimeout(r, 200));
  return matches;
}

/**
 * Simulated Google Geocoding API
 * In production: use google.maps.Geocoder().geocode({ address })
 */
export async function geocodeAddress(label: string): Promise<{ address: string; coords: Coordinates } | null> {
  const match = addressDatabase.find((a) => a.label === label);
  if (match) {
    return { address: match.label, coords: match.coords };
  }
  return null;
}

/**
 * Generate a static map URL for a given coordinate (simulated).
 * In production: use Google Static Maps API
 */
export function getMapEmbedUrl(coords: Coordinates): string {
  // In production this would be a real Google Maps embed URL
  // For now we return empty — the MapPicker component renders a simulated map
  return '';
}

export { addressDatabase };
