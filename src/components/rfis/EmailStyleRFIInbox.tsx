import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Plus, 
  Reply,
  Mail,
  MailOpen,
  Filter,
  X,
  Clock,
  User,
  MessageSquare,
  Paperclip
} from 'lucide-react';
import { format } from 'date-fns';
import { RFI } from '@/hooks/useRFIs';

interface EmailStyleRFIInboxProps {
  rfis: RFI[];
  onView: (rfi: RFI) => void;
  onCreateNew: () => void;
  onReply: (rfi: RFI) => void;
  projectUsers: any[];
  currentProject: any;
  onDoubleClick?: (rfi: RFI) => void;
  selectedRFI?: RFI | null;
}

type RFIType = 'general_correspondence' | 'request_for_information' | 'general_advice';

const rfiTypeConfig = {
  'General': { icon: MessageSquare, color: 'text-blue-600' },
  'Request for Information': { icon: Mail, color: 'text-orange-600' },
  'Advice': { icon: User, color: 'text-green-600' }
};

const statusConfig = {
  outstanding: { label: 'Open', variant: 'default' as const, color: 'text-blue-600' },
  overdue: { label: 'Overdue', variant: 'destructive' as const, color: 'text-red-600' },
  responded: { label: 'Responded', variant: 'secondary' as const, color: 'text-green-600' },
  closed: { label: 'Closed', variant: 'outline' as const, color: 'text-gray-600' },
};

