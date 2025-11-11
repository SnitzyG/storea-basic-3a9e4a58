import React, { useState, useMemo } from 'react';

import { Link, useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, AlertTriangle, FileText, BarChart3, UserPlus, CheckCircle, Eye } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useTenders, Tender } from '@/hooks/useTenders';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { useProjectSelection } from '@/context/ProjectSelectionContext';
import { CreateTenderWizard } from '@/components/tenders/CreateTenderWizard';
import { TenderDetailsDialog } from '@/components/tenders/TenderDetailsDialog';
import { BidSubmissionDialog } from '@/components/tenders/BidSubmissionDialog';
import { TenderInviteDialog } from '@/components/tenders/TenderInviteDialog';
import { BidsReceivedSection } from '@/components/tenders/BidsReceivedSection';
import { ProjectQuotesComparison } from '@/components/tenders/ProjectQuotesComparison';
import { TenderJoinSection } from '@/components/tenders/TenderJoinSection';
import { TenderAccessApprovals } from '@/components/tenders/TenderAccessApprovals';
import { TenderDetailsView } from '@/components/tenders/TenderDetailsView';
import { TenderListView } from '@/components/tenders/TenderListView';
import { generateTenderPackage } from '@/utils/tenderPackageGenerator';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTenderAccess } from '@/hooks/useTenderAccess';
import { formatDistanceToNow } from 'date-fns';


