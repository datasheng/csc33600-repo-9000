import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../constants/firebase";
import { useState, useEffect } from "react";

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
          await fetch("http://192.168.1.7:8000/register-user", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ token }),
          });
          console.log("✅ User registration call sent.");
        } catch (err) {
          console.error("❌ Error registering user:", err);
        }
      }
    });

    return unsub;
  }, []);

  return { user, loading };
}
