import { useState, useEffect, useCallback, useRef } from 'react';

interface UseFormPersistenceOptions {
  key: string;
  initialValue: string;
  debounceMs?: number;
}

interface SavedData {
  value: string;
  timestamp: number;
}

export function useFormPersistence({ 
  key, 
  initialValue, 
  debounceMs = 300 
}: UseFormPersistenceOptions) {
  const [value, setValue] = useState(initialValue);
  const [isRestored, setIsRestored] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Restore data from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsedData: SavedData = JSON.parse(stored);
        const isExpired = Date.now() - parsedData.timestamp > 7 * 24 * 60 * 60 * 1000; // 7 days
        
        if (!isExpired && parsedData.value && parsedData.value !== initialValue) {
          setValue(parsedData.value);
          setIsRestored(true);
        } else if (isExpired) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.warn('Erro ao recuperar dados salvos:', error);
      localStorage.removeItem(key);
    }
  }, [key, initialValue]);

  // Debounced save to localStorage
  const debouncedSave = useCallback((newValue: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      try {
        if (newValue.trim()) {
          const dataToStore: SavedData = {
            value: newValue,
            timestamp: Date.now()
          };
          localStorage.setItem(key, JSON.stringify(dataToStore));
        } else {
          localStorage.removeItem(key);
        }
      } catch (error) {
        console.warn('Erro ao salvar no localStorage:', error);
      }
    }, debounceMs);
  }, [key, debounceMs]);

  // Update value and save to localStorage
  const updateValue = useCallback((newValue: string) => {
    setValue(newValue);
    setHasChanges(true);
    setIsRestored(false);
    debouncedSave(newValue);
  }, [debouncedSave]);

  // Clear saved data
  const clearSaved = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setIsRestored(false);
      setHasChanges(false);
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
  // Create stable key prefix without sessionId to persist across sessions
  const keyPrefix = `product-form-${productId || 'new'}`;
  
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