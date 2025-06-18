
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'radio' | 'text' | 'textarea' | 'number';
  options?: string[];
  required: boolean;
  placeholder?: string;
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
  created_by?: string;
  created_at: string;
  updated_at: string;
}

type DbQuizTemplate = Database['public']['Tables']['quiz_templates']['Row'];

// Função helper para converter dados do banco para nossa interface
const convertDbTemplate = (dbTemplate: DbQuizTemplate): QuizTemplate => {
  // Validar e converter questions de Json para QuizQuestion[]
  let questions: QuizQuestion[] = [];
  
  if (Array.isArray(dbTemplate.questions)) {
    questions = dbTemplate.questions.filter((q: any) => 
      q && typeof q === 'object' && 
      typeof q.id === 'string' && 
      typeof q.question === 'string' && 
      typeof q.type === 'string' &&
      typeof q.required === 'boolean'
    ) as QuizQuestion[];
  }

  return {
    id: dbTemplate.id,
    quiz_type: dbTemplate.quiz_type,
    title: dbTemplate.title,
    description: dbTemplate.description || undefined,
    questions,
    is_default: dbTemplate.is_default,
    is_active: dbTemplate.is_active,
    version: dbTemplate.version,
    created_by: dbTemplate.created_by || undefined,
    created_at: dbTemplate.created_at,
    updated_at: dbTemplate.updated_at
  };
};

export const useQuizTemplates = () => {
  const [templates, setTemplates] = useState<QuizTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Verificar se usuário é admin
  const isAdmin = user?.email && ['davicastrowp@gmail.com', 'admin@iacopychief.com'].includes(user.email);

  const fetchTemplates = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('quiz_templates')
        .select('*')
        .eq('is_active', true)
        .order('quiz_type', { ascending: true });

      if (error) throw error;
      
      const convertedTemplates = (data || []).map(convertDbTemplate);
      setTemplates(convertedTemplates);
    } catch (err) {
      console.error('Error fetching quiz templates:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar templates');
    } finally {
      setIsLoading(false);
    }
  };

  const getTemplateByType = async (quizType: string): Promise<QuizTemplate | null> => {
    try {
      const { data, error } = await supabase
        .from('quiz_templates')
        .select('*')
        .eq('quiz_type', quizType)
        .eq('is_active', true)
        .eq('is_default', true)
        .maybeSingle();

      if (error) throw error;
      return data ? convertDbTemplate(data) : null;
    } catch (err) {
      console.error('Error fetching template by type:', err);
      return null;
    }
  };

  const createTemplate = async (template: Omit<QuizTemplate, 'id' | 'created_at' | 'updated_at'>) => {
    if (!isAdmin) {
      throw new Error('Apenas administradores podem criar templates');
    }

    setIsLoading(true);
    try {
      // Converter QuizQuestion[] para Json compatível
      const templateData = {
        quiz_type: template.quiz_type,
        title: template.title,
        description: template.description,
        questions: template.questions as any, // Cast para Json
        is_default: template.is_default,
        is_active: template.is_active,
        version: template.version,
        created_by: user?.id
      };

      const { data, error } = await supabase
        .from('quiz_templates')
        .insert([templateData])
        .select()
        .single();

      if (error) throw error;

      await fetchTemplates();
      toast.success('Template criado com sucesso!');
      return convertDbTemplate(data);
    } catch (err) {
      console.error('Error creating template:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar template';
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateTemplate = async (id: string, updates: Partial<QuizTemplate>) => {
    if (!isAdmin) {
      throw new Error('Apenas administradores podem editar templates');
    }

    setIsLoading(true);
    try {
      // Converter updates para formato do banco
      const updateData: any = {};
      
      if (updates.quiz_type) updateData.quiz_type = updates.quiz_type;
      if (updates.title) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.questions) updateData.questions = updates.questions as any; // Cast para Json
      if (updates.is_default !== undefined) updateData.is_default = updates.is_default;
      if (updates.is_active !== undefined) updateData.is_active = updates.is_active;
      if (updates.version) updateData.version = updates.version;

      const { data, error } = await supabase
        .from('quiz_templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await fetchTemplates();
      toast.success('Template atualizado com sucesso!');
      return convertDbTemplate(data);
    } catch (err) {
      console.error('Error updating template:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar template';
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const duplicateTemplate = async (templateId: string, newTitle: string) => {
    if (!isAdmin) {
      throw new Error('Apenas administradores podem duplicar templates');
    }

    const template = templates.find(t => t.id === templateId);
    if (!template) {
      throw new Error('Template não encontrado');
    }

    return await createTemplate({
      quiz_type: template.quiz_type,
      title: newTitle,
      description: template.description,
      questions: template.questions,
      is_default: false,
      is_active: true,
      version: 1
    });
  };

  const deleteTemplate = async (id: string) => {
    if (!isAdmin) {
      throw new Error('Apenas administradores podem excluir templates');
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('quiz_templates')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      await fetchTemplates();
      toast.success('Template excluído com sucesso!');
    } catch (err) {
      console.error('Error deleting template:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir template';
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return {
    templates,
    isLoading,
    error,
    isAdmin,
    fetchTemplates,
    getTemplateByType,
    createTemplate,
    updateTemplate,
    duplicateTemplate,
    deleteTemplate
  };
};
