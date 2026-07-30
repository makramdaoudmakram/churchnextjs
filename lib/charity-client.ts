import type { ApiResponse } from "@/lib/charity-api-types";
import { parseApiResponse } from "@/lib/charity-api-types";

const offlineMessage =
  "Cannot reach the app API. Keep `npm run dev` running and start Charity API on port 5173.";

export async function charityClientGet<T>(url: string): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(url, { credentials: "same-origin", cache: "no-store" });
    const parsed = await parseApiResponse<T>(res);
    if (res.status === 401) {
      return {
        ...parsed,
        success: false,
        message: parsed.message ?? "Session expired. Log out and sign in again.",
      };
    }
    if (res.status === 503) {
      return {
        ...parsed,
        success: false,
        message: parsed.message ?? "Charity API is offline. Start the .NET API (port 5173).",
      };
    }
    return parsed;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: msg.includes("fetch") || msg.includes("Network")
        ? offlineMessage
        : msg,
      errors: [msg],
    };
  }
}

export async function charityClientSend<T>(
  url: string,
  method: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(url, {
      method,
      credentials: "same-origin",
      cache: "no-store",
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const parsed = await parseApiResponse<T>(res);
    if (res.status === 401) {
      return {
        ...parsed,
        success: false,
        message: parsed.message ?? "Session expired. Log out and sign in again.",
      };
    }
    if (res.status === 403) {
      return {
        ...parsed,
        success: false,
        message:
          parsed.message ??
          "You lack permission for this action. Log out and sign in again after an administrator updates your role.",
      };
    }
    if (res.status === 503) {
      return {
        ...parsed,
        success: false,
        message: parsed.message ?? "Charity API is offline. Start the .NET API (port 5173).",
      };
    }
    return parsed;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: msg.includes("fetch") || msg.includes("Network") ? offlineMessage : msg,
      errors: [msg],
    };
  }
}
