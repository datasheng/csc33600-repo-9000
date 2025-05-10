"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  GoogleMap,
  Marker,
  DirectionsRenderer,
  useLoadScript,
} from "@react-google-maps/api";

interface Station {
  latitude: number;
  longitude: number;
  [key: string]: any;
}

export default function TripPlannerPage() {
  const [current, setCurrent] = useState<string | null>(null);
  const [destination, setDestination] = useState<string>("40.4406,-79.9959");
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>({ lat: 40.7306, lng: -73.9352 });

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: ["places"],
  });

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const latlng = `${coords.latitude},${coords.longitude}`;
        setCurrent(latlng);
        setMapCenter({ lat: coords.latitude, lng: coords.longitude });
      },
      () => {
        const fallback = "40.7306,-73.9352";
        setCurrent(fallback);
        setMapCenter({ lat: 40.7306, lng: -73.9352 });
      }
    );
  }, []);

  const handlePlanRoute = async () => {
    if (!current || !destination) return;

    const [currentLat, currentLng] = current.split(",").map(parseFloat);
    const [destLat, destLng] = destination.split(",").map(parseFloat);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/stations/plan-route`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            current_lat: currentLat,
            current_lon: currentLng,
            destination_lat: destLat,
            destination_lon: destLng,
            max_detour_km: 20,
            num_stations: 3,
          }),
        }
      );

      if (!res.ok) {
        console.error("Failed to fetch route:", await res.text());
        return;
      }

      const data = await res.json();

      if (!data || !Array.isArray(data.waypoints)) {
        console.error("Invalid response format:", data);
        return;
      }

      setStations(data.waypoints);

      const DirectionsService = new google.maps.DirectionsService();
      DirectionsService.route(
        {
          origin: { lat: currentLat, lng: currentLng },
          destination: { lat: destLat, lng: destLng },
          waypoints: data.waypoints.map((wp: Station) => ({
            location: { lat: wp.latitude, lng: wp.longitude },
            stopover: true,
          })),
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            setDirections(result);
          } else {
            console.error("Directions request failed", result);
          }
        }
      );
    } catch (error) {
      console.error("An error occurred while planning the route:", error);
    }
  };

  if (!isLoaded || !current) return <div>Loading map...</div>;

  return (
    <div className="flex flex-col items-center p-4 space-y-4 h-screen">
      <div className="flex flex-col space-y-2 w-full max-w-md">
        <input
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="p-2 border rounded"
          placeholder="Enter destination coordinates (lat,lng)"
        />
        <button
          onClick={handlePlanRoute}
          className="p-2 bg-blue-600 text-white rounded shadow"
        >
          Plan Route
        </button>
      </div>

      <div className="w-full h-full flex-1">
        <GoogleMap
          mapContainerClassName="w-full h-full"
          zoom={12}
          center={mapCenter}
          onLoad={(map) => {
            mapRef.current = map;
          }}
        >
          {directions && <DirectionsRenderer directions={directions} />}

          {stations.map((station, idx) => (
            <Marker
              key={idx}
              position={{ lat: station.latitude, lng: station.longitude }}
              label={(idx + 1).toString()}
            />
          ))}
        </GoogleMap>
      </div>
    </div>
  );
}
