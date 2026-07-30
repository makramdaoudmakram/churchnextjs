import { auth } from "@/auth";
import { getServerCharityApiUrlCandidates } from "@/lib/charity-api-server";
import { permissionHintForCharityPath } from "@/lib/charity-permissions";
import { NextResponse } from "next/server";

async function resolveAccessToken(): Promise<string | undefined> {
  const session = await auth();
  return session?.accessToken;
}

export async function proxyCharityApi(pathWithQuery: string, init?: RequestInit) {
  let token: string | undefined;
  try {
    token = await resolveAccessToken();
  } catch (error) {
    console.error("[charity-proxy] resolve token", error);
    return NextResponse.json(
      {
        success: false,
        message: "Auth error. Check AUTH_SECRET in .env.local and restart npm run dev.",
        errors: [error instanceof Error ? error.message : String(error)],
      },
      { status: 500 }
    );
  }

  if (!token) {
    return NextResponse.json(
      {
        success: false,
        message: "Not signed in or missing API token. Log out, log in again, then retry.",
        errors: ["Unauthorized"],
      },
      { status: 401 }
    );
  }

  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const errors: string[] = [];
  for (const base of getServerCharityApiUrlCandidates()) {
    try {
      const path = pathWithQuery.startsWith("/") ? pathWithQuery : `/${pathWithQuery}`;
      const res = await fetch(`${base}${path}`, {
        ...init,
        headers,
        cache: "no-store",
        redirect: "manual",
        signal: AbortSignal.timeout(30000),
      });

      if (res.status >= 300 && res.status < 400) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Charity API rejected JWT (redirect to login). Restart the API after rebuild — Identity cookie auth must be disabled for /api.",
            errors: [`HTTP ${res.status} redirect from ${base}${path}`],
          },
          { status: 502 }
        );
      }

      const text = await res.text();
      if (res.status === 401 || res.status === 403) {
        const method = (init?.method ?? "GET").toUpperCase();
        const writeHint = permissionHintForCharityPath(path, method);
        return NextResponse.json(
          {
            success: false,
            message:
              res.status === 401
                ? "API unauthorized. Log out and sign in again."
                : `You lack permission for this action (${writeHint}). Log out and sign in again after the API restarts, or use admin / Admin@123.`,
            errors: [text || `HTTP ${res.status}`],
          },
          { status: res.status }
        );
      }

      return new NextResponse(text || "{}", {
        status: res.status,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      errors.push(`${base}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return NextResponse.json(
    { success: false, message: "Charity API is not reachable.", errors },
    { status: 503 }
  );
}
