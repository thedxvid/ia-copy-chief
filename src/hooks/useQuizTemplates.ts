
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'textarea' | 'text' | 'radio' | 'number';
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export interface QuizTemplate {
  id: string;
  quiz_type: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
  is_default: boolean;
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export const useQuizTemplates = () => {
  const [templates, setTemplates] = useState<QuizTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('quiz_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Erro ao carregar templates');
    } finally {
      setIsLoading(false);
    }
  };

  const createTemplate = async (templateData: Omit<QuizTemplate, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('quiz_templates')
        .insert([{
          ...templateData,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      setTemplates(prev => [data, ...prev]);
      toast.success('Template criado!');
      return data;
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar template');
      throw error;
    }
  };

  const updateTemplate = async (id: string, templateData: Partial<QuizTemplate>) => {
    try {
      const { data, error } = await supabase
        .from('quiz_templates')
        .update(templateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setTemplates(prev => prev.map(t => t.id === id ? data : t));
      toast.success('Template atualizado!');
      return data;
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar');
      throw error;
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('quiz_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTemplates(prev => prev.filter(t => t.id !== id));
      toast.success('Template excluído!');
    } catch (error: any) {
      toast.error('Erro ao excluir');
    }
  };

  const duplicateTemplate = async (id: string, newTitle: string) => {
    const template = templates.find(t => t.id === id);
    if (!template) return;

    return await createTemplate({
      quiz_type: template.quiz_type,
      title: newTitle,
      description: template.description,
      questions: template.questions,
      is_default: false,
      is_active: template.is_active,
      version: 1
    });
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return {
    templates,
    isLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate
  };
};
