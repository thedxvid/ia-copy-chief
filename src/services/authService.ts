
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

export interface AuthResponse {
  user?: User | null;
  session?: Session | null;
  error?: any;
}

class AuthService {
  async getCurrentUser(): Promise<User | null> {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('❌ AuthService: Erro ao obter usuário atual:', error);
      return null;
    }
    
    return user;
  }

  async getCurrentSession(): Promise<Session | null> {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ AuthService: Erro ao obter sessão atual:', error);
      return null;
    }
    
    return session;
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    console.log('🔐 AuthService: Iniciando login para:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ AuthService: Erro no login:', error);
      return { error };
    }

    console.log('✅ AuthService: Login realizado com sucesso');
    return { user: data.user, session: data.session };
  }

  async signUp(email: string, password: string, fullName?: string): Promise<AuthResponse> {
    console.log('📝 AuthService: Criando conta para:', email);
    
    const redirectUrl = `${window.location.origin}/email-confirmed`;
    
    const { data, error } = await supabase.auth.signUp({
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
      console.error('❌ AuthService: Erro no registro:', error);
      return { error };
    }

    console.log('✅ AuthService: Conta criada com sucesso');
    return { user: data.user, session: data.session };
  }

  async signOut(): Promise<void> {
    console.log('🚪 AuthService: Fazendo logout...');
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('❌ AuthService: Erro no logout:', error);
      throw error;
    }
    
    console.log('✅ AuthService: Logout realizado com sucesso');
  }

  async resetPassword(email: string): Promise<{ error?: any }> {
    console.log('🔑 AuthService: Enviando reset de senha para:', email);
    
    const redirectUrl = `${window.location.origin}/auth/reset-password`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      console.error('❌ AuthService: Erro no reset de senha:', error);
      return { error };
    }

    console.log('✅ AuthService: Email de reset enviado');
    return {};
  }

  async isUserAdmin(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return false;

      const { data, error } = await supabase
        .rpc('is_user_admin', { user_id: user.id });

      if (error) {
        console.error('❌ AuthService: Erro ao verificar admin:', error);
        return false;
      }

      return data || false;
    } catch (error) {
      console.error('❌ AuthService: Erro na verificação de admin:', error);
      return false;
    }
  }

  async validateUserAccess(resourceUserId: string): Promise<boolean> {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) return false;

      // Usuário pode acessar seus próprios recursos
      if (currentUser.id === resourceUserId) return true;

      // Admins podem acessar qualquer recurso
      const isAdmin = await this.isUserAdmin();
      return isAdmin;
    } catch (error) {
      console.error('❌ AuthService: Erro na validação de acesso:', error);
      return false;
    }
  }

  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}

export const authService = new AuthService();
