import type { Express } from "express";

/** Supabase Auth owns sign-in callbacks on the client; no server OAuth callback is required. */
export function registerOAuthRoutes(_app: Express) {
  // Intentionally empty. Kept as a compatibility export for older integrations.
}
