export function generateUserId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export function getUserId(): string | null {
  if (typeof window === "undefined") {
    return null
  }
  return localStorage.getItem("userId")
}
