// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'patient' | 'attender' | 'donor' | 'hospital_staff' | 'blood_bank' | 'volunteer' | 'transport' | 'admin';

interface UserRole {
  role: AppRole;
}

interface AuthContextType {
  user: (User & { role?: AppRole }) | null; // convenience: user.role may be present
  session: Session | null;
  roles: UserRole[];
  loading: boolean;
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  primaryRole: AppRole | null;
  getDashboardPath: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Role -> dashboard map
const roleDashboardMap: Record<AppRole, string> = {
  patient: '/dashboard/patient',
  attender: '/dashboard/patient',
  donor: '/dashboard/donor',
  hospital_staff: '/hospital',
  blood_bank: '/dashboard/blood-bank',
  volunteer: '/dashboard/volunteer',
  transport: '/dashboard/volunteer',
  admin: '/dashboard/admin'
};

// Role priority (higher index = higher priority)
const ROLE_PRIORITY: AppRole[] = [
  'patient',
  'attender',
  'volunteer',
  'donor',
  'transport',
  'blood_bank',
  'hospital_staff',
  'admin'
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<(User & { role?: AppRole }) | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [primaryRole, setPrimaryRole] = useState<AppRole | null>(null);

  // Helper: normalize role string
  const normalize = (r: any) => (typeof r === 'string' ? r.trim().toLowerCase() : r);

  // Determine a deterministic primary role from roles[] using ROLE_PRIORITY
  const determinePrimaryRole = (roleRows: UserRole[] | null): AppRole | null => {
    if (!roleRows || roleRows.length === 0) return null;
    const found = roleRows
      .map(r => normalize(r.role) as AppRole)
      .filter(Boolean) as AppRole[];
    for (let i = ROLE_PRIORITY.length - 1; i >= 0; i--) {
      const candidate = ROLE_PRIORITY[i];
      if (found.includes(candidate)) return candidate;
    }
    // fallback to first
    return found[0] ?? null;
  };

  // Fetch roles for a userId and update state; returns the roles
  const fetchUserRoles = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role, created_at') // created_at helps ordering if present
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching roles:', error);
        setRoles([]);
        setPrimaryRole(null);
        // don't throw — caller will handle
        return [];
      }

      // normalize and set
      const normalized = (data || []).map((d: any) => ({ role: normalize(d.role) })) as UserRole[];
      setRoles(normalized);

      const pr = determinePrimaryRole(normalized);
      setPrimaryRole(pr);

      // Attach role onto current user object for convenience (non-destructive)
      setUser(prev => {
        if (!prev) return prev;
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        return ({ ...(prev as any), role: pr } as any);
      });

      return normalized;
    } catch (e) {
      console.error('Error fetching roles:', e);
      setRoles([]);
      setPrimaryRole(null);
      return [];
    }
  };

  useEffect(() => {
    setLoading(true);

    // Auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session ?? null);
      setUser(session?.user ? ({ ...(session.user as any) } as any) : null);

      if (session?.user) {
        // fetch roles and only when done update loading
        fetchUserRoles(session.user.id).then(() => {
          setLoading(false);
        }).catch(() => setLoading(false));
      } else {
        setRoles([]);
        setPrimaryRole(null);
        setLoading(false);
      }
    });

    // Initial session check (await role fetch before clearing loading)
    (async () => {
      try {
        const { data: sessData } = await supabase.auth.getSession();
        const s = sessData.session ?? null;
        setSession(s);
        setUser(s?.user ? ({ ...(s.user as any) } as any) : null);
        if (s?.user) {
          await fetchUserRoles(s.user.id);
        } else {
          setRoles([]);
          setPrimaryRole(null);
        }
      } catch (e) {
        console.error('Error initializing auth:', e);
      } finally {
        setLoading(false);
      }
    })();

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signUp = async (email: string, password: string, metadata?: Record<string, any>) => {
    const redirectUrl = `${window.location.origin}/`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: metadata
      }
    });

    // After signup, assign the role if provided (and then re-fetch roles)
    if (!error && data.user && metadata?.selected_role) {
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: data.user.id,
          role: metadata.selected_role
        });

      if (roleError) {
        console.error('Error assigning role:', roleError);
      } else {
        // re-fetch roles so frontend immediately sees the assigned role
        await fetchUserRoles(data.user.id);
      }

      // Create donor entry if needed
      if (metadata.selected_role === 'donor' && metadata.blood_group) {
        const { error: donorError } = await supabase
          .from('donors')
          .insert({
            user_id: data.user.id,
            blood_group: metadata.blood_group,
            last_donation_date: metadata.last_donation_date || null,
            is_eligible: true,
            is_verified: false,
            is_active: true,
            credibility_score: 100,
            total_donations: 0
          });

        if (donorError) {
          console.error('Error creating donor profile:', donorError);
        }
      }
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRoles([]);
    setPrimaryRole(null);
  };

  const hasRole = (role: AppRole) => {
    const r = normalize(role);
    return roles.some(rr => normalize(rr.role) === r);
  };

const getDashboardPath = (): string => {
  console.log("🔍 getDashboardPath called", {
    primaryRole,
    roles,
    user: user?.email,
  });

  if (!primaryRole) {
    console.warn("⚠️ primaryRole is NULL → returning /");
    return '/';
  }

  const path = roleDashboardMap[primaryRole] || '/';
  console.log("✅ dashboard path:", path);
  return path;
};


  return (
    <AuthContext.Provider value={{
      user,
      session,
      roles,
      loading,
      signUp,
      signIn,
      signOut,
      hasRole,
      primaryRole,
      getDashboardPath
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
