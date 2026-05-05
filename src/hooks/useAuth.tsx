import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  profile: { full_name: string; school_id: string | null; avatar_url: string | null } | null;
  roles: string[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthContextType["profile"]>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    try {
      const [profileRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("full_name, school_id, avatar_url").eq("user_id", userId).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
      ]);
      setProfile(profileRes.data ?? null);
      setRoles(rolesRes.data ? rolesRes.data.map((r) => r.role) : []);
    } catch (e) {
      console.warn("fetchUserData failed", e);
      setProfile(null);
      setRoles([]);
    }
  };

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === 'TOKEN_REFRESHED' && !session) {
        setUser(null);
        setProfile(null);
        setRoles([]);
        setLoading(false);
        return;
      }
      if (session?.user) {
        setUser(session.user);
        // Wait for profile + roles BEFORE flipping loading to false,
        // so guards (e.g. BendaharaLayout) don't see empty roles and redirect.
        await fetchUserData(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setRoles([]);
      }
      if (mounted) setLoading(false);
    });

    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (!mounted) return;
      if (error || !session?.user) {
        if (error) {
          console.warn("Session restore failed, clearing state:", error.message);
          supabase.auth.signOut().catch(() => {});
        }
        setUser(null);
        setProfile(null);
        setRoles([]);
      } else {
        setUser(session.user);
        await fetchUserData(session.user.id);
      }
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    // Retry with exponential backoff for transient network errors (Failed to fetch / 5xx / 522).
    const maxAttempts = 3;
    let lastError: string | null = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error) return { error: null };
        const msg = error.message || "";
        const lower = msg.toLowerCase();
        const isNetwork =
          lower.includes("failed to fetch") ||
          lower.includes("network") ||
          lower.includes("timeout") ||
          lower.includes("522") ||
          lower.includes("524") ||
          lower.includes("503") ||
          lower.includes("load failed");
        if (!isNetwork || attempt === maxAttempts) return { error: msg };
        lastError = msg;
      } catch (e: any) {
        lastError = e?.message || "Network error";
        if (attempt === maxAttempts) return { error: lastError };
      }
      // backoff: 600ms, 1500ms
      await new Promise((r) => setTimeout(r, attempt === 1 ? 600 : 1500));
    }
    return { error: lastError };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, roles, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
