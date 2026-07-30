import type { ApiResponse, RegisterResponse } from "./charity-api-types";
import { parseApiResponse } from "./charity-api-types";

export type { ApiResponse, LoginResponse, RegisterResponse } from "./charity-api-types";
export {
  charityLoginServer,
  getServerCharityApiUrl,
  getServerCharityApiUrlCandidates,
} from "./charity-api-server";

/** Register via same-origin Next route (server calls .NET API). */
export async function charityRegister(body: {
  userName: string;
  email: string;
  password: string;
  confirmPassword: string;
}): Promise<ApiResponse<RegisterResponse>> {
  try {
    const res = await fetch("/api/charity/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const parsed = await parseApiResponse<RegisterResponse>(res);
    if (res.status === 503 && !parsed.message) {
      return {
        success: false,
        message:
          "Charity API is offline. Run start-api.bat or: cd D:\\church\\churchapi && dotnet run --project src\\Charity.Api --launch-profile http",
        errors: parsed.errors,
      };
    }
    return parsed;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message:
        msg.includes("fetch") || msg.includes("Failed")
          ? "Cannot reach /api/charity/register. Restart npm run dev and ensure Charity API is running."
          : msg,
      errors: [msg],
    };
  }
}
