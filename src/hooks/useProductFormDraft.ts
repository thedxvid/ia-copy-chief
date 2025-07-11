import { useState, useEffect, useCallback, useRef } from 'react';

export interface ProductFormData {
  // Dados básicos
  name: string;
  niche: string;
  subNiche: string;
  status: 'draft' | 'active' | 'paused' | 'archived';
  
  // Estratégia
  targetAudience: string;
  marketPositioning: string;
  valueProposition: string;
  
  // Copy
  headline: string;
  subtitle: string;
  benefits: string;
  socialProof: string;
  vslScript: string;
  
  // Oferta
  mainOfferPromise: string;
  mainOfferDescription: string;
  mainOfferPrice: string;
}

const STORAGE_KEY = 'product_form_draft';
const DEBOUNCE_MS = 500;

export function useProductFormDraft(isEditMode: boolean = false) {
  const [formData, setFormDataState] = useState<ProductFormData>({
    name: '',
    niche: '',
    subNiche: '',
    status: 'draft',
    targetAudience: '',
    marketPositioning: '',
    valueProposition: '',
    headline: '',
    subtitle: '',
    benefits: '',
    socialProof: '',
    vslScript: '',
    mainOfferPromise: '',
    mainOfferDescription: '',
    mainOfferPrice: '',
  });

  const [hasRestoredData, setHasRestoredData] = useState(false);
  const [autoSaveActive, setAutoSaveActive] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const isInitializedRef = useRef(false);

  // Função para salvar no localStorage com debounce
  const saveToLocalStorage = useCallback((data: ProductFormData) => {
    if (!isEditMode) {
      console.log('💾 Salvamento automático acionado:', data);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
      setAutoSaveActive(true);
      
      // Remove o indicador visual após 2 segundos
      setTimeout(() => setAutoSaveActive(false), 2000);
    }
  }, [isEditMode]);

  // Função para restaurar dados do localStorage
  const restoreFromLocalStorage = useCallback(() => {
    if (!isEditMode) {
      console.log('🔍 Verificando dados salvos no localStorage...');
      const saved = localStorage.getItem(STORAGE_KEY);
      
      if (saved) {
        try {
          const { data, timestamp } = JSON.parse(saved);
          
          // Verifica se os dados não expiraram (7 dias)
          const isExpired = Date.now() - timestamp > 7 * 24 * 60 * 60 * 1000;
          
          if (!isExpired) {
            console.log('✅ Dados restaurados do localStorage:', data);
            setFormDataState(data);
            setHasRestoredData(true);
            return;
          } else {
            console.log('⏰ Dados expirados, removendo do localStorage');
            localStorage.removeItem(STORAGE_KEY);
          }
        } catch (error) {
          console.error('❌ Erro ao restaurar dados:', error);
          localStorage.removeItem(STORAGE_KEY);
        }
      }
      
      console.log('📝 Nenhum dado salvo encontrado');
    }
  }, [isEditMode]);

  // Função para limpar rascunho
  const clearDraft = useCallback(() => {
    console.log('🗑️ Limpando rascunho do localStorage');
    localStorage.removeItem(STORAGE_KEY);
    setHasRestoredData(false);
    setAutoSaveActive(false);
  }, []);

  // Função para atualizar dados do formulário
  const setFormData = useCallback((updater: Partial<ProductFormData> | ((prev: ProductFormData) => ProductFormData)) => {
    setFormDataState(prev => {
      const newData = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      
      // Só salva se não for modo de edição e se o componente foi inicializado
      if (!isEditMode && isInitializedRef.current) {
        // Cancela timeout anterior
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
        
        // Programa novo salvamento com debounce
        debounceTimeoutRef.current = setTimeout(() => {
          saveToLocalStorage(newData);
        }, DEBOUNCE_MS);
      }
      
      return newData;
    });
  }, [isEditMode, saveToLocalStorage]);

  // Função para resetar formulário
  const resetForm = useCallback(() => {
    const emptyData: ProductFormData = {
      name: '',
      niche: '',
      subNiche: '',
      status: 'draft',
      targetAudience: '',
      marketPositioning: '',
      valueProposition: '',
      headline: '',
      subtitle: '',
      benefits: '',
      socialProof: '',
      vslScript: '',
      mainOfferPromise: '',
      mainOfferDescription: '',
      mainOfferPrice: '',
    };
    
    setFormDataState(emptyData);
    setHasRestoredData(false);
  }, []);

  // Helpers para atualizar campos individuais
  const updateField = useCallback((field: keyof ProductFormData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, [setFormData]);

  // Restaura dados na inicialização
  useEffect(() => {
    if (!isInitializedRef.current) {
      restoreFromLocalStorage();
      isInitializedRef.current = true;
    }
  }, [restoreFromLocalStorage]);

  // Cleanup do timeout
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    formData,
    setFormData,
    resetForm,
    clearDraft,
    hasRestoredData,
    autoSaveActive,
    updateField,
    
    // Helpers para facilitar o uso
    fields: {
      name: {
        value: formData.name,
        onChange: updateField('name'),
      },
      niche: {
        value: formData.niche,
        onChange: updateField('niche'),
      },
      subNiche: {
        value: formData.subNiche,
        onChange: updateField('subNiche'),
      },
      status: {
        value: formData.status,
        onChange: updateField('status') as (value: 'draft' | 'active' | 'paused' | 'archived') => void,
      },
      targetAudience: {
        value: formData.targetAudience,
        onChange: updateField('targetAudience'),
      },
      marketPositioning: {
        value: formData.marketPositioning,
        onChange: updateField('marketPositioning'),
      },
      valueProposition: {
        value: formData.valueProposition,
        onChange: updateField('valueProposition'),
      },
      headline: {
        value: formData.headline,
        onChange: updateField('headline'),
      },
      subtitle: {
        value: formData.subtitle,
        onChange: updateField('subtitle'),
      },
      benefits: {
        value: formData.benefits,
        onChange: updateField('benefits'),
      },
      socialProof: {
        value: formData.socialProof,
        onChange: updateField('socialProof'),
      },
      vslScript: {
        value: formData.vslScript,
        onChange: updateField('vslScript'),
      },
      mainOfferPromise: {
        value: formData.mainOfferPromise,
        onChange: updateField('mainOfferPromise'),
      },
      mainOfferDescription: {
        value: formData.mainOfferDescription,
        onChange: updateField('mainOfferDescription'),
      },
      mainOfferPrice: {
        value: formData.mainOfferPrice,
        onChange: updateField('mainOfferPrice'),
      },
    }
  };
}