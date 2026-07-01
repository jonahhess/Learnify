const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || "";

// Keep URL joins predictable by removing any trailing slash.
export const API_BASE_URL = configuredApiBaseUrl.replace(/\/+$/, "");
