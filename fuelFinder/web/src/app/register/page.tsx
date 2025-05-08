"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../lib/firebase";
import RedirectIfAuthenticated from "../../../components/RedirectIfAuthenticated";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // ✅ Update Firebase user profile with name
      await updateProfile(userCredential.user, {
        displayName: name,
      });

      // ✅ Force-refresh token and send it + display_name to backend
      const token = await userCredential.user.getIdToken(true);
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/register-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          display_name: name,
        }),
      });

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
            Register
          </h1>

          <input
            type="text"
            placeholder="Full Name"
            className="w-full p-4 bg-gray-900 border border-blue-500 rounded text-white"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

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
            onClick={handleRegister}
            className="w-full bg-blue-500 py-3 rounded text-white font-semibold"
          >
            Create Account
          </button>

          <p className="text-center text-sm text-blue-400">
            Already have an account?{" "}
            <a href="/login" className="underline">
              Log in
            </a>
          </p>
        </div>
      </div>
    </RedirectIfAuthenticated>
  );
}
