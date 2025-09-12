import { useState, useCallback } from 'react';

export type ViewEditMode = 'view' | 'edit';

interface UseViewEditModeOptions {
  initialMode?: ViewEditMode;
  onModeChange?: (mode: ViewEditMode) => void;
  canEdit?: boolean;
}

export const useViewEditMode = (options: UseViewEditModeOptions = {}) => {
  const {
    initialMode = 'view',
    onModeChange,
    canEdit = true
  } = options;

  const [mode, setMode] = useState<ViewEditMode>(initialMode);

  const switchToView = useCallback(() => {
    setMode('view');
    onModeChange?.('view');
  }, [onModeChange]);

  const switchToEdit = useCallback(() => {
    if (canEdit) {
      setMode('edit');
      onModeChange?.('edit');
    }
  }, [canEdit, onModeChange]);

  const toggleMode = useCallback(() => {
    if (mode === 'view') {
      switchToEdit();
    } else {
      switchToView();
    }
  }, [mode, switchToEdit, switchToView]);

  return {
    mode,
    isViewing: mode === 'view',
    isEditing: mode === 'edit',
    switchToView,
    switchToEdit,
    toggleMode,
    canEdit
  };
};