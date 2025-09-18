import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface AutoSaveOptions {
  key: string;
  interval?: number; // milliseconds
  enabled?: boolean;
  onSave?: (data: any) => Promise<void> | void;
  onRestore?: (data: any) => void;
  onError?: (error: Error) => void;
  storage?: 'localStorage' | 'sessionStorage';
  compress?: boolean;
}

interface AutoSaveState {
  lastSaved: Date | null;
  isSaving: boolean;
  hasChanges: boolean;
  error: string | null;
}

export const useAutoSave = <T extends Record<string, any>>(
  data: T,
  options: AutoSaveOptions
) => {
  const {
    key,
    interval = 30000, // 30 seconds
    enabled = true,
    onSave,
    onRestore,
    onError,
    storage = 'localStorage',
    compress = false
  } = options;

  const { toast } = useToast();
  const [state, setState] = useState<AutoSaveState>({
    lastSaved: null,
    isSaving: false,
    hasChanges: false,
    error: null
  });

  const intervalRef = useRef<NodeJS.Timeout>();
  const lastDataRef = useRef<string>('');
  const storageApi = storage === 'localStorage' ? localStorage : sessionStorage;

  // Serialize data for comparison and storage
  const serializeData = useCallback((data: T) => {
    try {
      const serialized = JSON.stringify(data);
      return compress ? btoa(serialized) : serialized;
    } catch (error) {
      console.error('Failed to serialize data:', error);
      return '';
    }
  }, [compress]);

  // Deserialize data from storage
  const deserializeData = useCallback((serialized: string): T | null => {
    try {
      const decoded = compress ? atob(serialized) : serialized;
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Failed to deserialize data:', error);
      return null;
    }
  }, [compress]);

  // Save data to storage
  const saveToStorage = useCallback(async () => {
    if (!enabled || state.isSaving) return;

    setState(prev => ({ ...prev, isSaving: true, error: null }));

    try {
      const serialized = serializeData(data);
      
      // Save to storage
      const storageData = {
        data: serialized,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };
      
      storageApi.setItem(key, JSON.stringify(storageData));

      // Call custom save function if provided
      if (onSave) {
        await onSave(data);
      }

      setState(prev => ({
        ...prev,
        lastSaved: new Date(),
        isSaving: false,
        hasChanges: false
      }));

      toast({
        title: "Auto-saved",
        description: "Your changes have been saved automatically",
        duration: 2000,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({
        ...prev,
        isSaving: false,
        error: errorMessage
      }));

      if (onError) {
        onError(error instanceof Error ? error : new Error(errorMessage));
      }

      toast({
        title: "Auto-save failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    }
  }, [enabled, state.isSaving, data, serializeData, key, storageApi, onSave, onError, toast]);

  // Load data from storage
  const loadFromStorage = useCallback(() => {
    try {
      const stored = storageApi.getItem(key);
      if (!stored) return null;

      const storageData = JSON.parse(stored);
      const restoredData = deserializeData(storageData.data);
      
      if (restoredData && onRestore) {
        onRestore(restoredData);
        setState(prev => ({
          ...prev,
          lastSaved: new Date(storageData.timestamp)
        }));
      }

      return restoredData;
    } catch (error) {
      console.error('Failed to load from storage:', error);
      return null;
    }
  }, [key, storageApi, deserializeData, onRestore]);

  // Clear saved data
  const clearStorage = useCallback(() => {
    try {
      storageApi.removeItem(key);
      setState(prev => ({
        ...prev,
        lastSaved: null,
        hasChanges: false
      }));
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }, [key, storageApi]);

  // Manual save trigger
  const saveNow = useCallback(async () => {
    await saveToStorage();
  }, [saveToStorage]);

  // Check for changes and update state
  useEffect(() => {
    const currentSerialized = serializeData(data);
    const hasChanges = currentSerialized !== lastDataRef.current && lastDataRef.current !== '';
    
    setState(prev => ({ ...prev, hasChanges }));
    lastDataRef.current = currentSerialized;
  }, [data, serializeData]);

  // Set up auto-save interval
  useEffect(() => {
    if (!enabled || !state.hasChanges) return;

    intervalRef.current = setTimeout(() => {
      saveToStorage();
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [enabled, state.hasChanges, interval, saveToStorage]);

  // Check for existing data on mount
  useEffect(() => {
    const existingData = loadFromStorage();
    if (existingData) {
      // You might want to show a confirmation dialog here
      console.log('Found existing auto-saved data');
    }
  }, [loadFromStorage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, []);

  return {
    ...state,
    saveNow,
    loadFromStorage,
    clearStorage,
    isEnabled: enabled,
    hasStoredData: () => {
      try {
        return !!storageApi.getItem(key);
      } catch {
        return false;
      }
    }
  };
};