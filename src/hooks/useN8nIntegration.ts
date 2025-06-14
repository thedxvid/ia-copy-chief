
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
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('n8n-integration', {
        body: integrationData
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro na integração N8n:', err);
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
