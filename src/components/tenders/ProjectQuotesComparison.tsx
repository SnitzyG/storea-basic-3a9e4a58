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
      <Card>
        <CardHeader>
          <CardTitle>Submitted Quotes Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tender</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Quotes Received</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tendersWithBids.map(tender => (
                <TableRow key={tender.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">{tender.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {tender.description}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        tender.status === 'open' ? 'default' : 
                        tender.status === 'closed' ? 'secondary' : 
                        tender.status === 'awarded' ? 'default' : 
                        'outline'
                      }
                    >
                      {tender.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {new Date(tender.deadline).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{tender.bid_count || 0}</span>
                      <span className="text-sm text-muted-foreground">quote{(tender.bid_count || 0) !== 1 ? 's' : ''}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedTenderId(tender.id);
                          setViewMode('comparison');
                        }}
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Compare
                      </Button>
                    </div>
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
