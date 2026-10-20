'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';
import { MotionConfig } from 'framer-motion';

export interface AuthContextValue {
  session:        Session | null;
  user:           User    | null;
  profile:        Profile | null;
  loading:        boolean;
  signOut:        () => Promise<void>;
  /** Re-fetch the signed-in user's profile (e.g. after editing name/avatar). */
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session:        null,
  user:           null,
  profile:        null,
  loading:        true,
  signOut:        async () => {},
  refreshProfile: async () => {},
});

const PROFILE_FIELDS = 'id, username, display_name, avatar_url, role, created_at';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [supabase] = useState(() => createClient());
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  // User id whose profile is loaded / in flight — dedupes INITIAL_SESSION,
  // SIGNED_IN and TOKEN_REFRESHED events that all carry the same user.
  const profileUserIdRef = useRef<string | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select(PROFILE_FIELDS)
      .eq('id', userId)
      .single();
    // Ignore a stale response if the user changed meanwhile.
    if (profileUserIdRef.current !== userId) return;
    setProfile((data as Profile | null) ?? null);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // onAuthStateChange emits INITIAL_SESSION immediately, so no separate getSession() call.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      const userId = nextSession?.user?.id ?? null;

      if (!userId) {
        profileUserIdRef.current = null;
        setProfile(null);
        setLoading(false);
        return;
      }

      if (userId !== profileUserIdRef.current || event === 'USER_UPDATED') {
        profileUserIdRef.current = userId;
        // Deferred: supabase-js holds its auth lock while this callback runs.
        setTimeout(() => { void fetchProfile(userId); }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile]);

  const refreshProfile = useCallback(async () => {
    const userId = profileUserIdRef.current;
    if (userId) await fetchProfile(userId);
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    profileUserIdRef.current = null;
    setProfile(null);
  }, [supabase]);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user: session?.user ?? null,
    profile,
    loading,
    signOut,
    refreshProfile,
  }), [session, profile, loading, signOut, refreshProfile]);

  return (
    <AuthContext.Provider value={value}>
      <MotionConfig reducedMotion="user">
        {children}
      </MotionConfig>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
