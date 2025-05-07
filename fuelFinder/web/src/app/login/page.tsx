// app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";
import RedirectIfAuthenticated from "../../../components/RedirectIfAuthenticated";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/map");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <RedirectIfAuthenticated>
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="w-full max-w-md space-y-6">
          <h1 className="text-3xl text-center font-bold text-blue-500">
            Login
          </h1>

          <input
            type="email"
            placeholder="Email"
            className="w-full p-4 bg-gray-900 border border-blue-500 rounded text-white"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-4 bg-gray-900 border border-blue-500 rounded text-white"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="text-red-500 text-center">{error}</p>}

          <button
            onClick={handleLogin}
            className="w-full bg-blue-500 py-3 rounded text-white font-semibold"
          >
            Log In
          </button>

          <p className="text-center text-sm text-blue-400">
            Don&apos;t have an account?{" "}
            <a href="/register" className="underline">
              Register
            </a>
          </p>
        </div>
      </div>
    </RedirectIfAuthenticated>
  );
}
