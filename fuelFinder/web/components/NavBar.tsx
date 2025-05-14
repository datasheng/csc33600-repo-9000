"use client";

import Link from "next/link";
import { useAuth } from "../src/app/lib/auth";
import { auth } from "../src/app/lib/firebase";
import { signOut } from "firebase/auth";
import { useState } from "react";

export default function Navbar() {
  const { user, loading } = useAuth();
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const redirectPath = !loading && user ? "/map" : "/";

  return (
    <nav className="bg-[#1f1f2e] text-white px-8 py-4 flex justify-between items-center shadow-md">
      <Link
        href={redirectPath}
        className="text-2xl font-bold text-blue-400 hover:text-blue-300 transition-colors duration-200"
      >
        FuelFinder
      </Link>

      <div className="flex items-center gap-6">
        {!loading && user ? (
          <>
            <Link
              href="/map"
              className="hover:text-blue-300 transition-colors duration-200"
            >
              Map
            </Link>

            <div className="relative">
              <button
                onClick={() => setShowAccountMenu((prev) => !prev)}
                className="hover:text-blue-300 transition-colors duration-200"
              >
                Account ▾
              </button>
              {showAccountMenu && (
                <div className="absolute right-0 mt-2 bg-[#2c2c3d] shadow-lg rounded-lg w-32 py-2 z-50">
                  <Link
                    href="/account"
                    className="block px-4 py-2 hover:bg-[#3b3b51] transition-colors duration-200"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-red-400 hover:bg-[#3b3b51] hover:text-red-300 transition-colors duration-200"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="hover:text-blue-300 transition-colors duration-200"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="hover:text-blue-300 transition-colors duration-200"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
