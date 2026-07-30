import type { NextConfig } from "next";

const charityApi =
  process.env.CHARITY_API_URL ??
  process.env.NEXT_PUBLIC_CHARITY_API_URL ??
  (process.env.NODE_ENV === "production"
    ? "https://eladra.aghapy-company.com"
    : "http://127.0.0.1:5173");

const nextConfig: NextConfig = {
  /** Proxy /charity-api/* → Charity .NET API (avoids CORS; works when API is running). */
  async rewrites() {
    return [
      {
        source: "/charity-api/:path*",
        destination: `${charityApi.replace(/\/$/, "")}/:path*`,
      },
    ];
  },
};

export default nextConfig;
