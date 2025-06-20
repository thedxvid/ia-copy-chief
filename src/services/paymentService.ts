
import { supabase } from '@/integrations/supabase/client';

export interface PaymentConfig {
  platform: 'digital-guru' | 'kiwify';
  checkoutUrl: string;
  webhookUrl: string;
}

export interface SubscriptionInfo {
  platform: string;
  subscriptionId?: string;
  status: 'active' | 'pending' | 'canceled' | 'expired';
  expiresAt?: string;
  activatedAt?: string;
}

class PaymentService {
  private config: PaymentConfig = {
    platform: 'digital-guru',
    checkoutUrl: 'https://clkdmg.site/subscribe/iacopychief-assinatura-mensal',
    webhookUrl: `${import.meta.env.VITE_SUPABASE_URL || 'https://dcnjjhavlvotzpwburvw.supabase.co'}/functions/v1/digital-guru-webhook`
  };

  getCheckoutUrl(): string {
    return this.config.checkoutUrl;
  }

  getWebhookUrl(): string {
    return this.config.webhookUrl;
  }

  getCurrentPlatform(): string {
    return this.config.platform;
  }

  async getSubscriptionInfo(userId: string): Promise<SubscriptionInfo | null> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('subscription_status, subscription_expires_at, payment_approved_at')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        console.error('❌ PaymentService: Erro ao buscar informações de assinatura:', error);
        return null;
      }

      return {
        platform: this.config.platform,
        status: profile.subscription_status || 'pending',
        expiresAt: profile.subscription_expires_at || undefined,
        activatedAt: profile.payment_approved_at || undefined
      };
    } catch (error) {
      console.error('❌ PaymentService: Erro ao obter informações de assinatura:', error);
      return null;
    }
  }

  async logPaymentAction(action: string, details?: any): Promise<void> {
    try {
      console.log('💳 PaymentService: Ação registrada:', {
        platform: this.config.platform,
        action,
        details,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ PaymentService: Erro ao registrar ação:', error);
    }
  }

  // Método para migrar de uma plataforma para outra (futuro uso)
  async migratePlatform(newPlatform: 'digital-guru' | 'kiwify', newCheckoutUrl: string): Promise<void> {
    const oldPlatform = this.config.platform;
    
    this.config.platform = newPlatform;
    this.config.checkoutUrl = newCheckoutUrl;
    this.config.webhookUrl = `${import.meta.env.VITE_SUPABASE_URL || 'https://dcnjjhavlvotzpwburvw.supabase.co'}/functions/v1/${newPlatform}-webhook`;

    await this.logPaymentAction('PLATFORM_MIGRATION', {
      from: oldPlatform,
      to: newPlatform,
      newCheckoutUrl
    });

    console.log(`✅ PaymentService: Migração completa de ${oldPlatform} para ${newPlatform}`);
  }
}

export const paymentService = new PaymentService();
