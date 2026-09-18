import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase = url && anonKey ? createClient(url, anonKey) : null;

function requireSupabase() {
  if (!supabase) throw new Error("Supabase Auth is not configured");
  return supabase;
}

export const startLogin = async () => {
  const client = requireSupabase();
  const { error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/` },
  });
  if (error) throw error;
};

export const signInWithPassword = async (email: string, password: string) => {
  const { error } = await requireSupabase().auth.signInWithPassword({ email, password });
  if (error) throw error;
};

export const signUpWithPassword = async (email: string, password: string) => {
  const { data, error } = await requireSupabase().auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${window.location.origin}/` },
  });
  if (error) throw error;
  return data;
};
