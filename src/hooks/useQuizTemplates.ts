
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

// Função helper para validar se é um QuizQuestion válido
const isValidQuizQuestion = (obj: any): obj is QuizQuestion => {
  return obj && 
    typeof obj === 'object' && 
    typeof obj.id === 'string' && 
    typeof obj.question === 'string' && 
    typeof obj.type === 'string' &&
    ['radio', 'text', 'textarea', 'number'].includes(obj.type) &&
    typeof obj.required === 'boolean' &&
    (obj.options === undefined || Array.isArray(obj.options)) &&
    (obj.placeholder === undefined || typeof obj.placeholder === 'string');
};

// Função helper para converter dados do banco para nossa interface
const convertDbTemplate = (dbTemplate: DbQuizTemplate): QuizTemplate => {
  // Validar e converter questions de Json para QuizQuestion[]
  let questions: QuizQuestion[] = [];
  
  if (Array.isArray(dbTemplate.questions)) {
    // Usar unknown como tipo intermediário para conversão segura
    const questionsArray = dbTemplate.questions as unknown as any[];
    questions = questionsArray.filter(isValidQuizQuestion);
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);
  const { user } = useAuth();

  // Verificar se usuário é admin usando a função do banco
  const checkAdminStatus = async () => {
    if (!user?.id) {
      console.log('🔑 No user ID found');
      setIsAdmin(false);
      setAdminCheckComplete(true);
      return;
    }

    try {
      console.log('🔍 Checking admin status for user:', user.email);
      
      // Primeiro, verificar se o campo is_admin existe no perfil
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('❌ Error checking profile:', profileError);
      } else if (profileData) {
        console.log('📋 Profile data:', profileData);
        setIsAdmin(profileData.is_admin || false);
        setAdminCheckComplete(true);
        return;
      }

      // Fallback: usar a função RPC se o perfil não funcionar
      console.log('🔄 Trying RPC function as fallback...');
      const { data: rpcData, error: rpcError } = await supabase.rpc('is_user_admin', {
        user_id: user.id
      });

      if (rpcError) {
        console.error('❌ Error with RPC function:', rpcError);
        setIsAdmin(false);
      } else {
        console.log('✅ RPC result:', rpcData);
        setIsAdmin(rpcData || false);
      }
    } catch (err) {
      console.error('❌ Unexpected error in admin check:', err);
      setIsAdmin(false);
    } finally {
      setAdminCheckComplete(true);
    }
  };

  const fetchTemplates = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Fetching quiz templates...');
      console.log('🔑 Current user:', user?.email);
      console.log('🔐 Is admin:', isAdmin);
      
      const { data, error } = await supabase
        .from('quiz_templates')
        .select('*')
        .eq('is_active', true)
        .order('quiz_type', { ascending: true });

      if (error) {
        console.error('❌ Error fetching quiz templates:', error);
        throw error;
      }
      
      console.log(`✅ Found ${data?.length || 0} templates in database`);
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
      console.log(`🔍 Fetching template for type: ${quizType}`);
      
      const { data, error } = await supabase
        .from('quiz_templates')
        .select('*')
        .eq('quiz_type', quizType)
        .eq('is_active', true)
        .eq('is_default', true)
        .maybeSingle();

      if (error) {
        console.error('❌ Error fetching template by type:', error);
        throw error;
      }
      
      return data ? convertDbTemplate(data) : null;
    } catch (err) {
      console.error('Error fetching template by type:', err);
      return null;
    }
  };

  const createTemplate = async (template: Omit<QuizTemplate, 'id' | 'created_at' | 'updated_at'>) => {
    if (!adminCheckComplete) {
      throw new Error('Verificação de administrador ainda em andamento');
    }

    if (!isAdmin) {
      throw new Error('Apenas administradores podem criar templates');
    }

    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    setIsLoading(true);
    try {
      console.log('📝 Creating new template:', template.title);
      console.log('🔑 User ID:', user.id);
      console.log('🔐 Admin status verified:', isAdmin);
      console.log('📋 Template data:', {
        quiz_type: template.quiz_type,
        title: template.title,
        questions_count: template.questions.length
      });
      
      const templateData = {
        quiz_type: template.quiz_type,
        title: template.title,
        description: template.description || null,
        questions: template.questions as unknown as Database['public']['Tables']['quiz_templates']['Insert']['questions'],
        is_default: template.is_default,
        is_active: template.is_active,
        version: template.version,
        created_by: user.id
      };

      console.log('💾 Inserting template data...');
      const { data, error } = await supabase
        .from('quiz_templates')
        .insert([templateData])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating template:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      console.log('✅ Template created successfully:', data.id);
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
      console.log('📝 Updating template:', id);
      
      // Converter updates para formato do banco
      const updateData: any = {};
      
      if (updates.quiz_type) updateData.quiz_type = updates.quiz_type;
      if (updates.title) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.questions) {
        updateData.questions = updates.questions as unknown as Database['public']['Tables']['quiz_templates']['Update']['questions'];
      }
      if (updates.is_default !== undefined) updateData.is_default = updates.is_default;
      if (updates.is_active !== undefined) updateData.is_active = updates.is_active;
      if (updates.version) updateData.version = updates.version;

      const { data, error } = await supabase
        .from('quiz_templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating template:', error);
        throw error;
      }

      console.log('✅ Template updated successfully:', data.id);
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
      console.log('🗑️ Deleting template:', id);
      
      const { error } = await supabase
        .from('quiz_templates')
        .update({ is_active: false })
        .eq('id', id);

      if (error) {
        console.error('❌ Error deleting template:', error);
        throw error;
      }

      console.log('✅ Template deleted successfully');
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
    if (user) {
      checkAdminStatus();
    } else {
      setAdminCheckComplete(true);
    }
  }, [user]);

  useEffect(() => {
    if (adminCheckComplete) {
      fetchTemplates();
    }
  }, [adminCheckComplete]);

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
