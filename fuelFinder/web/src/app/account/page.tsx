"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<{
    display_name?: string;
    email: string;
    created_at: string;
    last_login: string;
  } | null>(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (user) {
        try {
          const token = await user.getIdToken();
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (!res.ok) throw new Error(`Status ${res.status}`);
          const data = await res.json();
          setUserInfo(data);
        } catch (err) {
          console.error("Failed to fetch user info:", err);
        }
      }
    };
    fetchUserInfo();
  }, [user]);

  if (loading) {
    return <div className="p-6 text-white">Loading...</div>;
  }

  if (!user) {
    router.replace("/login");
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 text-white">
      <h1 className="text-3xl font-bold mb-6">Your Account</h1>

      <div className="bg-[#1f1f2e] p-6 rounded-lg shadow-lg border border-blue-500">
        <p className="text-lg mb-2">
          <span className="font-semibold">Name:</span>{" "}
          {userInfo?.display_name || "N/A"}
        </p>
        <p className="text-lg mb-2">
          <span className="font-semibold">Email:</span> {userInfo?.email}
        </p>
        <p className="text-lg mb-2">
          <span className="font-semibold">Joined:</span>{" "}
          {userInfo?.created_at &&
            new Date(userInfo.created_at).toLocaleDateString()}
        </p>
        <p className="text-lg mb-6">
          <span className="font-semibold">Last Login:</span>{" "}
          {userInfo?.last_login &&
            new Date(userInfo.last_login).toLocaleString()}
        </p>

        <button className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition">
          Upgrade Subscription
        </button>
      </div>
    </div>
  );
}
