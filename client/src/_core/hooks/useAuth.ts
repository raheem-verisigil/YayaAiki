import { trpc } from "@/lib/trpc";
import { supabase, startLogin } from "@/lib/supabase";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo, useState } from "react";

type UseAuthOptions = { redirectOnUnauthenticated?: boolean; redirectPath?: string };

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath } = options ?? {};
  const utils = trpc.useUtils();
  const [sessionReady, setSessionReady] = useState(false);
  const meQuery = trpc.auth.me.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const logoutMutation = trpc.auth.logout.useMutation();

  useEffect(() => {
    if (!supabase) { setSessionReady(true); return; }
    supabase.auth.getSession().finally(() => setSessionReady(true));
    const { data } = supabase.auth.onAuthStateChange(() => {
      void utils.auth.me.invalidate();
    });
    return () => data.subscription.unsubscribe();
  }, [utils]);

  const logout = useCallback(async () => {
    try { await supabase?.auth.signOut(); } finally {
      try { await logoutMutation.mutateAsync(); } catch (error: unknown) {
        if (!(error instanceof TRPCClientError) || error.data?.code !== "UNAUTHORIZED") throw error;
      }
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => ({
    user: meQuery.data ?? null,
    loading: !sessionReady || meQuery.isLoading || logoutMutation.isPending,
    error: meQuery.error ?? logoutMutation.error ?? null,
    isAuthenticated: Boolean(meQuery.data),
  }), [meQuery.data, meQuery.error, meQuery.isLoading, logoutMutation.error, logoutMutation.isPending, sessionReady]);

  useEffect(() => {
    if (!redirectOnUnauthenticated || state.loading || state.user || typeof window === "undefined") return;
    if (redirectPath && window.location.pathname === redirectPath) return;
    if (redirectPath) { window.location.href = redirectPath; return; }
    void startLogin();
  }, [redirectOnUnauthenticated, redirectPath, state.loading, state.user]);

  return { ...state, refresh: () => meQuery.refetch(), logout };
}
