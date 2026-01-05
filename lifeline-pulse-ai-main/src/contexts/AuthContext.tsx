import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole =
  | 'patient'
  | 'donor'
  | 'hospital_staff'
  | 'blood_bank'
  | 'volunteer'
  | 'admin';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    metadata: {
      full_name: string;
      phone?: string;
      blood_group?: string | null;
      selected_role: AppRole;
      address?: string;
    }
  ) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

const signUp = async (
  email: string,
  password: string,
  metadata?: {
    full_name?: string;
    phone?: string;
    blood_group?: string | null;
    address?: string;
    selected_role?: string;
  }
) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error || !data.user) {
    return { error };
  }

  // 🔥 THIS IS THE IMPORTANT PART
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: data.user.id,
      full_name: metadata?.full_name,
      email,
      phone: metadata?.phone,
      blood_group: metadata?.blood_group ?? null,
      address: metadata?.address ?? null,
      primary_role: metadata?.selected_role, 
      role: metadata?.selected_role,
      is_verified: metadata?.selected_role === 'patient', // auto-verify patient
    });

  if (profileError) {
    console.error('Profile insert error:', profileError);
    return { error: profileError };
  }

  return { error: null };
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
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
