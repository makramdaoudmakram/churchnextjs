/** Normalize rowVersion from API JSON (base64 string or number[]). */
export function normalizeRowVersion(value: unknown): string {
  if (typeof value === "string" && value.length > 0) return value;
  if (Array.isArray(value) && value.every((n) => typeof n === "number")) {
    const bytes = new Uint8Array(value);
    let binary = "";
    bytes.forEach((b) => {
      binary += String.fromCharCode(b);
    });
    return typeof btoa !== "undefined"
      ? btoa(binary)
      : Buffer.from(bytes).toString("base64");
  }
  return "";
}

export function apiErrorMessage(
  result: { message?: string | null; errors?: string[] },
  fallback: string
): string {
  const errors = result.errors?.filter(Boolean) ?? [];
  if (errors.length > 0) return errors.join(" ");
  if (result.message && result.message !== "Operation failed.") return result.message;
  return fallback;
}
