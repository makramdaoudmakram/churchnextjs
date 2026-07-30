import type { ApiResponse, LoginResponse } from "./charity-api-types";
import { parseApiResponse } from "./charity-api-types";
import {
  getCharityApiUrlCandidates,
  isDevelopmentCharityApi,
  resolveCharityApiUrl,
} from "./charity-api-config";

export { resolveCharityApiUrl as getServerCharityApiUrl, getCharityApiUrlCandidates as getServerCharityApiUrlCandidates };

/** Server-side login (NextAuth). */
export async function charityLoginServer(body: {
  userName: string;
  password: string;
}): Promise<ApiResponse<LoginResponse>> {
  const errors: string[] = [];

  for (const base of getCharityApiUrlCandidates()) {
    try {
      const res = await fetch(`${base}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
        signal: AbortSignal.timeout(30000),
      });
      return parseApiResponse<LoginResponse>(res);
    } catch (error) {
      errors.push(`${base}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return {
    success: false,
    message: isDevelopmentCharityApi()
      ? "Charity API is not running on port 5173. Run start-api.bat or dotnet run with the http profile."
      : `Charity API is not reachable at ${resolveCharityApiUrl()}. Check hosting and CHARITY_API_URL.`,
    errors,
  };
}
