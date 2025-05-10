// app/map/page.tsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import ConfirmPriceModal from "../../../components/Modals/ConfirmPriceModal";
import TripPlannerModal from "../../../components/Modals/TripPlannerModal";
import ProtectedRoute from "../../../components/ProtectedRoute";
import AddStationModal from "../../../components/Modals/AddStationModal";
import StationInfoWindow from "../../../components/StationInfoWindow";
import { auth } from "../lib/firebase";
import { Station } from "../../../schemas/station";

/** Haversine distance in meters */
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const earthRadius = 6371e3;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const φ1 = toRad(lat1),
    φ2 = toRad(lat2),
    Δφ = toRad(lat2 - lat1),
    Δλ = toRad(lon2 - lon1);
  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/** Marker icon by price */
const getStationIcon = (price?: number | null): google.maps.Icon => {
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

function MapPageContent() {
  const [userLocation, setUserLocation] =
    useState<google.maps.LatLngLiteral | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [favorites, setFavorites] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [searchText, setSearchText] = useState("");

  const [isAddStationModalOpen, setIsAddStationModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);

  const mapRef = useRef<google.maps.Map | null>(null);

  /** Load all stations */
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

  /** Load user’s favorites */
  const fetchFavorites = async (): Promise<Station[]> => {
    try {
      const user = auth.currentUser;
      if (!user) return [];
      const token = await user.getIdToken(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/favorites`,
        {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) {
        console.error("Failed to load favorites", await res.text());
        return [];
      }
      const data = await res.json();
      setFavorites(Array.isArray(data) ? data : []);
      console.log("Fetched favorites:", data);
      return data;
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  // initial data load
  useEffect(() => {
    fetchStations();
    fetchFavorites();
  }, []);

  // get browser geolocation
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        setUserLocation({ lat: coords.latitude, lng: coords.longitude }),
      () => setUserLocation({ lat: 40.81987, lng: -73.94958 })
    );
  }, []);

  useEffect(() => {
    if (!userLocation) return;

    (async () => {
      try {
        // hit our populate‐nearby endpoint
        await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/stations/populate-nearby?lat=${userLocation.lat}&lng=${userLocation.lng}`,
          { method: "POST" }
        );
        // then reload full station list
        await fetchStations();
      } catch (e) {
        console.error("populate-nearby failed", e);
      }
    })();
  }, [userLocation]);
  // <-------------------------------------------------------------->

  // toggle favorite
  const toggleFavorite = async (station: Station) => {
    const isFavorited = favorites.some((f) => f.id === station.id);
    const user = auth.currentUser;
    if (!user) return;
    const token = await user.getIdToken(false);
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/favorites/${station.id}`,
      {
        method: isFavorited ? "DELETE" : "POST",
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!res.ok) console.error("toggle failed", await res.text());
    await fetchFavorites();
  };

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: ["places"],
  });

  if (loadError)
    return <div className="p-4 text-red-500">Failed to load Google Maps.</div>;
  if (!isLoaded || !userLocation)
    return <div className="p-4">Loading map...</div>;

  // filter & sort
  const stationList = stations
    .filter((s) => s.name.toLowerCase().includes(searchText.toLowerCase()))
    .map((s) => ({
      ...s,
      distance: calculateDistance(
        userLocation.lat,
        userLocation.lng,
        s.latitude,
        s.longitude
      ),
    }))
    .sort((a, b) => a.distance - b.distance);

  const handleStationSelect = (station: Station) => {
    setSelectedStation(station);
    if (mapRef.current) {
      mapRef.current.panTo({ lat: station.latitude, lng: station.longitude });
      setTimeout(() => mapRef.current?.setZoom(15), 500);
    }
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: Map */}
      <div className="flex-1 h-full relative">
        <GoogleMap
          mapContainerClassName="w-full h-full"
          center={userLocation}
          zoom={14}
          options={{ disableDefaultUI: true }}
          onLoad={(map): void => {
            mapRef.current = map;
          }}
        >
          <Marker
            position={userLocation}
            icon={{
              url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
              scaledSize: new google.maps.Size(36, 36),
            }}
            title="You are here"
          />
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
              onToggleFavorite={() => toggleFavorite(selectedStation)}
            />
          )}
        </GoogleMap>
      </div>

      {/* Right: Sidebar */}
      <div className="w-1/3 h-full bg-white text-gray-900 p-6 shadow-lg overflow-y-auto">
        <input
          type="text"
          placeholder="Search gas stations..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="sticky w-full p-2 mb-4 border rounded"
        />

        {/* Favorites */}
        <h2 className="text-lg font-semibold mb-2">Favorites</h2>
        {favorites.length ? (
          <ul className="space-y-2 mb-4">
            {favorites.map((f) => (
              <li
                key={f.id}
                onClick={() => handleStationSelect(f)}
                className="p-2 bg-yellow-50 rounded hover:bg-yellow-100 cursor-pointer"
              >
                {f.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="italic mb-4">No favorites yet.</p>
        )}
        <hr className="my-4" />

        {/* All stations */}
        <h2 className="text-lg font-semibold mb-2">All Stations</h2>
        <ul className="space-y-2">
          {stationList.map((s) => {
            const isActive = s.id === selectedStation?.id;
            return (
              <li
                key={s.id}
                onClick={() => handleStationSelect(s)}
                className={`p-3 bg-gray-100 rounded hover:bg-gray-200 cursor-pointer ${
                  isActive ? "ring-2 ring-blue-400" : ""
                }`}
              >
                <div className="flex justify-between">
                  <span>{s.name}</span>
                  <span className="text-sm">
                    {(s.distance / 1609.34).toFixed(2)} mi
                  </span>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Action buttons */}
        <div className="fixed bottom-6 right-6 flex space-x-3">
          <button
            className="px-5 py-2 bg-green-600 text-white rounded-full"
            onClick={() => setIsAddStationModalOpen((v) => !v)}
          >
            {isAddStationModalOpen ? "Cancel" : "Add Station"}
          </button>
          <button
            onClick={() => setIsTripModalOpen(true)}
            className="px-5 py-2 bg-blue-600 text-white rounded-full"
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
          setIsAddStationModalOpen(false);
          fetchStations();
        }}
      />

      <ConfirmPriceModal
        visible={isConfirmModalOpen}
        stationID={selectedStation?.id ?? -1}
        onClose={() => setIsConfirmModalOpen(false)}
        onSuccess={async () => {
          setIsConfirmModalOpen(false);
          await fetchStations();
          const updated = stations.find((s) => s.id === selectedStation?.id);
          if (updated) setSelectedStation(updated);
        }}
      />

      <TripPlannerModal
        visible={isTripModalOpen}
        onClose={() => setIsTripModalOpen(false)}
        onPlanTrip={(start, dest) =>
          console.log("Planning trip from", start, dest)
        }
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
