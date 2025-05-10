"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/auth"; // use the shared auth context

interface AccountInfo {
  email: string;
  last_login: string;
  plan: "Free" | "Premium";
}

export default function AccountPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAccountInfo = async () => {
    try {
      if (!user) {
        setError("Not logged in.");
        setLoading(false);
        return;
      }

      const token = await user.getIdToken(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/account`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch account info");

      const data = await res.json();
      setAccount(data);
    } catch (e) {
      setError("Error fetching account info");
    } finally {
      setLoading(false);
    }
  };

  const togglePremium = async () => {
    setToggleLoading(true);
    try {
      if (!user) {
        setError("Not logged in.");
        return;
      }
      const token = await user.getIdToken(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/account/toggle-premium`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) throw new Error("Failed to toggle plan");

      const data = await res.json();
      setAccount((prev) => (prev ? { ...prev, plan: data.new_plan } : prev));
    } catch {
      setError("Error toggling plan");
    } finally {
      setToggleLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) fetchAccountInfo();
  }, [authLoading, user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-blue-50">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-blue-50">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-blue-50 p-6 flex justify-center items-center">
      <div className="bg-white p-6 rounded-xl shadow-md space-y-4 w-full max-w-md text-black">
        <h1 className="text-2xl font-bold text-blue-700">My Account</h1>
        <p><strong>Email:</strong> {account?.email}</p>
        <p><strong>Plan:</strong> {account?.plan}</p>
        <p><strong>Last Login:</strong> {new Date(account!.last_login).toLocaleString()}</p>

        <button
          onClick={togglePremium}
          disabled={toggleLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow-md"
        >
          {toggleLoading
            ? "Updating..."
            : account?.plan === "Free"
            ? "Upgrade to Premium"
            : "Downgrade to Free"}
        </button>
      </div>
    </main>
  );
}
