"use client";

import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#1f1f2e] px-8">
      <h1 className="text-2xl text-gray-300 mb-2">Welcome to</h1>
      <h2 className="text-4xl font-bold text-[#00c2ff] mb-10">FuelFinder</h2>

      <div className="w-full max-w-md space-y-4">
        <button
          onClick={() => router.push("/login")}
          className="w-full bg-[#00c2ff] text-white py-4 rounded-xl text-lg font-semibold shadow-md hover:opacity-90 transition"
        >
          Login
        </button>

        <button
          onClick={() => router.push("/register")}
          className="w-full bg-[#333] border border-[#00c2ff] text-white py-4 rounded-xl text-lg font-semibold hover:opacity-90 transition"
        >
          Sign Up
        </button>
      </div>
    </div>
  );
}