export const EmailStyleRFIInbox: React.FC<EmailStyleRFIInboxProps> = ({
  rfis,
  onView,
  onCreateNew,
  onReply,
  projectUsers,
  currentProject,
  onDoubleClick,
  selectedRFI
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Memoized filter function for better performance with real-time updates
  const filteredRFIs = useMemo(() => {
    return rfis.filter(rfi => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!rfi.subject?.toLowerCase().includes(query) &&
            !rfi.question.toLowerCase().includes(query) &&
            !rfi.raised_by_profile?.name?.toLowerCase().includes(query) &&
            !rfi.recipient_name?.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Type filter (map category to new types)
      if (typeFilter !== 'all') {
        const rfiType = mapCategoryToType(rfi.category);
        if (rfiType !== typeFilter) return false;
      }
      
      // Status filter
      if (statusFilter !== 'all' && rfi.status !== statusFilter) return false;

      return true;
    });
  }, [rfis, searchQuery, typeFilter, statusFilter]);

  // Memoized callbacks to prevent unnecessary re-renders
  const handleRFIClick = useCallback((rfi: RFI) => {
    onView(rfi);
  }, [onView]);

  const handleRFIDoubleClick = useCallback((rfi: RFI) => {
    if (onDoubleClick) {
      onDoubleClick(rfi);
    }
  }, [onDoubleClick]);

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setTypeFilter('all');
    setStatusFilter('all');
  }, []);

  // Map existing categories to new RFI types
  const mapCategoryToType = (category?: string): RFIType => {
    if (!category) return 'general_correspondence';
    if (category.toLowerCase().includes('information') || category.toLowerCase().includes('request')) {
      return 'request_for_information';
    }
    if (category.toLowerCase().includes('advice')) {
      return 'general_advice';
    }
    return 'general_correspondence';
  };

  const getResponseRequired = (rfi: RFI): boolean => {
    // Use rfi_type if available, otherwise fall back to category mapping
    const rfiType = rfi.rfi_type || mapCategoryToType(rfi.category);
    return rfiType === 'request_for_information';
  };

  const getRFITypeDisplay = (rfi: RFI): string => {
    const rfiType = rfi.rfi_type || mapCategoryToType(rfi.category);
    switch (rfiType) {
      case 'general_correspondence':
        return 'General Correspondence';
      case 'request_for_information':
        return 'Request for Information';
      case 'general_advice':
        return 'General Advice';
      default:
        return 'General Correspondence';
    }
  };

  const clearFilters = handleClearFilters;

  const hasActiveFilters = typeFilter !== 'all' || statusFilter !== 'all' || searchQuery;

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - Inbox List */}
      <div className="w-1/2 border-r flex flex-col">
        {/* Header */}
        <div className="border-b bg-card p-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-foreground">RFI Inbox</h1>
            <Button 
              onClick={onCreateNew}
              className="bg-slate-900 hover:bg-slate-800 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New RFI
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search RFIs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="General Correspondence">General Correspondence</SelectItem>
                  <SelectItem value="Request for Information">Request for Information</SelectItem>
                  <SelectItem value="General Advice">General Advice</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="outstanding">Open</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="responded">Responded</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* RFI List */}
        <div className="flex-1 overflow-auto">
          {filteredRFIs.map((rfi) => {
            const rfiType = mapCategoryToType(rfi.category);
            const TypeIcon = rfiTypeConfig[rfiType].icon;
            const isResponseRequired = getResponseRequired(rfi);
            const isSelected = selectedRFI?.id === rfi.id;
            
            return (
              <div
                key={rfi.id}
                className={`border-b p-4 cursor-pointer hover:bg-muted/50 ${
                  isSelected ? 'bg-muted border-l-4 border-l-primary' : ''
                }`}
                onClick={() => handleRFIClick(rfi)}
                onDoubleClick={() => handleRFIDoubleClick(rfi)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TypeIcon className={`h-4 w-4 ${rfiTypeConfig[rfiType].color}`} />
                    <span className="text-xs text-muted-foreground font-medium">
                      {rfiType}
                    </span>
                    {isResponseRequired && (
                      <Badge variant="outline" className="text-xs">
                        Response Required
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusConfig[rfi.status].variant}>
                      {statusConfig[rfi.status].label}
                    </Badge>
                    {!rfi.response && rfi.status === 'outstanding' && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="font-medium text-sm line-clamp-1">
                    {rfi.subject || 'No Subject'}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {rfi.question}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span>From: {rfi.raised_by_profile?.name || 'Unknown'}</span>
                    <span>To: {rfi.recipient_name || 'Unassigned'}</span>
                    {rfi.attachments && rfi.attachments.length > 0 && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Paperclip className="h-3 w-3" />
                        <span>{rfi.attachments.length}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(rfi.created_at), 'MMM d, HH:mm')}
                  </div>
                </div>

                {rfi.due_date && (
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs">
                      Due: {format(new Date(rfi.due_date), 'MMM d')}
                    </Badge>
                  </div>
                )}
              </div>
            );
          })}

          {filteredRFIs.length === 0 && (
            <div className="text-center py-12 px-4">
              <Mail className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <h3 className="font-medium mb-1">No RFIs Found</h3>
              <p className="text-sm text-muted-foreground">
                {rfis.length === 0
                  ? "No RFIs have been created yet."
                  : "No RFIs match your current filters."
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content - RFI Detail */}
      <div className="flex-1 flex flex-col">
        {selectedRFI ? (
          <>
            {/* RFI Header */}
            <div className="border-b bg-card p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-xl font-semibold">
                      {selectedRFI.subject || 'No Subject'}
                    </h2>
                    <Badge variant={statusConfig[selectedRFI.status].variant}>
                      {statusConfig[selectedRFI.status].label}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>RFI #{selectedRFI.rfi_number || selectedRFI.id.slice(0, 8)}</div>
                    <div>Type: {mapCategoryToType(selectedRFI.category)}</div>
                    <div>Created: {format(new Date(selectedRFI.created_at), 'PPP')}</div>
                  </div>
                </div>
                
                {selectedRFI.status !== 'closed' && (
                  <Button onClick={() => onReply(selectedRFI)}>
                    <Reply className="w-4 h-4 mr-2" />
                    Reply
                  </Button>
                )}
              </div>
            </div>

            {/* RFI Content */}
            <div className="flex-1 overflow-auto p-6">
              <div className="space-y-6">
                {/* Original Message */}
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          From: {selectedRFI.raised_by_profile?.name || 'Unknown'}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          To: {selectedRFI.recipient_name || 'Unassigned'}
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(selectedRFI.created_at), 'PPP p')}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none">
                      <p className="whitespace-pre-wrap">{selectedRFI.question}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Response (if exists) */}
                {selectedRFI.response && (
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            Response from: {selectedRFI.responder_name || 'Unknown'}
                          </CardTitle>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {selectedRFI.response_date && format(new Date(selectedRFI.response_date), 'PPP p')}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="prose max-w-none">
                        <p className="whitespace-pre-wrap">{selectedRFI.response}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MailOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Select an RFI</h3>
              <p className="text-muted-foreground">
                Choose an RFI from the inbox to view its details
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};