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
  const [destination, setDestination] = useState<string>("Statue of Liberty");
  const [resolvedDestination, setResolvedDestination] = useState<string | null>(
    null
  );
  const [directions, setDirections] =
    useState<google.maps.DirectionsResult | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>({
    lat: 40.7306,
    lng: -73.9352,
  });

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
        const fallback = "40.81987,-73.94958";
        setCurrent(fallback);
        setMapCenter({ lat: 40.81987, lng: -73.94958 });
      }
    );
  }, []);

  const getCoordinatesFromPlace = async (
    place: string
  ): Promise<string | null> => {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        place
      )}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();
    if (data.status === "OK" && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      return `${lat},${lng}`;
    } else {
      console.error("Failed to geocode place:", data);
      return null;
    }
  };

  const handlePlanRoute = async () => {
    if (!current || !destination) return;

    const destinationCoords = destination.includes(",")
      ? destination
      : await getCoordinatesFromPlace(destination);

    if (!destinationCoords) return;

    setResolvedDestination(destinationCoords);

    const [currentLat, currentLng] = current.split(",").map(parseFloat);
    const [destLat, destLng] = destinationCoords.split(",").map(parseFloat);

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

  const generateGoogleMapsUrl = (
    origin: string,
    destination: string,
    waypoints: Station[]
  ): string => {
    const base = "https://www.google.com/maps/dir/?api=1";
    const originParam = `origin=${encodeURIComponent(origin)}`;
    const destinationParam = `destination=${encodeURIComponent(destination)}`;

    const waypointParam =
      waypoints.length > 0
        ? `&waypoints=${encodeURIComponent(
            waypoints.map((wp) => `${wp.latitude},${wp.longitude}`).join("|")
          )}`
        : "";

    const travelMode = `&travelmode=driving`;

    return `${base}&${originParam}&${destinationParam}${waypointParam}${travelMode}`;
  };

  if (!isLoaded || !current) return <div>Loading map...</div>;

  return (
    <div className="flex flex-col items-center p-4 space-y-4 h-screen pb-14">
      <div className="flex flex-col space-y-2 w-full max-w-md">
        <input
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="p-2 border rounded"
          placeholder="Enter destination name or coordinates"
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

      {directions && resolvedDestination && (
        <a
          href={generateGoogleMapsUrl(current, resolvedDestination, stations)}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-10 inline-block px-4 py-2 bg-green-600 text-white rounded shadow"
        >
          Open in Google Maps
        </a>
      )}
    </div>
  );
}
