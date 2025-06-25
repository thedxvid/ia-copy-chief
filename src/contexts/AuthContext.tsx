
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isFirstLogin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName?: string, checkoutUrl?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  checkFirstLogin: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  const checkFirstLogin = async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('first_login')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error checking first login:', error);
        return false;
      }

      const isFirst = profile?.first_login === true;
      setIsFirstLogin(isFirst);
      return isFirst;
    } catch (error) {
      console.error('Error in checkFirstLogin:', error);
      return false;
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state change:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check first login status when user logs in
        if (session?.user && event === 'SIGNED_IN') {
          setTimeout(async () => {
            await checkFirstLogin();
          }, 100);
        } else if (!session?.user) {
          setIsFirstLogin(false);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('🔐 Initial session check:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await checkFirstLogin();
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('🔐 Attempting sign in for:', email);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('❌ Sign in error:', error);
    } else {
      console.log('✅ Sign in successful');
    }
    
    return { error };
  };

  // Mantém função signUp apenas para uso interno (webhook)
  const signUp = async (email: string, password: string, fullName?: string, checkoutUrl?: string) => {
    console.log('📝 Internal sign up for:', email);
    
    const redirectUrl = `${window.location.origin}/email-confirmed`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    
    if (error) {
      console.error('❌ Sign up error:', error);
    } else {
      console.log('✅ Sign up successful, confirmation email sent');
    }
    
    return { error };
  };

  const signOut = async () => {
    try {
      console.log('🚪 Starting logout process...');
      
      // Clear local state first
      setUser(null);
      setSession(null);
      setIsFirstLogin(false);
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Logout error:', error);
      }
      
      // Clear any remaining local storage
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.clear();
      
      console.log('✅ Logout completed, redirecting...');
      
      // Force redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('❌ Error during logout:', error);
      // Even if there's an error, redirect to home
      window.location.href = '/';
    }
  };

  const resetPassword = async (email: string) => {
    console.log('🔑 Initiating password reset for:', email);
    
    const redirectUrl = `${window.location.origin}/auth/reset-password`;
    
    console.log('🔗 Reset password redirect URL:', redirectUrl);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      console.error('❌ Reset password error:', error);
    } else {
      console.log('✅ Password reset email sent successfully');
    }
    
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    isFirstLogin,
    signIn,
    signUp,
    signOut,
    resetPassword,
    checkFirstLogin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
