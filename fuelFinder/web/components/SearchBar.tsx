// components/SearchBar.tsx
"use client";

import React from "react";

type SearchBarProps = {
  value: string;
  onChange: (text: string) => void;
};

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <input
      type="text"
      placeholder="Search gas stations..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="absolute top-6 left-6 w-80 z-10 p-2 rounded-lg border border-blue-400 text-black shadow"
    />
  );
}
