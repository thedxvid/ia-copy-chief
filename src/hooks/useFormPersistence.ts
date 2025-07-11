import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseFormPersistenceOptions {
  key: string;
  initialValue: string;
  debounceMs?: number;
}

export function useFormPersistence({ 
  key, 
  initialValue, 
  debounceMs = 500 
}: UseFormPersistenceOptions) {
  const [value, setValue] = useState(initialValue);
  const [isRestored, setIsRestored] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  // Restore data from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsedData = JSON.parse(stored);
        setValue(parsedData.value || initialValue);
        setIsRestored(true);
        
        toast({
          title: "Rascunho recuperado",
          description: "Dados do formulário foram restaurados automaticamente.",
        });
      }
    } catch (error) {
      console.warn('Erro ao recuperar dados salvos:', error);
    }
  }, [key, initialValue, toast]);

  // Debounced save to localStorage
  const debouncedSave = useCallback((newValue: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      try {
        const dataToStore = {
          value: newValue,
          timestamp: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(dataToStore));
      } catch (error) {
        console.warn('Erro ao salvar no localStorage:', error);
      }
    }, debounceMs);
  }, [key, debounceMs]);

  // Update value and save to localStorage
  const updateValue = useCallback((newValue: string) => {
    setValue(newValue);
    debouncedSave(newValue);
  }, [debouncedSave]);

  // Clear saved data
  const clearSaved = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setIsRestored(false);
    } catch (error) {
      console.warn('Erro ao limpar dados salvos:', error);
    }
  }, [key]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    value,
    setValue: updateValue,
    isRestored,
    clearSaved
  };
}

// Hook for managing multiple form fields at once
export function useFormStatePersistence(productId: string | null = null) {
  const sessionId = useRef(Date.now().toString()).current;
  const keyPrefix = `product-form-${productId || 'new'}-${sessionId}`;
  
  // Basic Info
  const name = useFormPersistence({ key: `${keyPrefix}-name`, initialValue: '' });
  const niche = useFormPersistence({ key: `${keyPrefix}-niche`, initialValue: '' });
  const subNiche = useFormPersistence({ key: `${keyPrefix}-subNiche`, initialValue: '' });
  const status = useFormPersistence({ key: `${keyPrefix}-status`, initialValue: 'draft' });
  
  // Strategy
  const targetAudience = useFormPersistence({ key: `${keyPrefix}-targetAudience`, initialValue: '' });
  const marketPositioning = useFormPersistence({ key: `${keyPrefix}-marketPositioning`, initialValue: '' });
  const valueProposition = useFormPersistence({ key: `${keyPrefix}-valueProposition`, initialValue: '' });
  
  // Copy
  const vslScript = useFormPersistence({ key: `${keyPrefix}-vslScript`, initialValue: '' });
  const headline = useFormPersistence({ key: `${keyPrefix}-headline`, initialValue: '' });
  const subtitle = useFormPersistence({ key: `${keyPrefix}-subtitle`, initialValue: '' });
  const benefits = useFormPersistence({ key: `${keyPrefix}-benefits`, initialValue: '' });
  const socialProof = useFormPersistence({ key: `${keyPrefix}-socialProof`, initialValue: '' });
  
  // Offer
  const mainOfferPromise = useFormPersistence({ key: `${keyPrefix}-mainOfferPromise`, initialValue: '' });
  const mainOfferDescription = useFormPersistence({ key: `${keyPrefix}-mainOfferDescription`, initialValue: '' });
  const mainOfferPrice = useFormPersistence({ key: `${keyPrefix}-mainOfferPrice`, initialValue: '' });

  // Clear all saved data for this form
  const clearAllSaved = useCallback(() => {
    name.clearSaved();
    niche.clearSaved();
    subNiche.clearSaved();
    status.clearSaved();
    targetAudience.clearSaved();
    marketPositioning.clearSaved();
    valueProposition.clearSaved();
    vslScript.clearSaved();
    headline.clearSaved();
    subtitle.clearSaved();
    benefits.clearSaved();
    socialProof.clearSaved();
    mainOfferPromise.clearSaved();
    mainOfferDescription.clearSaved();
    mainOfferPrice.clearSaved();
  }, [
    name, niche, subNiche, status, targetAudience, marketPositioning, 
    valueProposition, vslScript, headline, subtitle, benefits, socialProof,
    mainOfferPromise, mainOfferDescription, mainOfferPrice
  ]);

  // Check if any data was restored
  const hasRestoredData = [
    name, niche, subNiche, status, targetAudience, marketPositioning,
    valueProposition, vslScript, headline, subtitle, benefits, socialProof,
    mainOfferPromise, mainOfferDescription, mainOfferPrice
  ].some(field => field.isRestored);

  return {
    fields: {
      name,
      niche,
      subNiche,
      status,
      targetAudience,
      marketPositioning,
      valueProposition,
      vslScript,
      headline,
      subtitle,
      benefits,
      socialProof,
      mainOfferPromise,
      mainOfferDescription,
      mainOfferPrice
    },
    clearAllSaved,
    hasRestoredData
  };
}