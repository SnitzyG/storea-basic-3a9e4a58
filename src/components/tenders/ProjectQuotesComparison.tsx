import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Eye, BarChart3, DollarSign, Calendar, Building2 } from 'lucide-react';
import { useTenders } from '@/hooks/useTenders';
import { TenderComparisonDashboard } from './TenderComparisonDashboard';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface ProjectQuotesComparisonProps {
  projectId?: string;
}

export const ProjectQuotesComparison: React.FC<ProjectQuotesComparisonProps> = ({ projectId }) => {
  const { tenders, loading } = useTenders(projectId);
  const [selectedTenderId, setSelectedTenderId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'comparison'>('list');

  // Filter tenders that have bids
  const tendersWithBids = tenders.filter(tender => (tender.bid_count || 0) > 0);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Loading tenders...</p>
        </CardContent>
      </Card>
    );
  }

  if (tendersWithBids.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Quotes Available</h3>
          <p className="text-muted-foreground">
            No tenders have received bids yet. Quotes will appear here once builders submit their proposals.
          </p>
        </CardContent>
      </Card>
    );
  }

  // If a tender is selected for comparison view
  if (viewMode === 'comparison' && selectedTenderId) {
    const selectedTender = tenders.find(t => t.id === selectedTenderId);
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{selectedTender?.title}</h3>
            <p className="text-sm text-muted-foreground">Comparing {selectedTender?.bid_count || 0} quotes</p>
          </div>
          <Button variant="outline" onClick={() => setViewMode('list')}>
            Back to List
          </Button>
        </div>
        <TenderComparisonDashboard tenderId={selectedTenderId} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tender Selector */}
      <div className="flex items-center gap-4">
        <Select value={selectedTenderId} onValueChange={setSelectedTenderId}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Select a tender to view quotes" />
          </SelectTrigger>
          <SelectContent>
            {tendersWithBids.map(tender => (
              <SelectItem key={tender.id} value={tender.id}>
                {tender.title} ({tender.bid_count || 0} quote{(tender.bid_count || 0) !== 1 ? 's' : ''})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {selectedTenderId && (
          <Button onClick={() => setViewMode('comparison')}>
            <BarChart3 className="h-4 w-4 mr-2" />
            View Comparison Dashboard
          </Button>
        )}
      </div>

      {/* Quotes Overview Table */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-card/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gradient-to-r from-muted/50 to-muted/30 border-b-2 border-primary/10">
              <TableRow>
                <TableHead className="text-foreground/80 font-semibold text-sm h-12 px-4">Tender</TableHead>
                <TableHead className="text-foreground/80 font-semibold text-sm h-12 px-4">Status</TableHead>
                <TableHead className="text-foreground/80 font-semibold text-sm h-12 px-4">Deadline</TableHead>
                <TableHead className="text-foreground/80 font-semibold text-sm h-12 px-4">Quotes Received</TableHead>
                <TableHead className="text-foreground/80 font-semibold text-sm h-12 px-4 w-[50px] text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tendersWithBids.map(tender => (
                <TableRow 
                  key={tender.id}
                  className="hover:bg-muted/30 transition-all duration-200 cursor-pointer border-b border-muted/20"
                  onClick={() => {
                    setSelectedTenderId(tender.id);
                    setViewMode('comparison');
                  }}
                >
                  <TableCell className="text-sm px-4 py-3 text-foreground/90">
                    <div className="space-y-1">
                      <p className="font-medium text-sm leading-none text-foreground">{tender.title}</p>
                      {tender.description && (
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {tender.description}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm px-4 py-3 text-foreground/90">
                    <Badge 
                      className={
                        tender.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                        tender.status === 'open' ? 'bg-green-100 text-green-800' : 
                        tender.status === 'closed' ? 'bg-yellow-100 text-yellow-800' : 
                        tender.status === 'awarded' ? 'bg-blue-100 text-blue-800' : 
                        'bg-red-100 text-red-800'
                      }
                    >
                      {tender.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm px-4 py-3 text-foreground/90">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">
                        {new Date(tender.deadline).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm px-4 py-3 text-foreground/90">
                    <span className="text-xs text-muted-foreground">
                      {tender.bid_count || 0} quote{(tender.bid_count || 0) !== 1 ? 's' : ''}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm px-4 py-3 text-foreground/90 w-[50px] text-center">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTenderId(tender.id);
                        setViewMode('comparison');
                      }}
                    >
                      <BarChart3 className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
