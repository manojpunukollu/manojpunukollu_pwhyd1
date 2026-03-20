import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  Pin, 
  InfoWindow, 
  useMap, 
  useMapsLibrary,
  useAdvancedMarkerRef
} from '@vis.gl/react-google-maps';
import { motion } from 'motion/react';
import { MapPin, Navigation, Hospital, Shield, Phone } from 'lucide-react';

const API_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

interface MapSectionProps {
  locationContext?: string;
}

const MapContent: React.FC<MapSectionProps> = ({ locationContext }) => {
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<google.maps.places.Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<google.maps.places.Place | null>(null);
  const [markerRef, marker] = useAdvancedMarkerRef();

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(pos);
          map?.panTo(pos);
        },
        () => console.error("Geolocation failed")
      );
    }
  }, [map]);

  // Search for nearby emergency services
  useEffect(() => {
    if (!placesLib || !map || !userLocation) return;

    const searchNearby = async () => {
      const { places } = await placesLib.Place.searchNearby({
        locationRestriction: { center: userLocation, radius: 5000 },
        includedPrimaryTypes: ['hospital', 'pharmacy', 'police_station', 'fire_station'],
        fields: ['displayName', 'location', 'formattedAddress', 'rating', 'nationalPhoneNumber', 'websiteURI'],
        maxResultCount: 10,
      });
      setNearbyPlaces(places);
    };

    searchNearby();
  }, [placesLib, map, userLocation]);

  // Geocode locationContext if provided
  useEffect(() => {
    if (!locationContext || !map) return;
    
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: locationContext }, (results, status) => {
      if (status === 'OK' && results?.[0]?.geometry?.location) {
        const loc = results[0].geometry.location.toJSON();
        map.panTo(loc);
        map.setZoom(14);
      }
    });
  }, [locationContext, map]);

  return (
    <>
      {userLocation && (
        <AdvancedMarker position={userLocation} title="Your Location">
          <Pin background="#4285F4" glyphColor="#fff" scale={1.2} />
        </AdvancedMarker>
      )}

      {nearbyPlaces.map((place) => (
        <AdvancedMarker
          key={place.id}
          position={place.location}
          onClick={() => setSelectedPlace(place)}
        >
          <Pin 
            background={place.primaryType === 'hospital' ? '#EA4335' : '#34A853'} 
            glyphColor="#fff" 
          />
        </AdvancedMarker>
      ))}

      {selectedPlace && selectedPlace.location && (
        <InfoWindow
          position={selectedPlace.location}
          onCloseClick={() => setSelectedPlace(null)}
        >
          <div className="p-2 max-w-xs text-black">
            <h3 className="font-bold text-sm mb-1">{selectedPlace.displayName}</h3>
            <p className="text-xs text-gray-600 mb-2">{selectedPlace.formattedAddress}</p>
            <div className="flex gap-2">
              {selectedPlace.nationalPhoneNumber && (
                <a 
                  href={`tel:${selectedPlace.nationalPhoneNumber}`}
                  className="flex items-center gap-1 text-[10px] bg-google-blue text-white px-2 py-1 rounded"
                >
                  <Phone className="w-3 h-3" /> Call
                </a>
              )}
              {selectedPlace.websiteURI && (
                <a 
                  href={selectedPlace.websiteURI}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10px] bg-gray-100 text-gray-700 px-2 py-1 rounded"
                >
                  Website
                </a>
              )}
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
};

export const MapSection: React.FC<MapSectionProps> = ({ locationContext }) => {
  if (!hasValidKey) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center">
        <MapPin className="w-12 h-12 text-google-yellow mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-bold mb-2 uppercase tracking-widest">Emergency Map Offline</h3>
        <p className="text-sm text-white/60 mb-6 max-w-md mx-auto">
          To enable the dynamic emergency locator, please add your Google Maps API Key in the settings.
        </p>
        <div className="text-left text-xs bg-black/40 p-4 rounded-xl border border-white/5 space-y-2 font-mono">
          <p className="text-google-green font-bold">SETUP INSTRUCTIONS:</p>
          <p>1. Get a key at <a href="https://console.cloud.google.com/google/maps-apis/credentials" className="underline">Google Cloud Console</a></p>
          <p>2. Open Settings (⚙️) → Secrets</p>
          <p>3. Add <code>GOOGLE_MAPS_PLATFORM_KEY</code></p>
        </div>
      </div>
    );
  }

  return (
    <motion.section 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest">
          <Navigation className="w-5 h-5 text-google-blue" />
          Emergency Locator & Safe Zones
        </div>
        <div className="text-[10px] text-white/40 font-mono uppercase">Scanning 5km Radius</div>
      </div>

      <div className="h-[400px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative">
        <APIProvider apiKey={API_KEY} version="weekly">
          <Map
            {...({
              defaultCenter: { lat: 37.42, lng: -122.08 },
              defaultZoom: 13,
              mapId: "SENTINEL_MAP_ID",
              internalUsageAttributionIds: ['gmp_mcp_codeassist_v1_aistudio'],
              style: { width: '100%', height: '100%' },
              gestureHandling: 'greedy',
              disableDefaultUI: true,
            } as any)}
          >
            <MapContent locationContext={locationContext} />
          </Map>
        </APIProvider>
        
        {/* Overlay Legend */}
        <div className="absolute bottom-4 left-4 flex flex-col gap-2 pointer-events-none">
          <div className="glass-panel p-2 rounded-lg flex items-center gap-2 text-[10px] font-bold uppercase tracking-tighter bg-black/60 backdrop-blur-md border border-white/10">
            <div className="w-2 h-2 rounded-full bg-google-blue" /> Your Position
          </div>
          <div className="glass-panel p-2 rounded-lg flex items-center gap-2 text-[10px] font-bold uppercase tracking-tighter bg-black/60 backdrop-blur-md border border-white/10">
            <div className="w-2 h-2 rounded-full bg-google-red" /> Hospital / ER
          </div>
          <div className="glass-panel p-2 rounded-lg flex items-center gap-2 text-[10px] font-bold uppercase tracking-tighter bg-black/60 backdrop-blur-md border border-white/10">
            <div className="w-2 h-2 rounded-full bg-google-green" /> Safe Zone / Help
          </div>
        </div>
      </div>
    </motion.section>
  );
};
