import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface SearchResult {
  id: string;
  type: 'project' | 'document' | 'message' | 'rfi' | 'tender';
  title: string;
  description: string;
  url: string;
  project_name?: string;
  created_at: string;
  metadata?: any;
}

export const useGlobalSearch = () => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const search = async (query: string) => {
    if (!user || !query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const searchTerm = `%${query.toLowerCase()}%`;
      
      // Search across multiple tables
      const [
        { data: projects },
        { data: documents },
        { data: messages },
        { data: rfis },
        { data: tenders }
      ] = await Promise.all([
        // Projects
        supabase
          .from('projects')
          .select(`
            id, name, description, created_at,
            project_users!inner(user_id)
          `)
          .ilike('name', searchTerm)
          .eq('project_users.user_id', user.id),
        
        // Documents
        supabase
          .from('documents')
          .select(`
            id, name, created_at,
            projects!inner(name),
            project_users!inner(user_id)
          `)
          .ilike('name', searchTerm)
          .eq('project_users.user_id', user.id),
        
        // Messages
        supabase
          .from('messages')
          .select(`
            id, content, created_at,
            projects!inner(name),
            project_users!inner(user_id)
          `)
          .ilike('content', searchTerm)
          .eq('project_users.user_id', user.id),
        
        // RFIs
        supabase
          .from('rfis')
          .select(`
            id, question, created_at,
            projects!inner(name),
            project_users!inner(user_id)
          `)
          .ilike('question', searchTerm)
          .eq('project_users.user_id', user.id),
        
        // Tenders
        supabase
          .from('tenders')
          .select(`
            id, title, description, created_at,
            projects!inner(name),
            project_users!inner(user_id)
          `)
          .ilike('title', searchTerm)
          .eq('project_users.user_id', user.id)
      ]);

      const searchResults: SearchResult[] = [
        ...(projects || []).map(p => ({
          id: p.id,
          type: 'project' as const,
          title: p.name,
          description: p.description || 'No description',
          url: `/projects`,
          created_at: p.created_at,
        })),
        ...(documents || []).map(d => ({
          id: d.id,
          type: 'document' as const,
          title: d.name,
          description: 'Document',
          url: `/documents`,
          project_name: d.projects?.name,
          created_at: d.created_at,
        })),
        ...(messages || []).map(m => ({
          id: m.id,
          type: 'message' as const,
          title: m.content.substring(0, 50) + (m.content.length > 50 ? '...' : ''),
          description: 'Message',
          url: `/messages`,
          project_name: m.projects?.name,
          created_at: m.created_at,
        })),
        ...(rfis || []).map(r => ({
          id: r.id,
          type: 'rfi' as const,
          title: r.question.substring(0, 50) + (r.question.length > 50 ? '...' : ''),
          description: 'RFI',
          url: `/rfis`,
          project_name: r.projects?.name,
          created_at: r.created_at,
        })),
        ...(tenders || []).map(t => ({
          id: t.id,
          type: 'tender' as const,
          title: t.title,
          description: t.description?.substring(0, 100) + (t.description?.length > 100 ? '...' : '') || 'No description',
          url: `/tenders`,
          project_name: t.projects?.name,
          created_at: t.created_at,
        }))
      ];

      // Sort by relevance (exact matches first, then by creation date)
      searchResults.sort((a, b) => {
        const aExact = a.title.toLowerCase().includes(query.toLowerCase());
        const bExact = b.title.toLowerCase().includes(query.toLowerCase());
        
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setResults(searchResults);
    } catch (error) {
      console.error('Error searching:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return {
    results,
    loading,
    search,
    clearResults,
  };
};