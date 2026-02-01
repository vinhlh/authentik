"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface Location {
  lat: number;
  lng: number;
}

interface LocationContextType {
  location: Location | null;
  isLoading: boolean;
  error: string | null;
  requestLocation: () => Promise<void>;
  permissionStatus: 'prompt' | 'granted' | 'denied' | 'unknown';
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const STORAGE_KEY = 'authentik_location_permission';

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown');

  useEffect(() => {
    // Check for existing permission status in localStorage or browser API
    if (typeof window !== 'undefined' && 'permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((result) => {
        setPermissionStatus(result.state as any);
        result.onchange = () => {
          setPermissionStatus(result.state as any);
        };
      });

      // Also check our local storage for "not now" preference
      const savedStatus = localStorage.getItem(STORAGE_KEY);
      if (savedStatus === 'denied' && permissionStatus === 'prompt') {
        // We locally treat it as denied to avoid re-prompting frequently
        // but the browser still says 'prompt'.
      }
    }
  }, []);

  // Try to get location silently if already granted
  useEffect(() => {
    if (permissionStatus === 'granted') {
      silentGetLocation();
    }
  }, [permissionStatus]);

  const silentGetLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (err) => {
          console.error('Silent location check failed:', err);
        }
      );
    }
  };

  const requestLocation = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    return new Promise((resolve) => {
      if (!('geolocation' in navigator)) {
        setError('Geolocation is not supported by your browser');
        setIsLoading(false);
        resolve();
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLoc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setLocation(newLoc);
          setPermissionStatus('granted');
          localStorage.setItem(STORAGE_KEY, 'granted');
          setIsLoading(false);
          resolve();
        },
        (err) => {
          let message = 'Failed to get location';
          if (err.code === err.PERMISSION_DENIED) {
            message = 'Local permission denied';
            setPermissionStatus('denied');
            localStorage.setItem(STORAGE_KEY, 'denied');
          }
          setError(message);
          setIsLoading(false);
          resolve();
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    });
  };

  return (
    <LocationContext.Provider value={{ location, isLoading, error, requestLocation, permissionStatus }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
