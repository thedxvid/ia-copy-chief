
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Agent } from '@/types/chat';
import { toast } from 'sonner';

interface CustomAgent {
  id: string;
  name: string;
  description: string | null;
  prompt: string;
  icon_name: string;
  status: 'active' | 'inactive';
  knowledge_base: Record<string, any>;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export const useCustomAgents = () => {
  const [customAgents, setCustomAgents] = useState<CustomAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchCustomAgents();
    }
  }, [user]);

  const fetchCustomAgents = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('custom_agents')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setCustomAgents(data || []);
    } catch (err) {
      console.error('Erro ao buscar agentes customizados:', err);
      setError('Erro ao carregar agentes personalizados');
      toast.error('Erro ao carregar agentes personalizados');
    } finally {
      setLoading(false);
    }
  };

  const createAgent = async (agentData: {
    name: string;
    description?: string;
    prompt: string;
    icon_name?: string;
  }) => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('custom_agents')
        .insert({
          user_id: user.id,
          name: agentData.name,
          description: agentData.description || null,
          prompt: agentData.prompt,
          icon_name: agentData.icon_name || '🤖',
          status: 'active',
          knowledge_base: {}
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      setCustomAgents(prev => [data, ...prev]);
      toast.success('Agente criado com sucesso!');
      return data;
    } catch (err) {
      console.error('Erro ao criar agente:', err);
      toast.error('Erro ao criar agente');
      return null;
    }
  };

  const updateAgent = async (id: string, updates: Partial<CustomAgent>) => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('custom_agents')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setCustomAgents(prev => 
        prev.map(agent => agent.id === id ? data : agent)
      );
      toast.success('Agente atualizado com sucesso!');
      return data;
    } catch (err) {
      console.error('Erro ao atualizar agente:', err);
      toast.error('Erro ao atualizar agente');
      return null;
    }
  };

  const deleteAgent = async (id: string) => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return false;
    }

    try {
      const { error } = await supabase
        .from('custom_agents')
        .update({ status: 'inactive' })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      setCustomAgents(prev => prev.filter(agent => agent.id !== id));
      toast.success('Agente excluído com sucesso!');
      return true;
    } catch (err) {
      console.error('Erro ao excluir agente:', err);
      toast.error('Erro ao excluir agente');
      return false;
    }
  };

  const duplicateAgent = async (sourceAgent: CustomAgent, newName: string) => {
    return createAgent({
      name: newName,
      description: sourceAgent.description || undefined,
      prompt: sourceAgent.prompt,
      icon_name: sourceAgent.icon_name
    });
  };

  // Converter agente customizado para formato Agent
  const convertToAgent = (customAgent: CustomAgent): Agent => ({
    id: `custom-${customAgent.id}`,
    name: customAgent.name,
    description: customAgent.description || '',
    prompt: customAgent.prompt,
    icon: customAgent.icon_name
  });

  return {
    customAgents,
    loading,
    error,
    fetchCustomAgents,
    createAgent,
    updateAgent,
    deleteAgent,
    duplicateAgent,
    convertToAgent
  };
};
