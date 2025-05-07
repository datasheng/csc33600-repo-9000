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
  latest_price?: number | null;
  recorded_at?: string;
};

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

  const [stations, setStations] = useState<Station[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    latitude: "",
    longitude: "",
    price: "",
  });

  // Fetch stations with latest prices
  const fetchStations = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/stations`
      );
      const data: Station[] = await res.json();
      setStations(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStations();
  }, []);

  // handle form submission for adding a new station
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1) Create the station
    const stationRes = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/stations`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          latitude: parseFloat(form.latitude),
          longitude: parseFloat(form.longitude),
        }),
      }
    );

    if (!stationRes.ok) {
      console.error("Failed to create station");
      return;
    }
    const newStation = await stationRes.json();

    // 2) Immediately add its price
    const priceRes = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/${newStation.id}/prices`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price: parseFloat(form.price) }),
      }
    );

    if (!priceRes.ok) {
      console.error("Station created but failed to add price");
      return;
    }

    // 3) Update UI
    await fetchStations();
    setShowForm(false);
    setForm({ name: "", latitude: "", longitude: "", price: "" });
  };

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
              <div className="p-4 w-60 bg-white rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {selectedStation.name}
                </h3>

                <p className="text-sm text-gray-800 mb-1">
                  <span className="font-medium text-gray-900">Price:</span>{" "}
                  {selectedStation.latest_price != null ? (
                    <span className="text-green-700">
                      ${selectedStation.latest_price.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-red-600">N/A</span>
                  )}
                </p>

                {selectedStation.recorded_at && (
                  <p className="text-xs text-gray-600 mb-4">
                    Updated{" "}
                    {new Date(selectedStation.recorded_at).toLocaleString()}
                  </p>
                )}

                <div className="flex space-x-2">
                  <button
                    onClick={() => setIsConfirmModalOpen(true)}
                    className="flex-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() =>
                      alert(`${selectedStation.name} saved to favorites.`)
                    }
                    className="flex-1 px-3 py-1 border border-gray-400 hover:bg-gray-100 text-gray-800 rounded-lg transition"
                  >
                    Save
                  </button>
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>

        <div className="fixed bottom-6 right-6 z-50 flex space-x-3">
          <button
            className="px-5 py-2 bg-green-600 text-white rounded-full shadow-lg"
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? "Cancel" : "Add Station"}
          </button>

          <button
            onClick={() => setIsTripModalOpen(true)}
            className="px-5 py-2 bg-blue-600 text-white rounded-full shadow-lg"
          >
            Plan Trip
          </button>
        </div>
      </div>

      {showForm && (
        <div className="absolute top-16 left-4 z-10 bg-white p-6 rounded-lg shadow-lg w-80">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-gray-800 font-medium mb-1"
              >
                Station Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="Enter station name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="
            w-full p-2 border border-gray-300 rounded-lg
            text-gray-900 placeholder-gray-500 bg-gray-50
            focus:outline-none focus:ring-2 focus:ring-blue-500
          "
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="latitude"
                  className="block text-gray-800 font-medium mb-1"
                >
                  Latitude
                </label>
                <input
                  id="latitude"
                  type="text"
                  placeholder="e.g. 40.81"
                  value={form.latitude}
                  onChange={(e) =>
                    setForm({ ...form, latitude: e.target.value })
                  }
                  className="
              w-full p-2 border border-gray-300 rounded-lg
              text-gray-900 placeholder-gray-500 bg-gray-50
              focus:outline-none focus:ring-2 focus:ring-blue-500
            "
                />
              </div>
              <div>
                <label
                  htmlFor="longitude"
                  className="block text-gray-800 font-medium mb-1"
                >
                  Longitude
                </label>
                <input
                  id="longitude"
                  type="text"
                  placeholder="e.g. -73.94"
                  value={form.longitude}
                  onChange={(e) =>
                    setForm({ ...form, longitude: e.target.value })
                  }
                  className="
              w-full p-2 border border-gray-300 rounded-lg
              text-gray-900 placeholder-gray-500 bg-gray-50
              focus:outline-none focus:ring-2 focus:ring-blue-500
            "
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="price"
                className="block text-gray-800 font-medium mb-1"
              >
                Price (USD)
              </label>
              <input
                id="price"
                type="number"
                step="0.01"
                placeholder="e.g. 3.45"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="
            w-full p-2 border border-gray-300 rounded-lg
            text-gray-900 placeholder-gray-500 bg-gray-50
            focus:outline-none focus:ring-2 focus:ring-blue-500
          "
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
            >
              Add Station
            </button>
          </form>
        </div>
      )}

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
