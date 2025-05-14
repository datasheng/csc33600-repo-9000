"use client";

import { useEffect, useState } from "react";

export default function AdBanner({ onDone }: { onDone: () => void }) {
  const [sec, setSec] = useState(30);

  useEffect(() => {
    if (sec <= 0) {
      onDone();
      return;
    }
    const t = setTimeout(() => setSec((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [sec, onDone]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
      <div className="p-6 bg-white rounded-lg text-center space-y-4">
        {/* Replace this with your actual ad or video */}
        <p className="font-medium">Your ad here…</p>
        <p>
          Ends in {sec} second{sec !== 1 && "s"}.
        </p>
      </div>
    </div>
  );
}
