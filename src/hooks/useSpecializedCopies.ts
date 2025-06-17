
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type CopyType = 'ads' | 'sales-videos' | 'pages' | 'content';
export type CopyStatus = 'draft' | 'published' | 'archived';

export interface SpecializedCopy {
  id: string;
  user_id: string;
  copy_type: CopyType;
  title: string;
  copy_data: any;
  status: CopyStatus;
  platform?: string | null;
  performance_metrics?: any;
  tags?: string[] | null;
  version: number;
  parent_copy_id?: string | null;
  created_at: string;
  updated_at: string;
}

export const useSpecializedCopies = (copyType?: CopyType) => {
  const [copies, setCopies] = useState<SpecializedCopy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchCopies = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('specialized_copies')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (copyType) {
        query = query.eq('copy_type', copyType);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      const typedData = (data || []).map(item => ({
        ...item,
        copy_type: item.copy_type as CopyType,
        status: item.status as CopyStatus,
        platform: item.platform || undefined,
        tags: item.tags || undefined,
        parent_copy_id: item.parent_copy_id || undefined
      }));

      setCopies(typedData);
    } catch (err) {
      console.error('Erro ao buscar copies especializadas:', err);
      setError('Erro ao carregar copies');
    } finally {
      setLoading(false);
    }
  }, [user, copyType]);

  const createCopy = async (copyData: Partial<SpecializedCopy>) => {
    if (!user?.id) {
      toast.error('Você precisa estar logado');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('specialized_copies')
        .insert({
          user_id: user.id,
          copy_type: copyData.copy_type!,
          title: copyData.title!,
          copy_data: copyData.copy_data || {},
          status: copyData.status || 'draft',
          platform: copyData.platform,
          tags: copyData.tags || []
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Properly type the returned data to match our SpecializedCopy interface
      const typedData: SpecializedCopy = {
        ...data,
        copy_type: data.copy_type as CopyType,
        status: data.status as CopyStatus,
        platform: data.platform || undefined,
        tags: data.tags || undefined,
        parent_copy_id: data.parent_copy_id || undefined
      };

      toast.success('Copy criada com sucesso!');
      setCopies(prev => [typedData, ...prev]);
      return typedData;
    } catch (err) {
      console.error('Erro ao criar copy:', err);
      toast.error('Erro ao criar copy');
      return null;
    }
  };

  const updateCopy = async (id: string, updates: Partial<SpecializedCopy>) => {
    try {
      const { error } = await supabase
        .from('specialized_copies')
        .update(updates)
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast.success('Copy atualizada com sucesso!');
      setCopies(prev => prev.map(copy => 
        copy.id === id ? { ...copy, ...updates } : copy
      ));
    } catch (err) {
      console.error('Erro ao atualizar copy:', err);
      toast.error('Erro ao atualizar copy');
    }
  };

  const deleteCopy = async (id: string) => {
    try {
      const { error } = await supabase
        .from('specialized_copies')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast.success('Copy deletada com sucesso!');
      setCopies(prev => prev.filter(copy => copy.id !== id));
    } catch (err) {
      console.error('Erro ao deletar copy:', err);
      toast.error('Erro ao deletar copy');
    }
  };

  const duplicateCopy = async (copy: SpecializedCopy) => {
    const duplicatedCopy = {
      ...copy,
      title: `${copy.title} (Cópia)`,
      status: 'draft' as CopyStatus,
      parent_copy_id: copy.id,
      version: 1
    };

    delete (duplicatedCopy as any).id;
    delete (duplicatedCopy as any).created_at;
    delete (duplicatedCopy as any).updated_at;

    return createCopy(duplicatedCopy);
  };

  useEffect(() => {
    if (user) {
      fetchCopies();
    }
  }, [fetchCopies]);

  return {
    copies,
    loading,
    error,
    createCopy,
    updateCopy,
    deleteCopy,
    duplicateCopy,
    refetch: fetchCopies
  };
};
