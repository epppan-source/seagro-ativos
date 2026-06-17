export function setSessionCookie(token: string, role: string) {
  document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 8}`
  document.cookie = `role=${role}; path=/; max-age=${60 * 60 * 8}`
}

export function clearSession() {
  document.cookie = "token=; Max-Age=0; path=/"
  document.cookie = "role=; Max-Age=0; path=/"
}

export function getRole(): string | null {
  if (typeof document === "undefined") return null
  return document.cookie.split("; ").find((c) => c.startsWith("role="))?.split("=")[1] || null
}
