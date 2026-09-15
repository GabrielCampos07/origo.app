"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  clearAuthSession,
  getAccessToken,
  getMissingDocVersions,
  getStoredUser,
  type OrigoUser,
} from "./auth-storage";
import { fetchMe } from "./me";

export function useProfessionalAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<OrigoUser | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }

    const missingDocs = getMissingDocVersions();
    if (missingDocs && missingDocs.length > 0) {
      router.push("/legal/accept");
      return;
    }

    const storedUser = getStoredUser();
    if (!storedUser) {
      router.push("/login");
      return;
    }

    // P1 SEC: fail-closed — PROFESSIONAL only
    if (storedUser.role !== "PROFESSIONAL") {
      router.push("/dashboard/aluno");
      return;
    }

    setUser(storedUser);
    setLoading(false);

    void fetchMe().then((result) => {
      if (result.ok) setUser(getStoredUser());
    });
  }, [router]);

  function handleLogout() {
    clearAuthSession();
    router.push("/login");
  }

  return { loading, user, handleLogout };
}
