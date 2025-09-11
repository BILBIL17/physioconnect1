import React, { useEffect, useRef, useState } from 'react';

// Declare Leaflet in the global scope to avoid TypeScript errors
declare const L: any;

const NearTherapy: React.FC = () => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null); // To hold the map instance
    const userMarkerRef = useRef<any>(null); // To hold the user's marker
    const watchIdRef = useRef<number | null>(null); // To hold the geolocation watch ID
    const isMapCenteredRef = useRef<boolean>(false); // To prevent re-centering on every update
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Function to handle successful location updates
        const handleSuccess = (position: GeolocationPosition) => {
            const { latitude, longitude } = position.coords;
            
            // Initialize map if it doesn't exist
            if (mapRef.current && !mapInstance.current) {
                mapInstance.current = L.map(mapRef.current).setView([latitude, longitude], 15);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                }).addTo(mapInstance.current);

                // Dummy clinic markers (only add once)
                const clinics = [
                    { name: 'HealWell Physiotherapy', lat: latitude + 0.01, lng: longitude - 0.01 },
                    { name: 'ActiveLife Clinic', lat: latitude - 0.005, lng: longitude + 0.015 },
                    { name: 'Flex-It Physio', lat: latitude + 0.008, lng: longitude + 0.008 },
                ];
                clinics.forEach(clinic => {
                    L.marker([clinic.lat, clinic.lng]).addTo(mapInstance.current)
                        .bindPopup(`<b>${clinic.name}</b><br><a href="#" class="text-teal-600">Get Directions</a>`);
                });
            }

            const liveIcon = L.divIcon({
                className: 'custom-div-icon',
                html: "<div class='live-dot-pulse'></div><div class='live-dot'></div>",
                iconSize: [16, 16],
                iconAnchor: [8, 8]
            });

            // Create or update user's marker
            if (!userMarkerRef.current) {
                userMarkerRef.current = L.marker([latitude, longitude], { icon: liveIcon })
                    .addTo(mapInstance.current)
                    .bindPopup('<b>You are here!</b>').openPopup();
            } else {
                userMarkerRef.current.setLatLng([latitude, longitude]);
            }

            // Center map on user's location only once
            if (mapInstance.current && !isMapCenteredRef.current) {
                mapInstance.current.setView([latitude, longitude], 15);
                isMapCenteredRef.current = true;
            }
             setError(null);
        };

        // Function to handle geolocation errors
        const handleError = (err: GeolocationPositionError) => {
            console.error(`Geolocation error - Code: ${err.code}, Message: ${err.message}`);
            let userMessage: string;
            switch (err.code) {
                case 1: // PERMISSION_DENIED
                    userMessage = "Geolocation permission was denied. Please enable it in your browser settings to find nearby clinics.";
                    // If permission is permanently denied, stop trying to get the location.
                    if (watchIdRef.current !== null) {
                        navigator.geolocation.clearWatch(watchIdRef.current);
                        watchIdRef.current = null;
                    }
                    break;
                case 2: // POSITION_UNAVAILABLE
                    userMessage = `Your location information is currently unavailable. Please check your network connection or move to an area with a better signal. (${err.message})`;
                    break;
                case 3: // TIMEOUT
                    userMessage = "The request to get your location timed out. Please try again.";
                    break;
                default:
                    userMessage = `An unknown error occurred while trying to get your location. (${err.message})`;
            }
            setError(userMessage);

            // Fallback to a default location if geolocation fails
            if (mapRef.current && !mapInstance.current) {
                mapInstance.current = L.map(mapRef.current).setView([51.505, -0.09], 13); // Default to London
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                }).addTo(mapInstance.current);
                L.marker([51.505, -0.09]).addTo(mapInstance.current)
                    .bindPopup('<b>Default Location</b><br>Could not access your current location.').openPopup();
            }
        };

        // Start watching the user's position
        if (navigator.geolocation) {
            watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            });
        } else {
            setError("Geolocation is not supported by this browser.");
        }
        
        // Cleanup function
        return () => {
            // Stop watching position
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
            // Remove map instance
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
            // Reset refs
            userMarkerRef.current = null;
            isMapCenteredRef.current = false;
        };
    }, []); // Empty dependency array ensures this runs only once on mount and cleans up on unmount

    return (
        <div>
            <h2 className="text-2xl font-bold text-[#37474f] mb-4">Find a Physiotherapist Near You</h2>
            <p className="text-[#78909c] mb-4">Your live location is being shown on the map.</p>
            {error && <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg mb-4" role="alert">{error}</div>}
            <div className="w-full aspect-video rounded-lg shadow-lg overflow-hidden">
                <div ref={mapRef} id="map" className="h-full w-full" />
            </div>
        </div>
    );
};

export default NearTherapy;