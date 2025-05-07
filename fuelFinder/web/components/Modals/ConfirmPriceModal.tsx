"use client";

import React, { useState } from "react";

export type ConfirmPriceModalProps = {
  visible: boolean;
  stationID: number;
  onSuccess: () => void;
  onClose: () => void;
};

const ConfirmPriceModal: React.FC<ConfirmPriceModalProps> = ({
  visible,
  stationID,
  onSuccess,
  onClose,
}) => {
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/stations/${stationID}/prices`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ price: Number(price) }),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Error ${res.status}: ${text}`);
      }

      const newPriceRecord: { price: number; recorded_at: string } =
        await res.json();

      onSuccess();
      setPrice("");
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to add price");
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-30"></div>
      <div className="relative bg-white p-6 rounded-lg shadow-lg w-80">
        <form onSubmit={handleSubmit} className="space-y-4">
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
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={loading}
              className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex space-x-2">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-2 font-semibold rounded-lg transition
                ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
            >
              {loading ? "Submitting…" : "Submit"}
            </button>
            <button
              type="button"
              onClick={() => {
                setPrice("");
                setError(null);
                onClose();
              }}
              disabled={loading}
              className="flex-1 py-2 border border-gray-400 hover:bg-gray-100 text-gray-800 font-semibold rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfirmPriceModal;
