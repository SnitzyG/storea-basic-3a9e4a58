import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, BarChart3, List, AlertTriangle } from 'lucide-react';
import { useTenders, Tender } from '@/hooks/useTenders';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { TenderCard } from '@/components/tenders/TenderCard';
import { CreateTenderDialog } from '@/components/tenders/CreateTenderDialog';
import { TenderDetailsDialog } from '@/components/tenders/TenderDetailsDialog';
import { BidSubmissionDialog } from '@/components/tenders/BidSubmissionDialog';

const Tenders = () => {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);

  const { projects } = useProjects();
  const { profile } = useAuth();
  const currentProject = projects.find(p => p.id === selectedProject) || projects[0];
  const { tenders, loading, publishTender, closeTender, awardTender } = useTenders(currentProject?.id);

  const userRole = profile?.role || '';

  // Filter tenders based on user role
  const filteredTenders = useMemo(() => {
    // Homeowners should not see tenders tab at all, but just in case
    if (userRole === 'homeowner') return [];
    return tenders;
  }, [tenders, userRole]);

  const handleViewTender = (tender: Tender) => {
    setSelectedTender(tender);
    setDetailsDialogOpen(true);
  };

  const handleBidTender = (tender: Tender) => {
    setSelectedTender(tender);
    setBidDialogOpen(true);
  };

  const handleEditTender = (tender: Tender) => {
    // For now, just show details
    // In a full implementation, you'd have an edit dialog
    setSelectedTender(tender);
    setDetailsDialogOpen(true);
  };

  const handlePublishTender = async (tender: Tender) => {
    await publishTender(tender.id);
  };

  const handleAwardTender = (tender: Tender) => {
    setSelectedTender(tender);
    setDetailsDialogOpen(true);
  };

  // Check for expired tenders that need to be closed
  const expiredOpenTenders = tenders.filter(t => 
    t.status === 'open' && new Date(t.deadline) < new Date()
  );

  // Auto-close expired tenders (in a real app, this would be a background job)
  React.useEffect(() => {
    const autoCloseExpired = async () => {
      for (const tender of expiredOpenTenders) {
        await closeTender(tender.id);
      }
    };

    if (expiredOpenTenders.length > 0) {
      autoCloseExpired();
    }
  }, [expiredOpenTenders.length]);

  if (userRole === 'homeowner') {
    // Homeowners should not see the tenders page
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Access Restricted</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Tender management is only available to Architects, Builders, and Contractors.
            </p>
            <Button asChild>
              <Link to="/projects">Go to Projects</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading tenders...</div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>No Projects Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              You need to be part of a project to manage tenders.
            </p>
            <Button asChild>
              <Link to="/projects">Go to Projects</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Tenders</h1>
          <p className="text-muted-foreground">
            Manage bidding and tender workflow for {currentProject.name}
          </p>
        </div>
        {userRole === 'architect' && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Tender
          </Button>
        )}
      </div>

      {/* Project Selector */}
      {projects.length > 1 && (
        <div className="mb-6">
          <select
            value={selectedProject || currentProject.id}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Expired Tenders Alert */}
      {expiredOpenTenders.length > 0 && userRole === 'architect' && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">
                {expiredOpenTenders.length} tender(s) have expired and will be auto-closed
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="list" className="space-y-6">
        <TabsList>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="w-4 h-4" />
            Tender List
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          {/* Tender Grid */}
          {filteredTenders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTenders.map((tender) => (
                <TenderCard
                  key={tender.id}
                  tender={tender}
                  userRole={userRole}
                  onView={handleViewTender}
                  onBid={handleBidTender}
                  onEdit={userRole === 'architect' ? handleEditTender : undefined}
                  onPublish={userRole === 'architect' ? handlePublishTender : undefined}
                  onAward={userRole === 'architect' ? handleAwardTender : undefined}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2">No Tenders Found</h3>
                <p className="text-muted-foreground mb-4">
                  {userRole === 'architect' 
                    ? "No tenders have been created for this project yet."
                    : "No tenders are available for bidding in this project."
                  }
                </p>
                {userRole === 'architect' && (
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    Create First Tender
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Tender Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {tenders.filter(t => t.status === 'open').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Open Tenders</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {tenders.filter(t => t.status === 'closed').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Closed Tenders</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {tenders.filter(t => t.status === 'awarded').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Awarded</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {tenders.reduce((sum, t) => sum + (t.bid_count || 0), 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Bids</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateTenderDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        projectId={currentProject.id}
      />

      <TenderDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        tender={selectedTender}
        userRole={userRole}
      />

      <BidSubmissionDialog
        open={bidDialogOpen}
        onOpenChange={setBidDialogOpen}
        tender={selectedTender}
      />
    </div>
  );
};

export default Tenders;