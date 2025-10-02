import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DocumentCategory {
  id: string;
  project_id: string;
  name: string;
  created_by: string;
  created_at: string;
}

const DEFAULT_CATEGORIES = ['Architectural', 'Structural', 'Other'];

export const useDocumentCategories = (projectId: string | null) => {
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [customCategories, setCustomCategories] = useState<DocumentCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!projectId) return;
    fetchCustomCategories();
  }, [projectId]);

  const fetchCustomCategories = async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('document_categories')
        .select('*')
        .eq('project_id', projectId)
        .order('name');

      if (error) throw error;

      setCustomCategories(data || []);
      
      // Combine default and custom categories
      const allCategories = [
        ...DEFAULT_CATEGORIES,
        ...(data?.map(c => c.name) || [])
      ];
      setCategories(allCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch categories',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async (name: string) => {
    if (!projectId) {
      toast({
        title: 'Error',
        description: 'No project selected',
        variant: 'destructive'
      });
      return false;
    }

    if (categories.includes(name)) {
      toast({
        title: 'Error',
        description: 'Category already exists',
        variant: 'destructive'
      });
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('document_categories')
        .insert({
          project_id: projectId,
          name: name.trim()
        })
        .select()
        .single();

      if (error) throw error;

      setCustomCategories(prev => [...prev, data]);
      setCategories(prev => [...prev, data.name]);
      
      toast({
        title: 'Success',
        description: 'Category added successfully'
      });
      
      return true;
    } catch (error: any) {
      console.error('Error adding category:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add category',
        variant: 'destructive'
      });
      return false;
    }
  };

  const deleteCategory = async (categoryId: string) => {
    try {
      const { error } = await supabase
        .from('document_categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      await fetchCustomCategories();
      
      toast({
        title: 'Success',
        description: 'Category deleted successfully'
      });
      
      return true;
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete category',
        variant: 'destructive'
      });
      return false;
    }
  };

  return {
    categories,
    customCategories,
    loading,
    addCategory,
    deleteCategory,
    refreshCategories: fetchCustomCategories
  };
};
