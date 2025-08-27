import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabaseClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Locate } from 'lucide-react';

interface MapProps {
  className?: string;
  rideId?: string;
  showRoute?: boolean;
  pickupLocation?: [number, number];
  destinationLocation?: [number, number];
  showLiveTracking?: boolean;
}

const Map: React.FC<MapProps> = ({ 
  className, 
  rideId, 
  showRoute = false, 
  pickupLocation, 
  destinationLocation,
  showLiveTracking = false 
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string>('');
  const [markers, setMarkers] = useState<mapboxgl.Marker[]>([]);
  const [routeAdded, setRouteAdded] = useState(false);
  const [trackingMarkers, setTrackingMarkers] = useState<Record<string, mapboxgl.Marker>>({});
  
  // Hardcode the Mapbox token
  const MAPBOX_TOKEN = 'pk.eyJ1IjoibWFuYXM5NTUiLCJhIjoiY21kZnRrMnZpMGc2ZjJrc2cwcmxuMzNqaSJ9.z3p-g8a1EKOjnHrj7jFkOg';

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([longitude, latitude]);
        setLocationError('');
        
        if (map.current) {
          map.current.flyTo({
            center: [longitude, latitude],
            zoom: 15,
            speed: 1.2,
          });
        }
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        setLocationError(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const initializeMap = () => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [77.2090, 28.6139], // Default to Delhi, India
      zoom: 12,
      pitch: 0,
      bearing: 0,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Add fullscreen control
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    // Get user location when map loads
    map.current.on('load', () => {
      getCurrentLocation();
      
      // Add route if coordinates are provided
      if (showRoute && pickupLocation && destinationLocation) {
        addRoute(pickupLocation, destinationLocation);
      }
    });

    // Add user location marker when location is available
    if (userLocation) {
      addUserLocationMarker();
    }
  };

  const addUserLocationMarker = () => {
    if (!map.current || !userLocation) return;

    // Remove existing markers
    const existingMarkers = document.querySelectorAll('.user-location-marker');
    existingMarkers.forEach(marker => marker.remove());

    // Create a custom marker element
    const markerElement = document.createElement('div');
    markerElement.className = 'user-location-marker';
    markerElement.style.cssText = `
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background-color: #3b82f6;
      border: 3px solid white;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      cursor: pointer;
    `;

    // Add pulsing animation
    const pulseElement = document.createElement('div');
    pulseElement.style.cssText = `
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background-color: #3b82f6;
      opacity: 0.6;
      position: absolute;
      animation: pulse 2s infinite;
    `;

    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% {
          transform: scale(1);
          opacity: 0.6;
        }
        70% {
          transform: scale(2);
          opacity: 0;
        }
        100% {
          transform: scale(2);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);

    markerElement.appendChild(pulseElement);

    // Add marker to map
    const marker = new mapboxgl.Marker(markerElement)
      .setLngLat(userLocation)
      .addTo(map.current);

    // Add popup
    const popup = new mapboxgl.Popup({ offset: 25 })
      .setHTML('<div style="padding: 5px;"><strong>Your Location</strong></div>');

    marker.setPopup(popup);
  };

  // Add route between two points
  const addRoute = async (start: [number, number], end: [number, number]) => {
    if (!map.current || routeAdded) return;

    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
      );
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0].geometry;
        
        // Add route source and layer
        map.current.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: route
          }
        });

        map.current.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#3b82f6',
            'line-width': 5,
            'line-opacity': 0.8
          }
        });

        // Add pickup and destination markers
        const pickupMarker = new mapboxgl.Marker({ color: '#10b981' })
          .setLngLat(start)
          .setPopup(new mapboxgl.Popup().setHTML('<div style="padding: 5px;"><strong>Pickup Location</strong></div>'))
          .addTo(map.current);

        const destinationMarker = new mapboxgl.Marker({ color: '#ef4444' })
          .setLngLat(end)
          .setPopup(new mapboxgl.Popup().setHTML('<div style="padding: 5px;"><strong>Destination</strong></div>'))
          .addTo(map.current);

        setMarkers(prev => [...prev, pickupMarker, destinationMarker]);

        // Fit map to show entire route
        const coordinates = route.coordinates;
        const bounds = coordinates.reduce((bounds: mapboxgl.LngLatBounds, coord: number[]) => {
          return bounds.extend(coord as [number, number]);
        }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

        map.current.fitBounds(bounds, { padding: 50 });
        setRouteAdded(true);
      }
    } catch (error) {
      console.error('Error fetching route:', error);
    }
  };

  // Clear all markers and routes
  const clearMapElements = () => {
    markers.forEach(marker => marker.remove());
    setMarkers([]);
    
    if (map.current && map.current.getSource('route')) {
      map.current.removeLayer('route');
      map.current.removeSource('route');
      setRouteAdded(false);
    }
  };

  // Live tracking markers helpers
  const upsertTrackingMarker = (userId: string, lng: number, lat: number, isDriver: boolean) => {
    if (!map.current) return;
    setTrackingMarkers(prev => {
      const existing = prev[userId];
      if (existing) {
        existing.setLngLat([lng, lat]);
        return prev;
      }
      const marker = new mapboxgl.Marker({ color: isDriver ? '#10b981' : '#3b82f6' })
        .setLngLat([lng, lat])
        .addTo(map.current!);
      return { ...prev, [userId]: marker };
    });
  };

  const clearTracking = () => {
    Object.values(trackingMarkers).forEach(m => m.remove());
  };

  useEffect(() => {
    initializeMap();
    
    return () => {
      clearMapElements();
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (userLocation && map.current) {
      addUserLocationMarker();
    }
  }, [userLocation]);

  useEffect(() => {
    if (map.current && showRoute && pickupLocation && destinationLocation) {
      clearMapElements();
      addRoute(pickupLocation, destinationLocation);
    }
  }, [showRoute, pickupLocation, destinationLocation]);

  // Subscribe to live tracking for the ride and render participant markers
  useEffect(() => {
    if (!showLiveTracking || !rideId || !map.current) return;

    let channel: any = null;

    const loadInitial = async () => {
      const { data, error } = await supabaseClient
        .from('user_locations')
        .select('user_id, latitude, longitude, is_driver, updated_at')
        .eq('ride_id', rideId)
        .order('updated_at', { ascending: false });
      if (error) {
        console.error('Error loading tracking locations:', error);
        return;
      }
      const seen = new Set<string>();
      (data || []).forEach((row: any) => {
        if (seen.has(row.user_id)) return;
        seen.add(row.user_id);
        upsertTrackingMarker(row.user_id, row.longitude, row.latitude, row.is_driver);
      });
    };

    loadInitial();

    channel = supabaseClient
      .channel(`map_location_${rideId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_locations', filter: `ride_id=eq.${rideId}` }, (payload) => {
        const r: any = payload.new;
        upsertTrackingMarker(r.user_id, r.longitude, r.latitude, r.is_driver);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'user_locations', filter: `ride_id=eq.${rideId}` }, (payload) => {
        const r: any = payload.new;
        upsertTrackingMarker(r.user_id, r.longitude, r.latitude, r.is_driver);
      })
      .subscribe();

    return () => {
      if (channel) supabaseClient.removeChannel(channel);
      clearTracking();
    };
  }, [showLiveTracking, rideId]);

  return (
    <Card className={className}>
      <CardContent className="p-0 h-full relative">
        <div ref={mapContainer} className="w-full h-full rounded-lg" />
        
        {/* Location controls */}
        <div className="absolute top-4 left-4 z-10">
          <Button
            size="sm"
            variant="secondary"
            onClick={getCurrentLocation}
            className="shadow-lg"
          >
            <Locate className="w-4 h-4 mr-2" />
            My Location
          </Button>
        </div>

        {/* Error message */}
        {locationError && (
          <div className="absolute bottom-4 left-4 right-4 z-10">
            <div className="bg-destructive/90 text-destructive-foreground px-3 py-2 rounded-md text-sm">
              {locationError}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Map;