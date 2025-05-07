"use client";

import React, { useState } from "react";

export type ConfirmPriceModalProps = {
  /** Controls visibility of the modal */
  visible: boolean;
  /** Called to close the modal without submitting */
  onClose: () => void;
  /** Called with the entered price when the form is submitted */
  onSubmit: (price: string) => void;
};

const ConfirmPriceModal: React.FC<ConfirmPriceModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const [price, setPrice] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(price);
    setPrice("");
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
              className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex space-x-2">
            <button
              type="submit"
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
            >
              Submit
            </button>
            <button
              type="button"
              onClick={() => {
                setPrice("");
                onClose();
              }}
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
