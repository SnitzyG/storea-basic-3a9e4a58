import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, AlertTriangle, FileText, Users, BarChart3, UserPlus, Edit } from 'lucide-react';
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
import { generateTenderPDF } from '@/utils/tenderPDFGenerator';
import { toast } from '@/hooks/use-toast';

const Tenders = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
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
  
  const handleViewTenderPackage = (tender: Tender) => {
    try {
      generateTenderPDF(tender);
      toast({
        title: "PDF Generated",
        description: "Tender package PDF has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
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
  
  const handleDeleteTender = async (tender: Tender) => {
    await deleteTender(tender.id);
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
                  <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent font-black">
                    STOREA
                  </span>
                  <span className="bg-gradient-to-r from-accent to-accent/70 bg-clip-text text-transparent font-light ml-1">
                    Lite
                  </span>
                </h1>
              </div>
            </div>
            
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold mb-2">Tenders</h3>
              <p className="text-muted-foreground mb-4">
                No projects available. Create a project or join a project first to create a Tender.
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
                        <TableCell className="text-sm px-4 py-3 text-foreground/90 w-[150px]">
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
                                  onClick={() => handleEditTender(tender)}
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
      <CreateTenderWizard open={createDialogOpen} onOpenChange={setCreateDialogOpen} projectId={selectedProject?.id || ''} />

      <CreateTenderWizard 
        open={editDialogOpen} 
        onOpenChange={setEditDialogOpen} 
        projectId={selectedProject?.id || ''} 
        existingTender={selectedTender}
      />

      <TenderDetailsDialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen} tender={selectedTender} userRole={userRole} />

      <BidSubmissionDialog open={bidDialogOpen} onOpenChange={setBidDialogOpen} tender={selectedTender} />

      <TenderInviteDialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen} tender={selectedTender} />
    </div>;
};
export default Tenders;
