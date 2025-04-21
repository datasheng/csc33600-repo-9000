import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../constants/firebase";
import { useState, useEffect } from "react";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUser(user); // ✅ user is either Firebase User or null
      setLoading(false);
    });

    return unsub;
  }, []);

  return { user, loading };
}
