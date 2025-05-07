"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  GoogleMap,
  Marker,
  InfoWindow,
  useLoadScript,
} from "@react-google-maps/api";
import ConfirmPriceModal from "../../../components/Modals/ConfirmPriceModal";
import TripPlannerModal from "../../../components/Modals/TripPlannerModal";
import ProtectedRoute from "../../../components/ProtectedRoute";
import AddStationModal from "../../../components/Modals/AddStationModal";
import StationInfoWindow from "../../../components/StationInfoWindow";
import { auth } from "../lib/firebase";
import { Station } from "../../../schemas/station";

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
  const [searchText, setSearchText] = useState("");
  const mapRef = useRef<google.maps.Map | null>(null);

  const [stations, setStations] = useState<Station[]>([]);
  const [favorites, setFavorites] = useState<Station[]>([]);

  const [isAddStationModalOpen, setIsAddStationModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);

  // Fetch stations with latest prices
  const fetchStations = async (): Promise<Station[]> => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/stations`
      );
      const data: Station[] = await res.json();
      setStations(data);

      console.log("Fetched stations:", data);
      return data;
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  const fetchFavorites = async (): Promise<Station[]> => {
    try {
      const user = auth.currentUser;
      if (!user) {
        // not signed in yet
        return [];
      }

      // get fresh token
      const token = await user.getIdToken(/* forceRefresh= */ true);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/favorites`,
        {
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        console.error("Failed to load favorites", await res.text());
        return [];
      }

      const data = await res.json();
      // guard against non‑array
      const favs = Array.isArray(data) ? data : [];
      setFavorites(favs);

      console.log("Fetched favorites:", favs);
      return favs;
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  const getStationIcon = (price?: number | null): google.maps.Icon => {
    // choose green if under $3.50, yellow if between, red if expensive
    const color =
      price == null
        ? "grey"
        : price < 3.5
        ? "green"
        : price < 4.0
        ? "yellow"
        : "red";

    return {
      url: `http://maps.google.com/mapfiles/ms/icons/${color}-dot.png`,
      scaledSize: new google.maps.Size(32, 32),
    };
  };

  useEffect(() => {
    fetchStations();
    fetchFavorites();
  }, []);

  const toggleFavorite = async (station: Station) => {
    const isFavorited = favorites.some((f) => f.id === station.id);

    const user = auth.currentUser;
    if (!user) return;

    const token = await user.getIdToken(/* forceRefresh= */ false);
    const method = isFavorited ? "DELETE" : "POST";

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/favorites/${station.id}`,
      {
        method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!res.ok) {
      console.error("toggle failed", await res.text());
    }
    // re-fetch your updated list
    await fetchFavorites();
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
    const map = mapRef.current;
    if (!map) return;

    map.panTo({ lat: station.latitude, lng: station.longitude });

    setTimeout(() => {
      map.setZoom(15);
    }, 500);
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
          {userLocation && (
            <Marker
              position={userLocation}
              icon={{
                url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                scaledSize: new google.maps.Size(36, 36),
              }}
              title="You are here"
            />
          )}
          {stationList.map((station) => (
            <Marker
              key={station.id}
              position={{ lat: station.latitude, lng: station.longitude }}
              icon={getStationIcon(station.latest_price)}
              onClick={() => setSelectedStation(station)}
            />
          ))}

          {selectedStation && (
            <StationInfoWindow
              station={selectedStation}
              onClose={() => setSelectedStation(null)}
              onConfirm={() => setIsConfirmModalOpen(true)}
              isFavorited={favorites.some((f) => f.id === selectedStation.id)}
              onToggleFavorite={() => {
                toggleFavorite(selectedStation);
              }}
            />
          )}
        </GoogleMap>
      </div>

      {/* Right column: Station list */}
      <div className="w-1/3 h-full bg-white text-gray-900 p-6 shadow-lg">
        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search gas stations..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="sticky w-full p-2 mb-4 border rounded"
        />

        <div className="overflow-y-auto max-h-[calc(100vh-250px)]">
          {" "}
          {/* Adjusted height */}
          {/* Scrollable container */}
          {/* Favorites Section */}
          <h2 className="text-lg font-semibold mb-2">Favorites</h2>
          {favorites.length ? (
            <ul className="space-y-2 mb-4">
              {favorites.map((station) => (
                <li
                  key={station.id}
                  onClick={() => handleStationSelect(station)}
                  className="p-2 bg-yellow-50 rounded-lg hover:bg-yellow-100 cursor-pointer transition duration-200 ease-in-out"
                >
                  {station.name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm italic mb-4">No favorites yet.</p>
          )}
          <hr className="my-4" />
          {/* Station List */}
          <ul className="space-y-2">
            {stationList.map((station) => {
              const isActive = selectedStation?.id === station.id;
              return (
                <li
                  key={station.id}
                  onClick={() => handleStationSelect(station)}
                  className={`
            p-3 bg-gray-100 rounded-lg hover:bg-gray-200 cursor-pointer transition duration-200 ease-in-out
            ${isActive ? "ring-2 ring-blue-400" : ""}
          `}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{station.name}</p>
                      <p className="text-sm text-gray-600">
                        {station.latest_price != null
                          ? `$${station.latest_price.toFixed(2)}`
                          : "No price"}
                      </p>
                    </div>
                    <p className="text-sm">
                      {(station.distance / 1609.34).toFixed(2)} mi
                    </p>
                  </div>

                  {/* Expand past prices when active */}
                  {isActive && (station.prices?.length ?? 0) > 0 && (
                    <ul className="mt-2 bg-gray-50 border border-gray-200 rounded-md p-2 space-y-1">
                      {station.prices!.slice(0, 5).map((p) => (
                        <li
                          key={p.recorded_at}
                          className="flex justify-between text-sm"
                        >
                          <span>${p.price.toFixed(2)}</span>
                          <span className="text-gray-500">
                            {new Date(p.recorded_at).toLocaleString()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Floating Buttons */}
        <div className="fixed bottom-6 right-6 z-50 flex space-x-3">
          <button
            className="px-5 py-2 bg-green-600 text-white rounded-full shadow-lg"
            onClick={() => setIsAddStationModalOpen((v) => !v)}
          >
            {isAddStationModalOpen ? "Cancel" : "Add Station"}
          </button>

          <button
            onClick={() => setIsTripModalOpen(true)}
            className="px-5 py-2 bg-blue-600 text-white rounded-full shadow-lg"
          >
            Plan Trip
          </button>
        </div>
      </div>

      {/* Modals */}
      <AddStationModal
        visible={isAddStationModalOpen}
        onCancel={() => setIsAddStationModalOpen(false)}
        onSuccess={() => {
          fetchStations();
          setIsAddStationModalOpen(false);
        }}
      />

      <ConfirmPriceModal
        visible={isConfirmModalOpen}
        stationID={selectedStation?.id ?? -1}
        onClose={() => setIsConfirmModalOpen(false)}
        onSuccess={async () => {
          setIsConfirmModalOpen(false);

          const id = selectedStation?.id;
          if (id == null) return;

          const updated = await fetchStations();

          const fresh = updated.find((s) => s.id === id);
          if (fresh) setSelectedStation(fresh);
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
