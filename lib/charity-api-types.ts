/** Charity API response envelope */
export type ApiResponse<T> = {
  success: boolean;
  message?: string | null;
  data?: T | null;
  errors?: string[];
};

export type LoginResponse = {
  token: string;
  expiresAt: string;
  userName: string;
  roles: string[];
  permissions: string[];
};

export type RegisterResponse = {
  userId: number;
  userName: string;
  email: string;
};

export async function parseApiResponse<T>(res: Response): Promise<ApiResponse<T>> {
  const text = await res.text();
  let parsed: unknown;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    return {
      success: false,
      message: text || `HTTP ${res.status}`,
      errors: [text || `HTTP ${res.status}`],
    };
  }

  if (parsed && typeof parsed === "object" && "success" in parsed && typeof (parsed as ApiResponse<T>).success === "boolean") {
    return parsed as ApiResponse<T>;
  }

  if (res.ok) {
    return {
      success: true,
      data: (parsed ?? undefined) as T | undefined,
      message: res.status === 201 ? "Created successfully." : res.status === 204 ? "OK" : null,
    };
  }

  const obj = (parsed && typeof parsed === "object" ? parsed : {}) as Record<string, unknown>;
  const message =
    (typeof obj.message === "string" && obj.message) ||
    (typeof obj.title === "string" && obj.title) ||
    text ||
    `HTTP ${res.status}`;
  const errors = Array.isArray(obj.errors)
    ? obj.errors.filter((e): e is string => typeof e === "string")
    : [message];

  return { success: false, message, errors, data: null };
}
