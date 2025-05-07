"use client";

import { useAuth } from "../src/app/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RedirectIfAuthenticated({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/map");
    }
  }, [user, loading, router]);

  if (loading || user) {
    return <div className="text-white p-6">Loading...</div>;
  }

  return <>{children}</>;
}
