
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'textarea' | 'text' | 'radio' | 'number' | 'select';
  required: boolean;
  placeholder?: string;
  options?: string[];
  min?: number;
  max?: number;
  maxLength?: number;
  helpText?: string;
}

export interface QuizTemplate {
  id: string;
  quiz_type: string;
  title: string;
  description?: string;
  questions: Json;
  is_default: boolean;
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

// Helper function to safely convert Json to QuizQuestion[]
const parseQuestions = (questions: Json): QuizQuestion[] => {
  if (Array.isArray(questions)) {
    return questions as unknown as QuizQuestion[];
  }
  return [];
};

// Helper function to safely get questions array length
export const getQuestionsLength = (questions: Json): number => {
  const parsedQuestions = parseQuestions(questions);
  return parsedQuestions.length;
};

export const useQuizTemplates = () => {
  const [templates, setTemplates] = useState<QuizTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTemplates = async () => {
    try {
      console.log('Fetching quiz templates...');
      
      const { data, error } = await supabase
        .from('quiz_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching templates:', error);
        throw error;
      }
      
      console.log('Templates fetched successfully:', data?.length || 0, 'templates');
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Erro ao carregar templates');
    } finally {
      setIsLoading(false);
    }
  };

  const createTemplate = async (templateData: {
    quiz_type: string;
    title: string;
    description?: string;
    questions: QuizQuestion[];
    is_default: boolean;
    is_active: boolean;
    version: number;
  }) => {
    try {
      console.log('Creating new template:', templateData.title);
      
      // Verificar se o usuário está autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        throw new Error('Usuário não autenticado');
      }

      console.log('User authenticated:', user.id);

      const templateToInsert = {
        quiz_type: templateData.quiz_type,
        title: templateData.title,
        description: templateData.description,
        questions: templateData.questions as unknown as Json,
        is_default: templateData.is_default,
        is_active: templateData.is_active,
        version: templateData.version,
        created_by: user.id // Garantir que created_by seja sempre definido
      };

      console.log('Inserting template data:', templateToInsert);

      const { data, error } = await supabase
        .from('quiz_templates')
        .insert([templateToInsert])
        .select()
        .single();

      if (error) {
        console.error('Database error creating template:', error);
        throw error;
      }

      console.log('Template created successfully:', data);
      setTemplates(prev => [data, ...prev]);
      toast.success('Template criado com sucesso!');
      return data;
    } catch (error: any) {
      console.error('Error creating template:', error);
      const errorMessage = error.message || 'Erro ao criar template';
      toast.error(errorMessage);
      throw error;
    }
  };

  const updateTemplate = async (id: string, templateData: {
    quiz_type?: string;
    title?: string;
    description?: string;
    questions?: QuizQuestion[];
    is_default?: boolean;
    is_active?: boolean;
    version?: number;
  }) => {
    try {
      console.log('Updating template:', id);
      
      const updateData: any = {};
      
      if (templateData.quiz_type !== undefined) updateData.quiz_type = templateData.quiz_type;
      if (templateData.title !== undefined) updateData.title = templateData.title;
      if (templateData.description !== undefined) updateData.description = templateData.description;
      if (templateData.questions !== undefined) updateData.questions = templateData.questions as unknown as Json;
      if (templateData.is_default !== undefined) updateData.is_default = templateData.is_default;
      if (templateData.is_active !== undefined) updateData.is_active = templateData.is_active;
      if (templateData.version !== undefined) updateData.version = templateData.version;

      const { data, error } = await supabase
        .from('quiz_templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Database error updating template:', error);
        throw error;
      }

      console.log('Template updated successfully:', data);
      setTemplates(prev => prev.map(t => t.id === id ? data : t));
      toast.success('Template atualizado com sucesso!');
      return data;
    } catch (error: any) {
      console.error('Error updating template:', error);
      const errorMessage = error.message || 'Erro ao atualizar template';
      toast.error(errorMessage);
      throw error;
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      console.log('Deleting template:', id);
      
      const { error } = await supabase
        .from('quiz_templates')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Database error deleting template:', error);
        throw error;
      }

      console.log('Template deleted successfully');
      setTemplates(prev => prev.filter(t => t.id !== id));
      toast.success('Template excluído com sucesso!');
    } catch (error: any) {
      console.error('Error deleting template:', error);
      const errorMessage = error.message || 'Erro ao excluir template';
      toast.error(errorMessage);
    }
  };

  const duplicateTemplate = async (id: string, newTitle: string) => {
    const template = templates.find(t => t.id === id);
    if (!template) {
      toast.error('Template não encontrado');
      return;
    }

    console.log('Duplicating template:', id, 'with new title:', newTitle);

    return await createTemplate({
      quiz_type: template.quiz_type,
      title: newTitle,
      description: template.description || undefined,
      questions: parseQuestions(template.questions),
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
    duplicateTemplate,
    parseQuestions
  };
};
