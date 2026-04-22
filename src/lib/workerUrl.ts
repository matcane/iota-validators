export const WORKER_URL = process.env.EXPO_PUBLIC_WORKER_URL;
if (!WORKER_URL) throw new Error("EXPO_PUBLIC_WORKER_URL is not set.");
