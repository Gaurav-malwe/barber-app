import { API_BASE_URL } from "./config";

export async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    credentials: "include",
  });

  if (!res.ok) {
    let detail: unknown = "Request failed";
    try {
      const data = await res.json();
      detail = data?.detail ?? detail;
    } catch {
      // ignore
    }

    if (typeof detail === "string") throw new Error(detail);
    if (Array.isArray(detail)) {
      const msg = detail
        .map((e: unknown) => {
          const rec = (typeof e === "object" && e !== null ? (e as Record<string, unknown>) : null);
          const locRaw = rec ? rec["loc"] : undefined;
          const msgRaw = rec ? rec["msg"] : undefined;
          const loc = Array.isArray(locRaw)
            ? locRaw.map(String).slice(1).join(".")
            : "field";
          const m = typeof msgRaw === "string" ? msgRaw : "Invalid value";
          return `${loc}: ${m}`;
        })
        .join("\n");
      throw new Error(msg || "Request failed");
    }

    try {
      throw new Error(JSON.stringify(detail));
    } catch {
      throw new Error("Request failed");
    }
  }

  if (res.status === 204) return null;
  return res.json();
}
