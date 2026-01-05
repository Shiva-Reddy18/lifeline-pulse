import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'patient' | 'attender' | 'donor' | 'hospital_staff' | 'blood_bank' | 'volunteer' | 'transport' | 'admin';

interface UserRole {
  role: AppRole;
}

interface AuthContextType {
  user: User | null;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer role fetching with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserRoles(session.user.id);
          }, 0);
        } else {
          setRoles([]);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRoles(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRoles = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching roles:', error);
        return;
      }

      setRoles(data as UserRole[]);
    } catch (e) {
      console.error('Error fetching roles:', e);
    }
  };

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

    // After signup, assign the role if provided
    if (!error && data.user && metadata?.selected_role) {
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: data.user.id,
          role: metadata.selected_role
        });

      if (roleError) {
        console.error('Error assigning role:', roleError);
      }

      // Create additional records based on role
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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRoles([]);
  };

  const hasRole = (role: AppRole) => {
    return roles.some(r => r.role === role);
  };

  // Get primary role (first role in hierarchy)
  const primaryRole: AppRole | null = roles.length > 0 
    ? roles[0].role 
    : null;

  // Get dashboard path based on user's primary role
  const getDashboardPath = (): string => {
    if (!primaryRole) return '/';
    return roleDashboardMap[primaryRole] || '/';
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
