"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  GoogleMap,
  Marker,
  DirectionsRenderer,
  useLoadScript,
} from "@react-google-maps/api";
import { useAuth } from "../lib/auth";
import AdBanner from "../../../components/AdBanner";

interface Station {
  latitude: number;
  longitude: number;
  [key: string]: any;
}

export default function TripPlannerPage() {
  // auth & plan state
  const { user, loading: authLoading } = useAuth();
  const [plan, setPlan] = useState<"Free" | "Premium" | null>(null);
  const [showAd, setShowAd] = useState(false);

  // map & route state
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

  // load Google Maps script
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: ["places"],
  });

  // 1️⃣ Fetch plan
  useEffect(() => {
    if (authLoading || !user) return;
    (async () => {
      const token = await user.getIdToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/account`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) {
        console.error("Could not fetch plan");
        return;
      }
      const { plan } = (await res.json()) as { plan: "Free" | "Premium" };
      setPlan(plan);
      if (plan === "Free") setShowAd(true);
    })();
  }, [authLoading, user]);

  // 2️⃣ Geolocate user
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

  // 3️⃣ Helpers
  const getCoordinatesFromPlace = async (
    place: string
  ): Promise<string | null> => {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?` +
        `address=${encodeURIComponent(place)}` +
        `&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    );
    const data = await res.json();
    if (data.status === "OK" && data.results.length) {
      const { lat, lng } = data.results[0].geometry.location;
      return `${lat},${lng}`;
    }
    console.error("Geocode failed:", data);
    return null;
  };

  const handlePlanRoute = async () => {
    if (!current || !destination) return;

    const destinationCoords = destination.includes(",")
      ? destination
      : await getCoordinatesFromPlace(destination);
    if (!destinationCoords) return;

    setResolvedDestination(destinationCoords);
    const [curLat, curLng] = current.split(",").map(parseFloat);
    const [dstLat, dstLng] = destinationCoords.split(",").map(parseFloat);

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/stations/plan-route`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_lat: curLat,
          current_lon: curLng,
          destination_lat: dstLat,
          destination_lon: dstLng,
          max_detour_km: 20,
          num_stations: 3,
        }),
      }
    );
    if (!res.ok) {
      console.error("Route planner error:", await res.text());
      return;
    }
    const data = await res.json();
    if (!data.waypoints) {
      console.error("Bad waypoints:", data);
      return;
    }
    setStations(data.waypoints);

    new google.maps.DirectionsService().route(
      {
        origin: { lat: curLat, lng: curLng },
        destination: { lat: dstLat, lng: dstLng },
        waypoints: data.waypoints.map((wp: Station) => ({
          location: { lat: wp.latitude, lng: wp.longitude },
          stopover: true,
        })),
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK" && result) setDirections(result);
        else console.error("Directions failed:", status, result);
      }
    );
  };

  const generateGoogleMapsUrl = (
    origin: string,
    destination: string,
    waypoints: Station[]
  ) => {
    const base = "https://www.google.com/maps/dir/?api=1";
    const o = `origin=${encodeURIComponent(origin)}`;
    const d = `destination=${encodeURIComponent(destination)}`;
    const w = waypoints.length
      ? `&waypoints=${encodeURIComponent(
          waypoints.map((wp) => `${wp.latitude},${wp.longitude}`).join("|")
        )}`
      : "";
    return `${base}&${o}&${d}${w}&travelmode=driving`;
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────────

  // loading guard
  if (authLoading || !isLoaded || !current || plan === null) {
    return (
      <div className="flex items-center justify-center h-screen">Loading…</div>
    );
  }

  // show ad for Free users
  if (showAd) {
    return <AdBanner onDone={() => setShowAd(false)} />;
  }

  // main UI
  return (
    <div className="flex flex-col items-center p-4 space-y-4 h-screen pb-14">
      <div className="w-full max-w-md space-y-2">
        <input
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="Destination name or coords"
        />
        <button
          onClick={handlePlanRoute}
          className="w-full p-2 bg-blue-600 text-white rounded shadow"
        >
          Plan Route
        </button>
      </div>

      <div className="w-full flex-1">
        <GoogleMap
          mapContainerClassName="w-full h-full"
          center={mapCenter}
          zoom={12}
          onLoad={(map) => {
            mapRef.current = map;
          }}
        >
          {directions && <DirectionsRenderer directions={directions} />}
          {stations.map((s, i) => (
            <Marker
              key={i}
              position={{ lat: s.latitude, lng: s.longitude }}
              label={`${i + 1}`}
            />
          ))}
        </GoogleMap>
      </div>

      {directions && resolvedDestination && (
        <a
          href={generateGoogleMapsUrl(current, resolvedDestination, stations)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto mb-4 px-4 py-2 bg-green-600 text-white rounded"
        >
          Open in Google Maps
        </a>
      )}
    </div>
  );
}
