"use client";

import { useEffect, useState } from "react";

type Health = {
  ok: boolean;
  message?: string;
  startCommand?: string;
  backend?: string;
};

export function ApiStatusBanner() {
  const [health, setHealth] = useState<Health | null>(null);
  const isDev = process.env.NODE_ENV === "development";

  useEffect(() => {
    fetch("/api/charity/health", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setHealth(data))
      .catch(() =>
        setHealth({
          ok: false,
          message: isDev
            ? "Network error — start Charity API (port 5173) and ensure npm run dev is running."
            : "Network error — could not reach the production API.",
        })
      );
  }, [isDev]);

  if (!health || health.ok) {
    return null;
  }

  return (
    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
      <p className="font-medium">Charity API is not running</p>
      <p className="mt-1">{health.message}</p>
      {isDev && health.startCommand && (
        <>
          <p className="mt-2 font-mono text-xs break-all">{health.startCommand}</p>
          <p className="mt-2 text-xs">
            Or double-click <strong>start-api.bat</strong> in this project folder.
          </p>
        </>
      )}
      {!isDev && (
        <p className="mt-2 text-xs">
          Expected API: <strong>https://eladra.aghapy-company.com</strong> — verify IIS publish and{" "}
          <code className="text-xs">CHARITY_API_URL</code> on the host.
        </p>
      )}
    </div>
  );
}
