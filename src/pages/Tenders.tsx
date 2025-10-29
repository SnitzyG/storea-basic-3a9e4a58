import React, { useState, useMemo } from 'react';
import { StorealiteLogo } from '@/components/ui/storealite-logo';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, AlertTriangle, FileText, Users, BarChart3, UserPlus, Edit, Trash2 } from 'lucide-react';
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
import { TenderComparisonDashboard } from '@/components/tenders/TenderComparisonDashboard';
import { generateTenderPackage } from '@/utils/tenderPackageGenerator';
import { toast } from '@/hooks/use-toast';

const Tenders = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);
  const [activeTab, setActiveTab] = useState<'tenders' | 'bids' | 'comparison'>('tenders');
  const {
    selectedProject
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
    setSelectedTender(tender);
    setEditDialogOpen(true);
  };
  
  const handleViewTenderPackage = async (tender: Tender) => {
    try {
      await generateTenderPackage(tender);
      toast({
        title: "Package Generated",
        description: "Tender package (PDF + Excel) has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Package Generation Error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate tender package. Please try again.",
        variant: "destructive",
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
  // Remove homeowner restriction - allow all users to access tenders
  if (projects.length === 0) {
    return <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <div className="mb-6">
              <StorealiteLogo className="text-5xl" />
            </div>
            
            <h3 className="text-lg font-semibold mb-2">Tenders</h3>
            <p className="text-muted-foreground mb-4">
              No projects available. Create a project or join a project first to create a Tender.
            </p>
            <Button asChild>
              <Link to="/projects">Go to Projects</Link>
            </Button>
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
              No projects available. Create a project or join a project first to create a Tender.
            </p>
            <Button asChild>
              <Link to="/projects">Go to Projects</Link>
            </Button>
          </CardContent>
        </Card>
      </div>;
  }
  
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'DRAFT', className: 'bg-gray-100 text-gray-800' },
      open: { label: 'OPEN', className: 'bg-green-100 text-green-800' },
      closed: { label: 'CLOSED', className: 'bg-orange-100 text-orange-800' },
      awarded: { label: 'AWARDED', className: 'bg-blue-100 text-blue-800' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return <div className="space-y-6 mx-[25px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div></div>
        {userRole === 'architect' && (
          <Button onClick={() => setCreateDialogOpen(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            New Tender
          </Button>
        )}
      </div>

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

      {/* Main Content Tabs */}
      <Tabs defaultValue="tenders" className="w-full" value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tenders" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            All Tenders
          </TabsTrigger>
          {userRole === 'architect' && (
            <>
              <TabsTrigger value="bids" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Bids Received
              </TabsTrigger>
              <TabsTrigger value="comparison" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Comparison
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="tenders" className="space-y-6">
          {/* Tenders List View */}
          {filteredTenders.length > 0 ? (
            <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-card/50">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-gradient-to-r from-muted/50 to-muted/30 border-b-2 border-primary/10">
                    <TableRow>
                      <TableHead className="text-foreground/80 font-semibold text-sm h-12 px-4">Title</TableHead>
                      <TableHead className="text-foreground/80 font-semibold text-sm h-12 px-4">Status</TableHead>
                      <TableHead className="text-foreground/80 font-semibold text-sm h-12 px-4">Deadline</TableHead>
                      <TableHead className="text-foreground/80 font-semibold text-sm h-12 px-4">Issued By</TableHead>
                      <TableHead className="text-foreground/80 font-semibold text-sm h-12 px-4">Bids Received</TableHead>
                      <TableHead className="text-foreground/80 font-semibold text-sm h-12 px-4">Created</TableHead>
                      <TableHead className="text-foreground/80 font-semibold text-sm h-12 px-4 w-[150px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTenders.map(tender => (
                      <TableRow key={tender.id} className="hover:bg-muted/30 transition-all duration-200 cursor-pointer border-b border-muted/20">
                        <TableCell className="text-sm px-4 py-3 text-foreground/90">
                          <div className="space-y-1">
                            <p className="font-medium text-sm leading-none text-foreground">{tender.title}</p>
                            {tender.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">{tender.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm px-4 py-3 text-foreground/90">
                          {getStatusBadge(tender.status)}
                        </TableCell>
                        <TableCell className="text-sm px-4 py-3 text-foreground/90">
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-foreground">
                              {new Date(tender.deadline).toLocaleDateString()} at {new Date(tender.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              ({Math.ceil((new Date(tender.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days)
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm px-4 py-3 text-foreground/90">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-xs font-semibold text-primary">
                                {tender.issued_by_profile?.name?.charAt(0) || 'U'}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {tender.issued_by_profile?.name || 'Unknown'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm px-4 py-3 text-foreground/90">
                          <span className="text-xs text-muted-foreground">
                            {tender.bid_count || 0} bid(s) received
                          </span>
                        </TableCell>
                        <TableCell className="text-sm px-4 py-3 text-foreground/90">
                          <span className="text-xs text-muted-foreground">
                            {(() => {
                              const now = new Date();
                              const created = new Date(tender.created_at);
                              const diffMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
                              
                              if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
                              const diffHours = Math.floor(diffMinutes / 60);
                              if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
                              const diffDays = Math.floor(diffHours / 24);
                              return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
                            })()}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm px-4 py-3 text-foreground/90 w-[200px]">
                          <div className="flex gap-1 items-center">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleViewTenderPackage(tender)}
                              title="View Tender Package PDF"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            
                            {userRole === 'architect' && (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => {
                                    setSelectedTender(tender);
                                    setWizardOpen(true);
                                  }}
                                  title="Edit Tender"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleInviteBidders(tender)}
                                  title="Invite Bidders"
                                >
                                  <UserPlus className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleDeleteTender(tender)}
                                  title="Delete Tender"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Tenders Found</h3>
                <p className="text-muted-foreground mb-4">
                  {userRole === 'architect' ? "No tenders have been created for this project yet." : "No tenders are available for bidding in this project."}
                </p>
                {userRole === 'architect' && <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Tender
                  </Button>}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="bids" className="space-y-6">
          <BidsReceivedSection tenders={filteredTenders} />
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <TenderComparisonDashboard tenderId={selectedProject?.id || ''} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateTenderWizard 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
        projectId={selectedProject?.id || ''} 
      />

      <CreateTenderWizard 
        open={wizardOpen} 
        onOpenChange={(open) => {
          setWizardOpen(open);
          if (!open) setSelectedTender(null);
        }} 
        projectId={selectedProject?.id || ''} 
        existingTender={selectedTender}
      />

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
            <AlertDialogAction 
              onClick={confirmDeleteTender}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};
export default Tenders;
