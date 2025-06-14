
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SaveQuizCopyParams {
  quizType: string;
  quizAnswers: Record<string, string>;
  generatedCopy: { title: string; content: string };
}

export const useQuizCopySave = () => {
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();

  const saveQuizCopy = async ({ quizType, quizAnswers, generatedCopy }: SaveQuizCopyParams) => {
    if (!user?.id) {
      toast.error('Você precisa estar logado para salvar');
      return null;
    }

    setIsSaving(true);
    
    try {
      const { data, error } = await supabase
        .from('quiz_copies')
        .insert({
          user_id: user.id,
          quiz_type: quizType,
          quiz_answers: quizAnswers,
          generated_copy: generatedCopy,
          title: generatedCopy.title
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar copy do quiz:', error);
        toast.error('Erro ao salvar copy no histórico');
        return null;
      }

      toast.success('Copy salva no histórico com sucesso!');
      return data;
    } catch (error) {
      console.error('Erro inesperado ao salvar copy:', error);
      toast.error('Erro inesperado ao salvar copy');
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    saveQuizCopy,
    isSaving
  };
};
