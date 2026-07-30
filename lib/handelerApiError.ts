export function handelerApiError(error, defualteMessage = "sume thing went wrong") {
  if (!error) return defualteMessage;

  if (error?.response?.error?.message) {
    return error.response.error.message;
  }

  if (error?.error?.message) {
    return error.error.message;
  }
  if (error?.message) {
    return error.message;
  }

  return defualteMessage;
}
