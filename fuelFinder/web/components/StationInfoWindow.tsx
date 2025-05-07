"use client";
import React from "react";
import { InfoWindow } from "@react-google-maps/api";
import { Station } from "../schemas/station";

type StationInfoWindowProps = {
  station: Station;
  onClose: () => void;
  onConfirm: () => void;
  isFavorited: boolean;
  onToggleFavorite: () => void;
};

export default function StationInfoWindow({
  station,
  onClose,
  onConfirm,
  isFavorited,
  onToggleFavorite,
}: StationInfoWindowProps) {
  return (
    <InfoWindow
      position={{ lat: station.latitude, lng: station.longitude }}
      onCloseClick={onClose}
    >
      <div className="p-4 w-60 bg-white rounded-lg shadow-md">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{station.name}</h3>

        <p className="text-sm text-gray-800 mb-1">
          <span className="font-medium text-gray-900">Price:</span>{" "}
          {station.latest_price != null ? (
            <span className="text-green-700">
              ${station.latest_price.toFixed(2)}
            </span>
          ) : (
            <span className="text-red-600">N/A</span>
          )}
        </p>

        {station.recorded_at && (
          <p className="text-xs text-gray-600 mb-4">
            Updated {new Date(station.recorded_at).toLocaleString()}
          </p>
        )}

        <div className="flex space-x-2">
          <button
            onClick={onConfirm}
            className="flex-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            Confirm
          </button>
          <button
            onClick={onToggleFavorite}
            className={`flex-1 px-3 py-1 rounded-lg transition
              ${
                isFavorited
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "border border-gray-400 hover:bg-gray-100 text-gray-800"
              }`}
          >
            {isFavorited ? "Unsave" : "Save"}
          </button>
        </div>
      </div>
    </InfoWindow>
  );
}
