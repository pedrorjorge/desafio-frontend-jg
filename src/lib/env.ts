export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || "/api";
export const mocksEnabled = import.meta.env.VITE_ENABLE_MOCKS === "true";

export const socketPath = "/kurio-realtime";
