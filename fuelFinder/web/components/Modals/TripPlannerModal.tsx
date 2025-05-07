// components/TripPlannerModal.tsx
"use client";

import React, { useState } from "react";

type TripPlannerModalProps = {
  visible: boolean;
  onClose: () => void;
  onPlanTrip: (start: string, destination: string) => void;
};

export default function TripPlannerModal({
  visible,
  onClose,
  onPlanTrip,
}: TripPlannerModalProps) {
  const [start, setStart] = useState("");
  const [destination, setDestination] = useState("");

  const handleSubmit = () => {
    if (start.trim() && destination.trim()) {
      onPlanTrip(start, destination);
      setStart("");
      setDestination("");
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
      <div className="bg-white p-6 w-full max-w-md rounded-t-xl shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-center">
          Plan Your Trip
        </h2>
        <input
          type="text"
          placeholder="Start Location"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded mb-3"
        />
        <input
          type="text"
          placeholder="Destination"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded mb-4"
        />
        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white w-full py-3 rounded mb-2"
        >
          Plan Trip
        </button>
        <button
          onClick={onClose}
          className="text-gray-500 text-sm w-full text-center"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
