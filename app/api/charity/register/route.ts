import { NextRequest, NextResponse } from "next/server";
import { getServerCharityApiUrlCandidates } from "@/lib/charity-api-server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const errors: string[] = [];

  for (const backend of getServerCharityApiUrlCandidates()) {
    try {
      const res = await fetch(`${backend}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
        signal: AbortSignal.timeout(30000),
      });
      const text = await res.text();
      return new NextResponse(text || "{}", {
        status: res.status,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      errors.push(`${backend}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return NextResponse.json(
    {
      success: false,
      message:
        "Charity API is not running on port 5173. Double-click start-api.bat in this folder or run the start command in API-SETUP.md.",
      errors,
    },
    { status: 503 }
  );
}
