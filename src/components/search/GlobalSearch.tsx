import React, { useState } from 'react';
import { Search, X, FileText, MessageSquare, HelpCircle, Briefcase, FolderOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGlobalSearch, SearchResult } from '@/hooks/useGlobalSearch';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const typeIcons = {
  project: FolderOpen,
  document: FileText,
  message: MessageSquare,
  rfi: HelpCircle,
  tender: Briefcase,
};

const typeColors = {
  project: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  document: 'bg-green-500/10 text-green-700 border-green-500/20',
  message: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
  rfi: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
  tender: 'bg-red-500/10 text-red-700 border-red-500/20',
};

export const GlobalSearch = ({ open, onOpenChange }: GlobalSearchProps) => {
  const [query, setQuery] = useState('');
  const { results, loading, search, clearResults } = useGlobalSearch();
  const navigate = useNavigate();

  const handleSearch = (value: string) => {
    setQuery(value);
    if (value.trim()) {
      search(value);
    } else {
      clearResults();
    }
  };

  const handleResultClick = (result: SearchResult) => {
    navigate(result.url);
    onOpenChange(false);
    setQuery('');
    clearResults();
  };

  const handleClear = () => {
    setQuery('');
    clearResults();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20">
      <div className="w-full max-w-2xl mx-4">
        <Card className="animate-scale-in">
          <CardContent className="p-0">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search projects, documents, messages, RFIs, and tenders..."
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-12 pr-12 h-14 text-lg border-0 border-b rounded-none focus-visible:ring-0"
                autoFocus
              />
              <div className="absolute right-2 top-2 flex items-center gap-2">
                {query && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    className="h-10 w-10 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="h-10 w-10 p-0"
                >
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    ESC
                  </kbd>
                </Button>
              </div>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
              {loading && (
                <div className="p-6 text-center text-muted-foreground">
                  Searching...
                </div>
              )}

              {!loading && query && results.length === 0 && (
                <div className="p-6 text-center text-muted-foreground">
                  No results found for "{query}"
                </div>
              )}

              {!loading && results.length > 0 && (
                <div className="p-2">
                  <div className="text-xs text-muted-foreground px-3 py-2">
                    {results.length} result{results.length !== 1 ? 's' : ''} found
                  </div>
                  
                  {results.map((result) => {
                    const Icon = typeIcons[result.type];
                    return (
                      <button
                        key={`${result.type}-${result.id}`}
                        onClick={() => handleResultClick(result)}
                        className="w-full p-3 text-left hover:bg-muted/50 rounded-lg transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <Icon className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium truncate">{result.title}</h4>
                              <Badge className={typeColors[result.type]} variant="outline">
                                {result.type}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-muted-foreground truncate">
                              {result.description}
                            </p>
                            
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              {result.project_name && (
                                <>
                                  <span>{result.project_name}</span>
                                  <span>•</span>
                                </>
                              )}
                              <span>
                                {formatDistanceToNow(new Date(result.created_at), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {!loading && !query && (
                <div className="p-6 text-center text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Start typing to search across all your projects</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs">
                    <Badge variant="outline">Projects</Badge>
                    <Badge variant="outline">Documents</Badge>
                    <Badge variant="outline">Messages</Badge>
                    <Badge variant="outline">RFIs</Badge>
                    <Badge variant="outline">Tenders</Badge>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Keyboard shortcuts hint */}
        <div className="mt-2 text-center text-xs text-muted-foreground">
          <kbd className="px-2 py-1 bg-muted rounded text-[10px]">⌘K</kbd> to search,{' '}
          <kbd className="px-2 py-1 bg-muted rounded text-[10px]">ESC</kbd> to close
        </div>
      </div>
    </div>
  );
};