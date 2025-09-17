import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, AlertTriangle } from 'lucide-react';
import { useTenders, Tender } from '@/hooks/useTenders';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { useProjectSelection } from '@/context/ProjectSelectionContext';
import { TenderCard } from '@/components/tenders/TenderCard';
import { CreateTenderDialog } from '@/components/tenders/CreateTenderDialog';
import { TenderDetailsDialog } from '@/components/tenders/TenderDetailsDialog';
import { BidSubmissionDialog } from '@/components/tenders/BidSubmissionDialog';
import { TenderInviteDialog } from '@/components/tenders/TenderInviteDialog';
import { BidsReceivedSection } from '@/components/tenders/BidsReceivedSection';
const Tenders = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);
  const [activeTab, setActiveTab] = useState<'tenders' | 'bids'>('tenders');
  const { selectedProject } = useProjectSelection();
  const {
    projects
  } = useProjects();
  const {
    profile
  } = useAuth();
  const {
    tenders,
    loading,
    publishTender,
    closeTender,
    awardTender
  } = useTenders(selectedProject?.id);
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
  const handleInviteBidders = (tender: Tender) => {
    setSelectedTender(tender);
    setInviteDialogOpen(true);
  };

  // Check for expired tenders that need to be closed
  const expiredOpenTenders = tenders.filter(t => t.status === 'open' && new Date(t.deadline) < new Date());

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
    return <div className="min-h-screen flex items-center justify-center">
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
      </div>;
  }
  if (projects.length === 0) {
    return <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardContent>
            <div className="relative w-full">
              <svg viewBox="0 0 200 200" className="w-full h-auto">
                {/* Construction staging - appearing sequentially */}
                
                {/* Ground/Site preparation */}
                <rect x="30" y="170" width="140" height="20" className="fill-muted animate-[fadeInUp_0.6s_ease-out_0.2s_both]" />
                
                {/* Foundation */}
                <rect x="40" y="160" width="120" height="10" className="fill-muted-foreground animate-[fadeInUp_0.6s_ease-out_0.6s_both]" />
                
                {/* Building the frame/structure */}
                <g className="animate-[fadeInUp_0.8s_ease-out_1s_both]">
                  <rect x="50" y="120" width="100" height="40" className="fill-primary/10" stroke="hsl(var(--primary))" strokeWidth="2" />
                  {/* Frame details */}
                  <line x1="70" y1="120" x2="70" y2="160" stroke="hsl(var(--primary))" strokeWidth="1" />
                  <line x1="100" y1="120" x2="100" y2="160" stroke="hsl(var(--primary))" strokeWidth="1" />
                  <line x1="130" y1="120" x2="130" y2="160" stroke="hsl(var(--primary))" strokeWidth="1" />
                </g>
                
                {/* Roof construction */}
                <g className="animate-[fadeInUp_0.8s_ease-out_1.4s_both]">
                  <polygon points="45,120 100,80 155,120" className="fill-primary/80" />
                  {/* Roof beams */}
                  <line x1="100" y1="80" x2="75" y2="110" stroke="hsl(var(--primary-foreground))" strokeWidth="1" />
                  <line x1="100" y1="80" x2="125" y2="110" stroke="hsl(var(--primary-foreground))" strokeWidth="1" />
                </g>
                
                {/* Installing windows */}
                <g className="animate-[fadeIn_0.6s_ease-out_1.8s_both]">
                  <rect x="65" y="135" width="15" height="15" className="fill-secondary" stroke="hsl(var(--primary))" strokeWidth="1" />
                  <line x1="72.5" y1="135" x2="72.5" y2="150" className="stroke-primary" strokeWidth="1" />
                  <line x1="65" y1="142.5" x2="80" y2="142.5" className="stroke-primary" strokeWidth="1" />
                </g>
                
                <g className="animate-[fadeIn_0.6s_ease-out_2s_both]">
                  <rect x="120" y="135" width="15" height="15" className="fill-secondary" stroke="hsl(var(--primary))" strokeWidth="1" />
                  <line x1="127.5" y1="135" x2="127.5" y2="150" className="stroke-primary" strokeWidth="1" />
                  <line x1="120" y1="142.5" x2="135" y2="142.5" className="stroke-primary" strokeWidth="1" />
                </g>
                
                {/* Door installation */}
                <g className="animate-[fadeIn_0.6s_ease-out_2.2s_both]">
                  <rect x="90" y="145" width="20" height="25" className="fill-accent" stroke="hsl(var(--primary))" strokeWidth="1" />
                  <circle cx="106" cy="157" r="1.5" className="fill-primary animate-[fadeIn_0.4s_ease-out_2.8s_both]" />
                </g>
                
                {/* Final details - chimney and finishing touches */}
                <g className="animate-[fadeInUp_0.6s_ease-out_2.4s_both]">
                  <rect x="125" y="85" width="8" height="20" className="fill-muted-foreground" />
                  {/* Roofing tiles effect */}
                  <path d="M 50 120 Q 100 115 150 120" stroke="hsl(var(--primary-foreground))" strokeWidth="1" fill="none" />
                </g>
                
                 {/* Smoke - sign of life/completion */}
               <g className="animate-[fadeIn_0.8s_ease-out_3s_both]">
                 <circle cx="129" cy="80" r="2" className="fill-muted-foreground/40 animate-[float_3s_ease-in-out_3.2s_infinite]" />
                 <circle cx="131" cy="75" r="1.5" className="fill-muted-foreground/30 animate-[float_3s_ease-in-out_3.4s_infinite]" />
                 <circle cx="127" cy="72" r="1" className="fill-muted-foreground/20 animate-[float_3s_ease-in-out_3.6s_infinite]" />
               </g>
                
                {/* Landscaping - final touch */}
                <g className="animate-[fadeIn_0.6s_ease-out_3.2s_both]">
                  <ellipse cx="30" cy="175" rx="8" ry="4" className="fill-green-500/60" />
                  <ellipse cx="170" cy="175" rx="10" ry="5" className="fill-green-500/60" />
                </g>
              </svg>
              
              {/* Enhanced STOREA Lite Logo */}
              <div className="mt-6 text-center animate-[fadeIn_0.8s_ease-out_3.4s_both]">
                <h1 className="text-4xl font-bold tracking-wider">
                  <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    STOREALite
                  </span>
                </h1>
              </div>
            </div>
            
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold mb-2">Tenders</h3>
              <p className="text-muted-foreground mb-4">
                No projects available. Create a project first to create a Tender.
              </p>
              <Button asChild>
                <Link to="/projects">Go to Projects</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>;
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading tenders...</div>
      </div>;
  }
  if (!selectedProject) {
    return <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Tenders</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              No projects available. Create a project first to create a Tender.
            </p>
            <Button asChild>
              <Link to="/projects">Go to Projects</Link>
            </Button>
          </CardContent>
        </Card>
      </div>;
  }
  return <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Tenders</h1>
          <p className="text-muted-foreground">
            Manage bidding and tender workflow for {selectedProject?.name}
          </p>
        </div>
        {userRole === 'architect' && <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Tender
          </Button>}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 bg-muted/30 p-1 rounded-lg w-fit">
        
        {userRole === 'architect'}
      </div>

      {/* Project selector is now in the header - no longer needed here */}

      {/* Expired Tenders Alert */}
      {expiredOpenTenders.length > 0 && userRole === 'architect' && <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">
                {expiredOpenTenders.length} tender(s) have expired and will be auto-closed
              </span>
            </div>
          </CardContent>
        </Card>}

      {/* Content based on active tab */}
      {activeTab === 'tenders' ? <>
          {/* Tender Grid */}
          {filteredTenders.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTenders.map(tender => <TenderCard key={tender.id} tender={tender} userRole={userRole} onView={handleViewTender} onBid={handleBidTender} onEdit={userRole === 'architect' ? handleEditTender : undefined} onPublish={userRole === 'architect' ? handlePublishTender : undefined} onAward={userRole === 'architect' ? handleAwardTender : undefined} onInvite={userRole === 'architect' ? handleInviteBidders : undefined} />)}
            </div> : <Card>
              <CardContent className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2">No Tenders Found</h3>
                <p className="text-muted-foreground mb-4">
                  {userRole === 'architect' ? "No tenders have been created for this project yet." : "No tenders are available for bidding in this project."}
                </p>
                {userRole === 'architect' && <Button onClick={() => setCreateDialogOpen(true)}>
                    Create First Tender
                  </Button>}
              </CardContent>
            </Card>}
        </> : <BidsReceivedSection tenders={filteredTenders} />}

      {/* Dialogs */}
      <CreateTenderDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} projectId={selectedProject?.id || ''} />

      <TenderDetailsDialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen} tender={selectedTender} userRole={userRole} />

      <BidSubmissionDialog open={bidDialogOpen} onOpenChange={setBidDialogOpen} tender={selectedTender} />

      <TenderInviteDialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen} tender={selectedTender} />
    </div>;
};
export default Tenders;