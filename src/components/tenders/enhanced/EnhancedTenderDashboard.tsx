import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  BarChart3, 
  Calendar as CalendarIcon, 
  Filter, 
  Search, 
  Package, 
  MessageSquare,
  FileEdit,
  Award,
  Clock,
  DollarSign,
  TrendingUp,
  Users,
  AlertCircle,
  CheckCircle,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { EnhancedTender, useEnhancedTenders } from '@/hooks/useEnhancedTenders';
import { EnhancedTenderCard } from './EnhancedTenderCard';
import { TenderAnalytics } from './TenderAnalytics';
import { TenderPackageManager } from './TenderPackageManager';
import { BidEvaluationWorkflow } from './BidEvaluationWorkflow';
import { ContractorPrequalificationPanel } from './ContractorPrequalificationPanel';

interface EnhancedTenderDashboardProps {
  projectId: string;
  userRole: string;
}

export const EnhancedTenderDashboard = ({ projectId, userRole }: EnhancedTenderDashboardProps) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'packages' | 'analytics' | 'prequalification'>('overview');
  const [viewMode, setViewMode] = useState<'grid' | 'kanban' | 'calendar'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [selectedTenders, setSelectedTenders] = useState<string[]>([]);

  const { 
    tenders, 
    packages, 
    prequalifications, 
    loading 
  } = useEnhancedTenders(projectId);

  // Filter and search logic
  const filteredTenders = useMemo(() => {
    return tenders.filter(tender => {
      const matchesSearch = tender.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           tender.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || tender.status === statusFilter;
      const matchesType = typeFilter === 'all' || tender.tender_type === typeFilter;
      
      const matchesDate = !dateFilter || 
                         new Date(tender.deadline).toDateString() === dateFilter.toDateString();

      return matchesSearch && matchesStatus && matchesType && matchesDate;
    });
  }, [tenders, searchTerm, statusFilter, typeFilter, dateFilter]);

  // Analytics data
  const analyticsData = useMemo(() => {
    const totalTenders = tenders.length;
    const openTenders = tenders.filter(t => t.status === 'open').length;
    const closedTenders = tenders.filter(t => t.status === 'closed').length;
    const awardedTenders = tenders.filter(t => t.status === 'awarded').length;
    const totalBids = tenders.reduce((sum, t) => sum + (t.bid_count || 0), 0);
    const avgBidsPerTender = totalTenders > 0 ? Math.round(totalBids / totalTenders * 10) / 10 : 0;
    
    const upcomingDeadlines = tenders.filter(t => {
      const deadline = new Date(t.deadline);
      const now = new Date();
      const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 7 && diffDays > 0 && t.status === 'open';
    }).length;

    return {
      totalTenders,
      openTenders,
      closedTenders,
      awardedTenders,
      totalBids,
      avgBidsPerTender,
      upcomingDeadlines,
    };
  }, [tenders]);

  const handleBulkAction = (action: string) => {
    // Implement bulk actions like bulk publish, bulk close, etc.
    console.log(`Bulk action: ${action} on tenders:`, selectedTenders);
  };

  const renderKanbanView = () => {
    const columns = [
      { id: 'draft', title: 'Draft', status: 'draft' },
      { id: 'open', title: 'Open', status: 'open' },
      { id: 'closed', title: 'Closed', status: 'closed' },
      { id: 'awarded', title: 'Awarded', status: 'awarded' },
    ];

    return (
      <div className="grid grid-cols-4 gap-4 h-[600px] overflow-hidden">
        {columns.map(column => (
          <Card key={column.id} className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{column.title}</CardTitle>
                <Badge variant="secondary">
                  {filteredTenders.filter(t => t.status === column.status).length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-3">
              {filteredTenders
                .filter(tender => tender.status === column.status)
                .map(tender => (
                  <Card key={tender.id} className="p-3 cursor-pointer hover:shadow-md transition-shadow">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm line-clamp-2">{tender.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(tender.deadline), 'MMM dd')}
                      </div>
                      {tender.budget && (
                        <div className="flex items-center gap-2 text-xs">
                          <DollarSign className="w-3 h-3" />
                          ${tender.budget.toLocaleString()}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs">
                        <Users className="w-3 h-3" />
                        {tender.bid_count || 0} bids
                      </div>
                    </div>
                  </Card>
                ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderCalendarView = () => {
    const calendarTenders = filteredTenders.map(tender => ({
      ...tender,
      date: new Date(tender.deadline),
    }));

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Calendar
            mode="single"
            selected={dateFilter}
            onSelect={setDateFilter}
            className="rounded-md border w-full"
          />
        </div>
        <div className="space-y-4">
          <h3 className="font-semibold">Upcoming Deadlines</h3>
          {calendarTenders
            .filter(t => {
              const deadline = new Date(t.deadline);
              const now = new Date();
              const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              return diffDays <= 30 && diffDays >= 0;
            })
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .map(tender => (
              <Card key={tender.id} className="p-3">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">{tender.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {format(tender.date, 'MMM dd, yyyy')}
                  </div>
                  <Badge 
                    variant={
                      tender.status === 'open' ? 'default' : 
                      tender.status === 'closed' ? 'secondary' : 'outline'
                    }
                    className="text-xs"
                  >
                    {tender.status}
                  </Badge>
                </div>
              </Card>
            ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading enhanced tender dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalTenders}</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.openTenders} open, {analyticsData.awardedTenders} awarded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bids</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalBids}</div>
            <p className="text-xs text-muted-foreground">
              Avg: {analyticsData.avgBidsPerTender} per tender
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Deadlines</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.upcomingDeadlines}</div>
            <p className="text-xs text-muted-foreground">
              Within next 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Packages</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{packages.length}</div>
            <p className="text-xs text-muted-foreground">
              Active tender packages
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="packages">Packages</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="prequalification">Prequalification</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div className="flex-1 space-y-4 lg:space-y-0 lg:flex lg:gap-4 lg:items-center">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tenders..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="awarded">Awarded</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="construction">Construction</SelectItem>
                      <SelectItem value="consulting">Consulting</SelectItem>
                    </SelectContent>
                  </Select>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-40">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFilter ? format(dateFilter, "MMM dd") : "Filter Date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateFilter}
                        onSelect={setDateFilter}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex gap-2">
                  <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grid">Grid</SelectItem>
                      <SelectItem value="kanban">Kanban</SelectItem>
                      <SelectItem value="calendar">Calendar</SelectItem>
                    </SelectContent>
                  </Select>

                  {selectedTenders.length > 0 && (
                    <Select onValueChange={handleBulkAction}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Bulk Actions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="publish">Publish Selected</SelectItem>
                        <SelectItem value="close">Close Selected</SelectItem>
                        <SelectItem value="delete">Delete Selected</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Tender Display */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTenders.map(tender => (
                <EnhancedTenderCard 
                  key={tender.id} 
                  tender={tender} 
                  userRole={userRole}
                  onSelect={(id, selected) => {
                    if (selected) {
                      setSelectedTenders(prev => [...prev, id]);
                    } else {
                      setSelectedTenders(prev => prev.filter(t => t !== id));
                    }
                  }}
                  isSelected={selectedTenders.includes(tender.id)}
                />
              ))}
            </div>
          )}

          {viewMode === 'kanban' && renderKanbanView()}
          {viewMode === 'calendar' && renderCalendarView()}

          {filteredTenders.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Tenders Found</h3>
                <p className="text-muted-foreground mb-4">
                  No tenders match your current filters. Try adjusting your search criteria.
                </p>
                <Button onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setTypeFilter('all');
                  setDateFilter(undefined);
                }}>
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="packages">
          <TenderPackageManager projectId={projectId} userRole={userRole} />
        </TabsContent>

        <TabsContent value="analytics">
          <TenderAnalytics tenders={tenders} />
        </TabsContent>

        <TabsContent value="prequalification">
          <ContractorPrequalificationPanel 
            projectId={projectId} 
            userRole={userRole}
            prequalifications={prequalifications}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};