/** Base URL API — file độc lập, không import client/session (tránh vòng Metro). */
export function getBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (envUrl) {
    const u = envUrl.replace(/\/$/, "");
    return u.endsWith("/api/v1") ? u : `${u}/api/v1`;
  }

  const host =
    typeof window !== "undefined"
      ? "http://localhost:3000"
      : "http://10.0.2.2:3000";

  return `${host}/api/v1`;
}
