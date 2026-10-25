import { useEffect, useRef, useState } from 'react';
import { resolveLocation } from '@/lib/location.mjs';

// Resolve device location once; discard stale lookups after a country change.
export function useHalLocation(notify: (message: string) => void) {
  const [location, setLocation] = useState(() => resolveLocation('SG'));
  const [locating, setLocating] = useState(false);
  const requested = useRef(false),
    version = useRef(0);
  function chooseCountry(country: string) {
    version.current++;
    setLocating(false);
    setLocation(resolveLocation(country));
  }
  async function useDeviceLocation() {
    if (!navigator.geolocation) {
      notify('Location is unavailable in this browser. Choose a country instead.');
      return;
    }
    const current = ++version.current;
    setLocating(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 12000,
          maximumAge: 0,
        }),
      );
      if (current !== version.current) return;
      const params = new URLSearchParams({
        latitude: String(position.coords.latitude),
        longitude: String(position.coords.longitude),
        localityLanguage: 'en',
      });
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?${params}`,
        { signal: AbortSignal.timeout(10000), cache: 'no-store' },
      );
      if (!response.ok) throw new Error('Geocoding unavailable');
      const result = await response.json();
      if (!result.countryCode) throw new Error('No country');
      if (current !== version.current) return;
      setLocation(
        resolveLocation(result.countryCode, result.city || result.locality, position.coords),
      );
      notify('Using your location for nearby searches.');
    } catch {
      if (current === version.current)
        notify('Couldn’t get your location. Allow it in your browser or choose a country.');
    } finally {
      if (current === version.current) setLocating(false);
    }
  }
  useEffect(() => {
    if (!requested.current) {
      requested.current = true;
      void useDeviceLocation();
    }
  }, []);
  return { location, locating, chooseCountry, useDeviceLocation };
}
