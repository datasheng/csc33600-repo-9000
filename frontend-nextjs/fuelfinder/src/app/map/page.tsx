"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  GoogleMap,
  Marker,
  InfoWindow,
  useLoadScript,
} from "@react-google-maps/api";
import ConfirmPriceModal from "../../../components/ConfirmPriceModal";
import TripPlannerModal from "../../../components/TripPlannerModal";
import ProtectedRoute from "../../../components/ProtectedRoute";

type Station = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  price: string;
};

const stations: Station[] = [
  {
    id: 1,
    name: "Shell Gas Station",
    latitude: 40.81987,
    longitude: -73.94958,
    price: "$3.45",
  },
  {
    id: 2,
    name: "Exxon Mobil",
    latitude: 40.81734,
    longitude: -73.94421,
    price: "$3.39",
  },
];

/**
 * Calculates the distance in meters between two coordinates
 * using the Haversine formula.
 */
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const earthRadius = 6371e3; // meters
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const deltaPhi = toRadians(lat2 - lat1);
  const deltaLambda = toRadians(lon2 - lon1);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
};

function MapPageContent() {
  const [userLocation, setUserLocation] =
    useState<google.maps.LatLngLiteral | null>(null);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: ["places"],
  });

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserLocation({ lat: coords.latitude, lng: coords.longitude });
      },
      () => {
        // Fallback center
        setUserLocation({ lat: 40.81987, lng: -73.94958 });
      }
    );
  }, []);

  if (loadError) {
    return <div className="p-4 text-red-500">Failed to load Google Maps.</div>;
  }
  if (!isLoaded || !userLocation) {
    return <div className="p-4">Loading map...</div>;
  }

  // Filter by search text, then calculate & sort by distance
  const stationList = stations
    .filter((station) =>
      station.name.toLowerCase().includes(searchText.toLowerCase())
    )
    .map((station) => ({
      ...station,
      distance: calculateDistance(
        userLocation.lat,
        userLocation.lng,
        station.latitude,
        station.longitude
      ),
    }))
    .sort((a, b) => a.distance - b.distance);

  const handleStationSelect = (station: Station) => {
    setSelectedStation(station);
    if (mapRef.current) {
      mapRef.current.panTo({ lat: station.latitude, lng: station.longitude });
      mapRef.current.setZoom(15);
    }
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left column: Map */}
      <div className="flex-1 h-full relative">
        <GoogleMap
          mapContainerClassName="w-full h-full"
          center={userLocation}
          zoom={14}
          options={{ disableDefaultUI: true }}
          onLoad={(map) => {
            mapRef.current = map;
          }}
        >
          {stationList.map((station) => (
            <Marker
              key={station.id}
              position={{ lat: station.latitude, lng: station.longitude }}
              onClick={() => setSelectedStation(station)}
            />
          ))}

          {selectedStation && (
            <InfoWindow
              position={{
                lat: selectedStation.latitude,
                lng: selectedStation.longitude,
              }}
              onCloseClick={() => setSelectedStation(null)}
            >
              <div className="p-4 w-48">
                <h3 className="font-semibold text-lg">
                  {selectedStation.name}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  Price: {selectedStation.price}
                </p>
                <button
                  onClick={() => setIsConfirmModalOpen(true)}
                  className="mr-2 px-3 py-1 bg-blue-600 text-white rounded"
                >
                  Confirm Price
                </button>
                <button
                  onClick={() =>
                    alert(`${selectedStation.name} saved to favorites.`)
                  }
                  className="px-3 py-1 bg-gray-400 text-white rounded"
                >
                  Save
                </button>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>

        <button
          onClick={() => setIsTripModalOpen(true)}
          className="fixed bottom-6 right-6 z-50 px-5 py-2 bg-blue-600 text-white rounded-full shadow-lg"
        >
          Plan Trip
        </button>
      </div>

      {/* Right column: Station list */}
      <div className="w-1/3 h-full bg-white text-gray-900 p-6 overflow-y-auto shadow-lg">
        <input
          type="text"
          placeholder="Search gas stations..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
        />
        <ul>
          {stationList.map((station) => (
            <li
              key={station.id}
              onClick={() => handleStationSelect(station)}
              className="p-3 mb-2 bg-gray-100 rounded hover:bg-gray-200 cursor-pointer flex justify-between items-center"
            >
              <span>{station.name}</span>
              <span className="text-sm">
                {(station.distance / 1609.34).toFixed(2)} mi
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Modals */}
      <ConfirmPriceModal
        visible={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onSubmit={(price) => {
          console.log(`Price confirmed: ${price}`);
          setIsConfirmModalOpen(false);
        }}
      />

      <TripPlannerModal
        visible={isTripModalOpen}
        onClose={() => setIsTripModalOpen(false)}
        onPlanTrip={(start, dest) => console.log("Trip from", start, dest)}
      />
    </div>
  );
}

export default function ProtectedMapPage() {
  return (
    <ProtectedRoute>
      <div className="flex-1 h-screen">
        <MapPageContent />
      </div>
    </ProtectedRoute>
  );
}