const Tenders = () => {
  const {
    tenderId
  } = useParams<{
    tenderId?: string;
  }>();
  const navigate = useNavigate();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);
  const [activeTab, setActiveTab] = useState<'tenders' | 'compare' | 'join'>('tenders');
  const {
    selectedProject,
    selectedTender: contextTender,
    availableTenders
  } = useProjectSelection();
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
    awardTender,
    deleteTender
  } = useTenders(selectedProject?.id);
  const userRole = profile?.role || '';

  // Combine tenders from project and context (for builders who joined via tender)
  const allTenders = useMemo(() => {
    const tenderMap = new Map();
    
    // Add tenders from project
    tenders.forEach(t => tenderMap.set(t.id, t));
    
    // Add tenders from context (for builders)
    availableTenders.forEach(t => {
      if (!tenderMap.has(t.id)) {
        tenderMap.set(t.id, t);
      }
    });
    
    const combined = Array.from(tenderMap.values());
    console.log('[Tenders] Combined tenders:', combined.length, 'from project:', tenders.length, 'from context:', availableTenders.length);
    return combined;
  }, [tenders, availableTenders]);

  // Filter tenders based on user role
  const filteredTenders = useMemo(() => {
    // Homeowners should not see tenders tab at all, but just in case
    if (userRole === 'homeowner') return [];
    return allTenders;
  }, [allTenders, userRole]);
  const handleViewTender = (tender: Tender) => {
    setSelectedTender(tender);
    setDetailsDialogOpen(true);
  };
  const handleBidTender = (tender: Tender) => {
    setSelectedTender(tender);
    setBidDialogOpen(true);
  };
  const handleEditTender = (tender: Tender) => {
    setSelectedTender(tender);
    setEditDialogOpen(true);
  };
  const handleViewTenderPackage = async (tender: Tender) => {
    try {
      await generateTenderPackage(tender);
      toast({
        title: "Package Generated",
        description: "Tender package (PDF + Excel) has been downloaded successfully."
      });
    } catch (error) {
      console.error('Package Generation Error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate tender package. Please try again.",
        variant: "destructive"
      });
    }
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
  const handleDeleteTender = (tender: Tender) => {
    setSelectedTender(tender);
    setDeleteDialogOpen(true);
  };
  const confirmDeleteTender = async () => {
    if (!selectedTender) return;
    const success = await deleteTender(selectedTender.id);
    if (success) {
      setDeleteDialogOpen(false);
      setSelectedTender(null);
    }
  };

  // Check for expired tenders that need to be closed
  const expiredOpenTenders = allTenders.filter(t => t.status === 'open' && new Date(t.deadline) < new Date());

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

  if (selectedProject?.id && loading) {
    return <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading tenders...</div>
      </div>;
  }

  // If viewing a specific tender (tenderId in URL), show TenderDetailsView
  if (tenderId) {
    return <TenderDetailsView />;
  }
  return <>
      <div className="space-y-6 mx-[25px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div></div>
        {userRole === 'architect' && <Button onClick={() => setCreateDialogOpen(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            New Tender
          </Button>}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="tenders" className="w-full" value={activeTab} onValueChange={value => setActiveTab(value as any)}>
        {userRole === 'architect' ? (
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tenders" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              My Tenders
            </TabsTrigger>
            <TabsTrigger value="compare" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Compare Quotes
            </TabsTrigger>
            <TabsTrigger value="join" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Join Tender
            </TabsTrigger>
          </TabsList>
        ) : (
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tenders" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              My Tenders
            </TabsTrigger>
            <TabsTrigger value="join" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Join Tender
            </TabsTrigger>
          </TabsList>
        )}

        <TabsContent value="tenders" className="space-y-6">
          {/* Expired Tenders Alert */}
          {expiredOpenTenders.length > 0 && userRole === 'architect' && <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-orange-700">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-medium">
                    {expiredOpenTenders.length} tender(s) have expired and will be auto-closed
                  </span>
                </div>
              </CardContent>
            </Card>}

          {/* Tenders List View */}
          {filteredTenders.length > 0 ? (
            <TenderListView
              tenders={filteredTenders}
              onView={(t) => {
                if (userRole === 'builder' || userRole === 'contractor') {
                  navigate(`/tenders/${t.tender_id}/builder`);
                } else {
                  navigate(`/tenders/${t.id}`);
                }
              }}
            />
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No tenders yet</h3>
                <p className="text-muted-foreground mb-4">
                  Check back soon for new opportunities.
                </p>
                {userRole === 'architect' && (
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Tender
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Access Requests Section - Only for Architects */}
          {userRole === 'architect' && <TenderAccessApprovals projectId={selectedProject?.id} />}
        </TabsContent>

        {/* Compare Quotes Tab */}
        <TabsContent value="compare" className="space-y-6">
          {userRole === 'architect' ? <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Compare Builder Quotes</h3>
                  <p className="text-sm text-muted-foreground">View and compare submitted bids from builders</p>
                </div>
              </div>
              <ProjectQuotesComparison projectId={selectedProject?.id} />
            </> : <Card>
              <CardContent className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Access Restricted</h3>
                <p className="text-muted-foreground">
                  Only architects can compare quotes
                </p>
              </CardContent>
            </Card>}
        </TabsContent>

        {/* Join Tender Tab */}
        <TabsContent value="join" className="space-y-6">
          <TenderJoinSection projectId={selectedProject?.id} />
        </TabsContent>
      </Tabs>
    </div>

    {/* Dialogs */}
    <CreateTenderWizard open={createDialogOpen} onOpenChange={setCreateDialogOpen} projectId={selectedProject?.id || ''} />

      <CreateTenderWizard open={wizardOpen} onOpenChange={open => {
      setWizardOpen(open);
      if (!open) setSelectedTender(null);
    }} projectId={selectedProject?.id || ''} existingTender={selectedTender} />

      <TenderDetailsDialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen} tender={selectedTender} userRole={userRole} />

      <BidSubmissionDialog open={bidDialogOpen} onOpenChange={setBidDialogOpen} tender={selectedTender} />

      <TenderInviteDialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen} tender={selectedTender} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tender</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedTender?.title}"? This action cannot be undone and will also delete all associated bids.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTender} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    {/* Create/Edit Tender Wizard */}
    <CreateTenderWizard open={wizardOpen} onOpenChange={setWizardOpen} projectId={selectedProject?.id || ''} />
    </>;
};
export default Tenders;