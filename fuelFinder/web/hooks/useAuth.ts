import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../src/app/lib/firebase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);

      if (user) {
        try {
          const token = await user.getIdToken();

          await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/register-user`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ token }),
          });

          console.log("✅ Registered user with backend.");
        } catch (err) {
          console.error("❌ Backend registration failed:", err);
        }
      }
    });

    return () => unsub();
  }, []);

  return { user, loading };
}
