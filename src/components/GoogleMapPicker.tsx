import { useRef, useState, useEffect, useCallback } from 'react';
import { MapPin, Search, Crosshair, Navigation } from 'lucide-react';
import type { Coordinates } from '../types';
import { searchAddresses, type AutocompleteResult } from '../lib/maps';
import { cn } from '../utils';

interface Props {
  coords: Coordinates | null;
  address: string | null;
  onChange: (coords: Coordinates, address: string) => void;
  height?: string;
  searchable?: boolean;
  readOnly?: boolean;
}

export function GoogleMapPicker({
  coords,
  address,
  onChange,
  height = '280px',
  searchable = true,
  readOnly = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [searchVal, setSearchVal] = useState(address ?? '');
  const [suggestions, setSuggestions] = useState<AutocompleteResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [pinPos, setPinPos] = useState({ x: 50, y: 50 });
  const [currentCoords, setCurrentCoords] = useState<Coordinates>(
    coords ?? { lat: -6.2088, lng: 106.8456 }
  );

  // Update pin position when coords change externally
  useEffect(() => {
    if (coords) {
      setCurrentCoords(coords);
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const x = ((coords.lng - 107.0) / 12 + 0.5) * rect.width;
        const y = ((-6.0 - coords.lat) / 12 + 0.5) * rect.height;
        setPinPos({
          x: Math.max(20, Math.min(rect.width - 20, x)),
          y: Math.max(20, Math.min(rect.height - 20, y)),
        });
      }
    }
  }, [coords]);

  // Autocomplete search
  useEffect(() => {
    if (!searchable || !showSuggestions) return;
    let cancelled = false;
    searchAddresses(searchVal).then((results) => {
      if (!cancelled) setSuggestions(results);
    });
    return () => {
      cancelled = true;
    };
  }, [searchVal, searchable, showSuggestions]);

  const updateCoordsFromPos = useCallback((x: number, y: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const lat = -6.0 - ((y / rect.height) - 0.5) * 12;
    const lng = 107.0 + ((x / rect.width) - 0.5) * 12;
    const newCoords = { lat: Number(lat.toFixed(4)), lng: Number(lng.toFixed(4)) };
    setCurrentCoords(newCoords);
    if (!readOnly) onChange(newCoords, searchVal || 'Lokasi tersesuai');
  }, [onChange, readOnly, searchVal]);

  const handleSelectSuggestion = (s: AutocompleteResult) => {
    setSearchVal(s.label);
    setShowSuggestions(false);
    setCurrentCoords(s.coords);
    if (!readOnly) onChange(s.coords, s.label);
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const x = ((s.coords.lng - 107.0) / 12 + 0.5) * rect.width;
      const y = ((-6.0 - s.coords.lat) / 12 + 0.5) * rect.height;
      setPinPos({
        x: Math.max(20, Math.min(rect.width - 20, x)),
        y: Math.max(20, Math.min(rect.height - 20, y)),
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (readOnly) return;
    e.preventDefault();
    setDragging(true);
  };

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
      setPinPos({ x, y });
      updateCoordsFromPos(x, y);
    };
    const handleUp = () => setDragging(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [dragging, updateCoordsFromPos]);

  const handleMapClick = (e: React.MouseEvent) => {
    if (dragging || readOnly) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setPinPos({ x, y });
    updateCoordsFromPos(x, y);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      {/* Google Places Autocomplete Search */}
      {searchable && (
        <div className="relative border-b border-gray-100 bg-white px-3 py-2">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari alamat (Google Places Autocomplete)..."
              value={searchVal}
              onChange={(e) => {
                setSearchVal(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="flex-1 bg-transparent text-sm focus:outline-none"
            />
            <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">
              Places API
            </span>
          </div>
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-20 max-h-48 overflow-y-auto border-b border-l border-r border-gray-200 bg-white shadow-lg">
              {suggestions.map((s) => (
                <button
                  key={s.value}
                  onClick={() => handleSelectSuggestion(s)}
                  className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-emerald-50"
                >
                  <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-600" />
                  <span className="text-sm text-gray-700">{s.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Map Render Area */}
      <div
        ref={containerRef}
        onClick={handleMapClick}
        className={cn(
          'relative w-full overflow-hidden bg-emerald-50',
          readOnly ? 'cursor-default' : 'cursor-crosshair',
          dragging && 'cursor-grabbing'
        )}
        style={{ height }}
      >
        {/* Simulated map terrain */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 via-teal-50 to-green-100" />
        {/* Grid lines */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(0deg, transparent 24%, rgba(255,255,255,0.4) 25%, rgba(255,255,255,0.4) 26%, transparent 27%, transparent 74%, rgba(255,255,255,0.4) 75%, rgba(255,255,255,0.4) 76%, transparent 77%, transparent),
              linear-gradient(90deg, transparent 24%, rgba(255,255,255,0.4) 25%, rgba(255,255,255,0.4) 26%, transparent 27%, transparent 74%, rgba(255,255,255,0.4) 75%, rgba(255,255,255,0.4) 76%, transparent 77%, transparent)
            `,
            backgroundSize: '50px 50px',
          }}
        />
        {/* Roads */}
        <div className="absolute left-0 right-0 top-1/3 h-1.5 bg-white/50" />
        <div className="absolute left-0 right-0 top-2/3 h-1 bg-white/30" />
        <div className="absolute bottom-0 left-1/4 top-0 w-1.5 bg-white/50" />
        <div className="absolute bottom-0 left-2/3 top-0 w-1 bg-white/30" />
        {/* Water feature */}
        <div className="absolute bottom-0 right-0 h-1/3 w-1/3 rounded-tl-full bg-blue-100/40" />
        {/* City labels */}
        <div className="absolute left-2 top-2 rounded bg-white/70 px-1.5 py-0.5 text-[9px] font-medium text-gray-600">
          Jakarta
        </div>
        <div className="absolute right-2 top-1/2 rounded bg-white/70 px-1.5 py-0.5 text-[9px] font-medium text-gray-600">
          Bandung
        </div>
        <div className="absolute bottom-2 right-2 rounded bg-white/70 px-1.5 py-0.5 text-[9px] font-medium text-gray-600">
          Surabaya
        </div>
        {/* Google Maps branding */}
        <div className="absolute left-2 top-7 flex items-center gap-1 rounded bg-white/60 px-1.5 py-0.5 text-[8px] font-medium text-gray-500">
          <span className="text-blue-600 font-bold">G</span>
          <span className="text-red-500 font-bold">o</span>
          <span className="text-yellow-500 font-bold">o</span>
          <span className="text-blue-600 font-bold">g</span>
          <span className="text-green-600 font-bold">l</span>
          <span className="text-red-500 font-bold">e</span>
        </div>

        {/* Draggable Marker */}
        <div
          className="absolute z-10 -translate-x-1/2 -translate-y-full"
          style={{ left: pinPos.x, top: pinPos.y }}
          onMouseDown={handleMouseDown}
          onTouchStart={(e) => {
            if (readOnly) return;
            e.preventDefault();
            setDragging(true);
          }}
        >
          <div
            className={cn(
              'flex flex-col items-center transition-transform',
              dragging && 'scale-110'
            )}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 shadow-lg ring-4 ring-red-500/30">
              <MapPin className="h-5 w-5 fill-white text-white" />
            </div>
            <div className="-mt-0.5 h-3 w-1 bg-red-500" />
            <div className="h-2 w-2 rounded-full bg-red-500 shadow-md" />
          </div>
        </div>

        {/* Coordinates display */}
        <div className="pointer-events-none absolute right-2 top-2 flex items-center gap-1 rounded-lg bg-white/80 px-2 py-1 text-[10px] font-medium text-gray-600">
          <Crosshair className="h-3 w-3" />
          {currentCoords.lat.toFixed(4)}, {currentCoords.lng.toFixed(4)}
        </div>

        {/* Drag hint */}
        {!readOnly && (
          <div className="pointer-events-none absolute bottom-2 left-2 rounded-lg bg-gray-900/70 px-2 py-1 text-[10px] text-white">
            Klik atau seret pin untuk tandai lokasi
          </div>
        )}
        {readOnly && (
          <div className="pointer-events-none absolute bottom-2 left-2 rounded-lg bg-gray-900/70 px-2 py-1 text-[10px] text-white">
            <Navigation className="mr-1 inline h-3 w-3" />
            Lokasi Terpaku
          </div>
        )}
      </div>
    </div>
  );
}
