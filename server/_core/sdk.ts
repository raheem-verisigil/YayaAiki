import { createClient, type User as SupabaseUser } from "@supabase/supabase-js";
import type { Request } from "express";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";

export type AuthenticatedUser = User;

const getSupabase = () => {
  if (!ENV.supabaseUrl || !ENV.supabaseAnonKey) {
    throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY are required");
  }
  return createClient(ENV.supabaseUrl, ENV.supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};

function loginMethod(user: SupabaseUser): string | null {
  const provider = user.app_metadata?.provider;
  return typeof provider === "string" ? provider : "email";
}

function displayName(user: SupabaseUser): string {
  const metadata = user.user_metadata ?? {};
  return String(metadata.full_name ?? metadata.name ?? metadata.user_name ?? user.email ?? "YayaAiki user");
}

export async function authenticateRequest(req: Request): Promise<AuthenticatedUser> {
  const authHeader = req.headers.authorization;
  if (typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
    throw new Error("Missing Supabase bearer token");
  }

  const token = authHeader.slice(7);
  const { data, error } = await getSupabase().auth.getUser(token);
  if (error || !data.user) throw new Error("Invalid Supabase session");

  const authUser = data.user;
  const openId = authUser.id;
  const signedInAt = new Date();
  const existing = await db.getUserByOpenId(openId);

  await db.upsertUser({
    openId,
    name: displayName(authUser),
    email: authUser.email ?? null,
    loginMethod: loginMethod(authUser),
    role: existing?.role ?? (ENV.ownerOpenId === openId ? "admin" : "user"),
    lastSignedIn: signedInAt,
  });

  const user = await db.getUserByOpenId(openId);
  if (!user) throw new Error("Authenticated user could not be synchronized");
  return user;
}

export const sdk = { authenticateRequest };
