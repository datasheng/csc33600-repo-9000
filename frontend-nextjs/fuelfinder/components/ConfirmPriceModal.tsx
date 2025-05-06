// components/ConfirmPriceModal.tsx
"use client";

import React, { useState } from "react";

type ConfirmPriceModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (price: string) => void;
};

export default function ConfirmPriceModal({
  visible,
  onClose,
  onSubmit,
}: ConfirmPriceModalProps) {
  const [price, setPrice] = useState("");

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-80 shadow-md">
        <h2 className="text-lg font-semibold mb-2">Enter Updated Price</h2>
        <input
          type="text"
          placeholder="$3.45"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mb-4"
        />
        <div className="flex justify-between">
          <button
            onClick={() => onSubmit(price)}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Submit
          </button>
          <button
            onClick={onClose}
            className="bg-gray-400 text-white px-4 py-2 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
