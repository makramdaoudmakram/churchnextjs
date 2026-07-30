export function handelerApiError(error: unknown, defualteMessage = "sume thing went wrong") {
  if (!error) return defualteMessage;

  const err = error as {
    response?: { error?: { message?: string } };
    error?: { message?: string };
    message?: string;
  };

  if (err.response?.error?.message) {
    return err.response.error.message;
  }

  if (err.error?.message) {
    return err.error.message;
  }
  if (err.message) {
    return err.message;
  }

  return defualteMessage;
}
