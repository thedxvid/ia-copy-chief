
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CustomAgent {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  prompt: string;
  icon_name: string | null;
  status: string | null;
  knowledge_base: any;
  created_at: string;
  updated_at: string;
}

export interface AgentFile {
  id: string;
  agent_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number | null;
  processed_content: string | null;
  created_at: string;
}

export const useCustomAgents = () => {
  const [agents, setAgents] = useState<CustomAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchAgents = async () => {
    if (!user) {
      setAgents([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('custom_agents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error('Erro ao buscar agentes:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAgent = async (agentData: {
    name: string;
    description: string;
    prompt: string;
    icon_name: string;
  }) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('custom_agents')
      .insert({
        user_id: user.id,
        name: agentData.name,
        description: agentData.description,
        prompt: agentData.prompt,
        icon_name: agentData.icon_name,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;
    
    // Adicionar o novo agente imediatamente à lista local
    setAgents(prev => [data, ...prev]);
    
    return data;
  };

  const updateAgent = async (agentId: string, updates: Partial<CustomAgent>) => {
    const { error } = await supabase
      .from('custom_agents')
      .update(updates)
      .eq('id', agentId);

    if (error) throw error;
    
    // Atualizar o agente na lista local
    setAgents(prev => 
      prev.map(agent => 
        agent.id === agentId ? { ...agent, ...updates } : agent
      )
    );
  };

  const deleteAgent = async (agentId: string) => {
    const { error } = await supabase
      .from('custom_agents')
      .delete()
      .eq('id', agentId);

    if (error) throw error;
    
    // Remover o agente da lista local
    setAgents(prev => prev.filter(agent => agent.id !== agentId));
  };

  const uploadFile = async (agentId: string, file: File) => {
    if (!user) throw new Error('Usuário não autenticado');

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${user.id}/${agentId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('agent-files')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { error: dbError } = await supabase
      .from('agent_files')
      .insert({
        agent_id: agentId,
        file_name: file.name,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size
      });

    if (dbError) throw dbError;
  };

  const getAgentFiles = async (agentId: string): Promise<AgentFile[]> => {
    const { data, error } = await supabase
      .from('agent_files')
      .select('*')
      .eq('agent_id', agentId);

    if (error) throw error;
    return data || [];
  };

  useEffect(() => {
    fetchAgents();
  }, [user]);

  return {
    agents,
    loading,
    createAgent,
    updateAgent,
    deleteAgent,
    uploadFile,
    getAgentFiles,
    refreshAgents: fetchAgents
  };
};
