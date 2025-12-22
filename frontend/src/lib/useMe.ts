"use client";

import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";

export type Me = {
  id: string;
  email: string;
  shop_id: string;
  shop_name: string;
};

export function useMe() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = (await apiFetch("/api/users/me")) as Me;
        if (!cancelled) setMe(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Not authenticated");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { me, loading, error };
}
