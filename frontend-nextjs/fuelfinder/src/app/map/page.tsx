"use client";

import React, { useEffect, useState } from "react";
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

const mapContainerStyle = {
  width: "100%",
  height: "100vh",
};

const defaultCenter = {
  lat: 40.81987,
  lng: -73.94958,
};

function MapPageContent() {
  const [location, setLocation] = useState<google.maps.LatLngLiteral | null>(
    null
  );
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showTripModal, setShowTripModal] = useState(false);
  const [searchText, setSearchText] = useState("");

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ lat: latitude, lng: longitude });
      },
      () => {
        console.error("Permission denied or unavailable.");
        setLocation(defaultCenter);
      }
    );
  }, []);

  const handleConfirmPrice = (station: Station) => {
    setSelectedStation(station);
    setIsConfirming(true);
  };

  const handleSaveStation = (station: Station) => {
    alert(`${station.name} has been saved to favorites.`);
  };

  const handleSubmitPrice = (price: string) => {
    console.log(`New price for ${selectedStation?.name}: ${price}`);
    setIsConfirming(false);
  };

  const filteredStations = stations.filter((s) =>
    s.name.toLowerCase().includes(searchText.toLowerCase())
  );

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded || !location) return <div>Loading...</div>;

  return (
    <div className="relative h-screen w-screen bg-[#1f1f2e]">
      <input
        type="text"
        placeholder="Search gas stations..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        className="absolute z-10 top-4 left-4 w-80 p-2 rounded-lg border border-blue-400 text-black"
      />

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={location}
        zoom={14}
        options={{ disableDefaultUI: true }}
      >
        {filteredStations.map((station) => (
          <Marker
            key={station.id}
            position={{
              lat: station.latitude,
              lng: station.longitude,
            }}
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
            <div className="w-48">
              <h2 className="font-bold text-lg">{selectedStation.name}</h2>
              <p className="text-sm mb-2">{selectedStation.price}</p>
              <button
                onClick={() => handleConfirmPrice(selectedStation)}
                className="bg-blue-500 text-white px-2 py-1 rounded mr-2"
              >
                Confirm Price
              </button>
              <button
                onClick={() => handleSaveStation(selectedStation)}
                className="bg-gray-600 text-white px-2 py-1 rounded"
              >
                Save
              </button>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      <button
        onClick={() => setShowTripModal(true)}
        className="absolute bottom-6 right-6 bg-blue-500 text-white px-6 py-3 rounded-full shadow-lg"
      >
        Plan Trip
      </button>

      <ConfirmPriceModal
        visible={isConfirming}
        onClose={() => setIsConfirming(false)}
        onSubmit={handleSubmitPrice}
      />

      <TripPlannerModal
        visible={showTripModal}
        onClose={() => setShowTripModal(false)}
        onPlanTrip={(start, dest) =>
          console.log("Planning trip from:", start, "to:", dest)
        }
      />
    </div>
  );
}

export default function ProtectedMapPage() {
  return (
    <ProtectedRoute>
      <MapPageContent />
    </ProtectedRoute>
  );
}
