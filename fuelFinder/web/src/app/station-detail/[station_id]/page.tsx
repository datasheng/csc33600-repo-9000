"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  GoogleMap,
  Marker,
  useLoadScript,
} from "@react-google-maps/api";

interface PriceHistoryItem {
  price: number;
  recorded_at: string;
}

interface StationDetail {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  latest_price: number | null;
  recorded_at: string | null;
  prices: PriceHistoryItem[];
}

export default function StationDetailPage() {
  const { station_id } = useParams();
  const [station, setStation] = useState<StationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [sentiment, setSentiment] = useState<string | null>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });

  useEffect(() => {
    const fetchStation = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/stations/${station_id}`
        );
        const data = await res.json();
        setStation(data);
      } catch (err) {
        console.error("Failed to fetch station:", err);
      } finally {
        setLoading(false);
      }
    };

    if (station_id) fetchStation();
  }, [station_id]);

  const fetchFeedback = async () => {
    if (!station) return;
    setFeedbackLoading(true);
    setSentiment(null);
    try {
       
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/stations/station-sentiment`, {
        method: "post",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: station.name,
          latitude: station.latitude,
          longitude: station.longitude,
        }),
      });

      const data = await res.json();
      setSentiment(data.summary);
    } catch (err) {
      console.error("Error fetching sentiment:", err);
      setSentiment("Failed to load feedback.");
    } finally {
      setFeedbackLoading(false);
    }
  };

  if (loading || !isLoaded)
    return <div className="p-6">Loading station info...</div>;

  if (!station)
    return <div className="p-6 text-red-600">Station not found.</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 ">
      <Link href="/" className="text-blue-600 underline hover:text-blue-800">
        ← Back to Map
      </Link>

      <div className="bg-white p-6 rounded-xl shadow-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{station.name}</h1>
        <p className="text-gray-600 mb-4">
          Coordinates: ({station.latitude.toFixed(5)}, {station.longitude.toFixed(5)})
        </p>

        <div className="w-full h-72 rounded-lg mb-6">
          <GoogleMap
            mapContainerClassName="w-full h-full"
            center={{ lat: station.latitude, lng: station.longitude }}
            zoom={15}
            options={{ disableDefaultUI: true }}
          >
            <Marker position={{ lat: station.latitude, lng: station.longitude }} />
          </GoogleMap>
        </div>

        <div className="bg-gray-100 p-4 rounded-md mb-6">
          <h2 className="text-xl font-semibold mb-2">Latest Price</h2>
          {station.latest_price != null ? (
            <p className="text-lg">
              <span className="font-medium text-green-600">
                ${station.latest_price.toFixed(2)}
              </span>{" "}
              <span className="text-sm text-gray-500">
                (Recorded on {new Date(station.recorded_at!).toLocaleString()})
              </span>
            </p>
          ) : (
            <p className="italic text-gray-500">No recent price data.</p>
          )}
        </div>

        <div className="bg-gray-100 p-4 rounded-md mb-4">
          <h2 className="text-xl font-semibold mb-3">Price History</h2>
          {station.prices.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {station.prices.slice(0, 10).map((item, idx) => (
                <li key={idx} className="py-2 flex justify-between text-sm">
                  <span>${item.price.toFixed(2)}</span>
                  <span className="text-gray-500">
                    {new Date(item.recorded_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="italic text-gray-500">No historical prices recorded.</p>
          )}
        </div>

        <div className="mb-4">
          <button
            onClick={fetchFeedback}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            disabled={feedbackLoading}
          >
            {feedbackLoading ? "Analyzing..." : "Client Feedback"}
          </button>
        </div>

        {feedbackLoading && <p className="text-sm italic text-gray-500">Fetching and analyzing feedback...</p>}
        {sentiment && (
          <div className="bg-blue-50 p-4 rounded-md border border-blue-200 mb-32">
            <h3 className="font-semibold mb-2">Sentiment Summary</h3>
            <p>{sentiment}</p>
          </div>
        )}
      </div>
    </div>
  );
}
