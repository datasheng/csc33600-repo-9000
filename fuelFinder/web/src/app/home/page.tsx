"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleFindStations = async () => {
    setLoading(true);

    if (!navigator.geolocation) {
      console.warn("Geolocation unsupported. Skipping to map.");
      router.push("/map");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/populate-nearby`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(coords),
            }
          );

          if (!res.ok) {
            console.error("populate-nearby failed:", await res.text());
          }
        } catch (error) {
          console.error("populate-nearby error:", error);
        } finally {
          router.push("/map");
        }
      },
      (error) => {
        console.warn("Geolocation failed:", error.message);
        router.push("/map");
      }
    );
  };

  return (
    <main className="min-h-screen bg-blue-50 p-6 relative flex items-center justify-center">
      {/* Account button in top-right corner */}
      <button
        onClick={() => router.push("/account")}
        className="absolute top-6 right-6 text-blue-700 hover:text-blue-900 font-semibold"
      >
        Account
      </button>

      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-blue-700">Fuel Finder</h1>
        <p className="text-blue-600 text-base max-w-md mx-auto">
          Find the cheapest and nearest gas stations near you.
        </p>
        <button
          onClick={handleFindStations}
          className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-6 py-3 rounded-2xl shadow-md transition inline-flex items-center justify-center"
          disabled={loading}
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-5 w-5 mr-2 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                ></path>
              </svg>
              Finding...
            </>
          ) : (
            "Find Stations"
          )}
        </button>
      </div>
    </main>
  );
}
