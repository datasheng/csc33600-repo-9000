"use client";

import React, { useState } from "react";

export type AddStationModalProps = {
  visible: boolean;
  onSuccess: () => void;
  onCancel: () => void;
};

const AddStationModal: React.FC<AddStationModalProps> = ({
  visible,
  onSuccess,
  onCancel,
}) => {
  const [form, setForm] = useState({
    name: "",
    latitude: "",
    longitude: "",
    price: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      form.name === "" ||
      form.latitude === "" ||
      form.longitude === "" ||
      form.price === ""
    ) {
      alert("Please fill in all fields");
      return;
    }

    try {
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
      if (!stationRes.ok) throw new Error("Failed to create station");
      const newStation = await stationRes.json();

      // 2) Immediately add its price
      const priceRes = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/stations/${newStation.id}/prices`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ price: parseFloat(form.price) }),
        }
      );
      if (!priceRes.ok) throw new Error("Failed to add price");

      // 3) Notify parent and reset
      onSuccess();
      setForm({ name: "", latitude: "", longitude: "", price: "" });
    } catch (err) {
      console.error(err);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-30"></div>
      <div className="relative bg-white p-6 rounded-lg shadow-lg w-80">
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
              className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex space-x-2">
            <button
              type="submit"
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
            >
              Add Station
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2 border border-gray-400 hover:bg-gray-100 text-gray-800 font-semibold rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </form>{" "}
      </div>
    </div>
  );
};

export default AddStationModal;
