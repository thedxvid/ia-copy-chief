
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface N8nIntegrationData {
  type: 'copy_generation' | 'performance_analysis' | 'user_action' | 'chat_response';
  user_id: string;
  data: any;
  workflow_id?: string;
  session_id?: string;
}

export const useN8nIntegration = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const triggerN8nWorkflow = async (integrationData: N8nIntegrationData) => {
    console.log('triggerN8nWorkflow called with:', integrationData);
    
    setIsLoading(true);
    setError(null);

    try {
      // Validação dos dados antes de enviar
      if (!integrationData.user_id) {
        throw new Error('User ID é obrigatório');
      }

      if (!integrationData.type) {
        throw new Error('Tipo de integração é obrigatório');
      }

      console.log('Calling supabase.functions.invoke with:', {
        functionName: 'n8n-integration',
        body: integrationData
      });

      const { data, error: functionError } = await supabase.functions.invoke('n8n-integration', {
        body: integrationData
      });

      console.log('Supabase function response:', { data, error: functionError });

      if (functionError) {
        console.error('Function error:', functionError);
        throw new Error(functionError.message || 'Erro na função Supabase');
      }

      if (!data) {
        throw new Error('Nenhum dado retornado da função');
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('Erro na integração N8n:', err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const generateCopyWithN8n = async (
    userId: string, 
    quizAnswers: Record<string, any>, 
    copyType: 'vsl' | 'landing_page' | 'ads' | 'email',
    targetAudience: string,
    productInfo: string
  ) => {
    console.log('generateCopyWithN8n called with:', {
      userId, 
      copyType, 
      targetAudience, 
      productInfo,
      quizAnswers
    });

    return triggerN8nWorkflow({
      type: 'copy_generation',
      user_id: userId,
      data: {
        quiz_answers: quizAnswers,
        copy_type: copyType,
        target_audience: targetAudience,
        product_info: productInfo
      },
      workflow_id: 'copy-generation',
      session_id: `copy_${Date.now()}`
    });
  };

  const analyzePerformance = async (
    userId: string,
    performanceData: any
  ) => {
    return triggerN8nWorkflow({
      type: 'performance_analysis',
      user_id: userId,
      data: performanceData,
      workflow_id: 'performance-analysis',
      session_id: `analysis_${Date.now()}`
    });
  };

  const logUserAction = async (
    userId: string,
    actionData: any
  ) => {
    return triggerN8nWorkflow({
      type: 'user_action',
      user_id: userId,
      data: actionData,
      workflow_id: 'user-tracking',
      session_id: `action_${Date.now()}`
    });
  };

  return {
    triggerN8nWorkflow,
    generateCopyWithN8n,
    analyzePerformance,
    logUserAction,
    isLoading,
    error
  };
};
