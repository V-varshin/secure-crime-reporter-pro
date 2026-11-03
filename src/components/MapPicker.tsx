import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Search, MapPin, Crosshair, Loader2 } from 'lucide-react';

interface MapPickerProps {
  initialLat?: number;
  initialLng?: number;
  address?: string;
  readOnly?: boolean;
  onLocationSelect?: (location: {
    lat: number;
    lng: number;
    address: string;
    locationName?: string;
  }) => void;
  severity?: 'Severe' | 'Moderate' | 'Normal / Low' | 'Closed';
}

export const MapPicker: React.FC<MapPickerProps> = ({
  initialLat = 40.7128,
  initialLng = -74.006,
  address = '',
  readOnly = false,
  onLocationSelect,
  severity = 'Severe',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: initialLat,
    lng: initialLng,
  });
  const [currentAddress, setCurrentAddress] = useState(address);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Choose pin color based on severity
  const getMarkerColor = () => {
    switch (severity) {
      case 'Severe':
        return '#f43f5e'; // Rose-500
      case 'Moderate':
        return '#f97316'; // Orange-500
      case 'Normal / Low':
        return '#eab308'; // Yellow-500
      case 'Closed':
        return '#10b981'; // Emerald-500
      default:
        return '#6366f1'; // Indigo-500
    }
  };

  const createCustomIcon = (color: string) => {
    return L.divIcon({
      className: 'custom-map-marker',
      html: `
        <div style="position: relative; transform: translate(-50%, -100%);">
          <div style="
            width: 32px;
            height: 32px;
            border-radius: 50% 50% 50% 0;
            background: ${color};
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 10px rgba(0,0,0,0.25);
            border: 2.5px solid white;
          ">
            <div style="
              width: 12px;
              height: 12px;
              background: white;
              border-radius: 50%;
              transform: rotate(45deg);
            "></div>
          </div>
          <div style="
            position: absolute;
            bottom: -6px;
            left: 50%;
            transform: translateX(-50%);
            width: 14px;
            height: 4px;
            background: rgba(0,0,0,0.2);
            border-radius: 50%;
          "></div>
        </div>
      `,
      iconSize: [32, 38],
      iconAnchor: [16, 38],
    });
  };

  // Reverse geocode coordinates to human-readable address
  const reverseGeocode = async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en',
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        const formatted = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        setCurrentAddress(formatted);
        if (onLocationSelect) {
          onLocationSelect({
            lat,
            lng,
            address: formatted,
            locationName: data.name || data.address?.road || 'Pinned Location',
          });
        }
      }
    } catch (err) {
      console.warn('Reverse geocoding error:', err);
    } finally {
      setIsGeocoding(false);
    }
  };

  // Forward search location
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=5&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en',
          },
        }
      );
      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (item: any) => {
    const newLat = parseFloat(item.lat);
    const newLng = parseFloat(item.lon);
    setCoords({ lat: newLat, lng: newLng });
    setCurrentAddress(item.display_name);
    setSearchResults([]);
    setSearchQuery('');

    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([newLat, newLng], 16);
      markerRef.current.setLatLng([newLat, newLng]);
    }

    if (onLocationSelect) {
      onLocationSelect({
        lat: newLat,
        lng: newLng,
        address: item.display_name,
        locationName: item.name || 'Selected Place',
      });
    }
  };

  const useCurrentDeviceLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsGeocoding(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 16);
          markerRef.current.setLatLng([latitude, longitude]);
        }
        reverseGeocode(latitude, longitude);
      },
      (err) => {
        console.warn('Geolocation failed:', err);
        setIsGeocoding(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 15,
      zoomControl: !readOnly,
      dragging: !readOnly,
      scrollWheelZoom: !readOnly,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const icon = createCustomIcon(getMarkerColor());
    const marker = L.marker([initialLat, initialLng], {
      icon,
      draggable: !readOnly,
    }).addTo(map);

    if (!readOnly) {
      // Drag marker event
      marker.on('dragend', () => {
        const position = marker.getLatLng();
        setCoords({ lat: position.lat, lng: position.lng });
        reverseGeocode(position.lat, position.lng);
      });

      // Click map to reposition marker
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setCoords({ lat, lng });
        reverseGeocode(lat, lng);
      });
    }

    mapInstanceRef.current = map;
    markerRef.current = marker;

    // Invalidate map size after mount for smooth layout
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Sync external coordinates changes if initialLat/initialLng changes
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      if (coords.lat !== initialLat || coords.lng !== initialLng) {
        setCoords({ lat: initialLat, lng: initialLng });
        markerRef.current.setLatLng([initialLat, initialLng]);
        mapInstanceRef.current.setView([initialLat, initialLng], 15);
      }
    }
  }, [initialLat, initialLng]);

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Search Bar (Only when editable) */}
      {!readOnly && (
        <div className="relative">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search street, landmark, or area (e.g., Central Park, 5th Ave)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs md:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs md:text-sm font-medium rounded-xl transition shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
            </button>
            <button
              type="button"
              onClick={useCurrentDeviceLocation}
              title="Pin Current GPS Location"
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition border border-slate-200 cursor-pointer flex items-center gap-1 text-xs"
            >
              <Crosshair className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">My Location</span>
            </button>
          </form>

          {/* Autocomplete dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
              {searchResults.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectSearchResult(item)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 border-b border-slate-100 last:border-0 flex items-start gap-2 text-slate-700 transition"
                >
                  <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                  <span className="truncate">{item.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Map Container */}
      <div className="relative w-full h-64 md:h-72 rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full" />

        {isGeocoding && (
          <div className="absolute top-3 right-3 z-[400] bg-white/90 backdrop-blur px-2.5 py-1 rounded-lg text-xs font-medium text-slate-700 flex items-center gap-1.5 shadow-sm border border-slate-200">
            <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />
            <span>Resolving address...</span>
          </div>
        )}

        {!readOnly && (
          <div className="absolute bottom-2 left-2 z-[400] bg-white/95 backdrop-blur px-2.5 py-1 rounded-lg text-[11px] text-slate-600 border border-slate-200/80 shadow-sm pointer-events-none">
            💡 Click on map or drag pin to position exact crime scene
          </div>
        )}
      </div>

      {/* Coordinates and Geocoded Address Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 gap-2">
        <div className="flex items-center gap-1.5 text-slate-700 truncate max-w-full">
          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          <span className="font-semibold text-slate-800 shrink-0">Selected Address:</span>
          <span className="text-slate-600 truncate">{currentAddress || 'No address resolved yet'}</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200 shrink-0">
          <span>Lat: {coords.lat.toFixed(5)}</span>
          <span>•</span>
          <span>Lng: {coords.lng.toFixed(5)}</span>
        </div>
      </div>
    </div>
  );
};
