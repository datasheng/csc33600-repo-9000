"use client";

import Link from "next/link";
import { useAuth } from "../lib/auth";
import { auth } from "../lib/firebase";
import { signOut } from "firebase/auth";

export default function Navbar() {
  const { user, loading } = useAuth();

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <nav className="bg-[#1f1f2e] text-white px-6 py-4 flex justify-between items-center shadow-md">
      <Link href="/" className="text-2xl font-bold text-blue-400">
        FuelFinder
      </Link>

      <div className="flex gap-4 items-center">
        {!loading && user ? (
          <>
            <Link href="/map" className="hover:text-blue-300">
              Map
            </Link>
            <button
              onClick={handleLogout}
              className="text-red-400 hover:text-red-300"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="hover:text-blue-300">
              Login
            </Link>
            <Link href="/register" className="hover:text-blue-300">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
