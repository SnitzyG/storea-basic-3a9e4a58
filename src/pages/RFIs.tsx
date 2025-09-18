import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Inbox, Send, FileEdit, Archive } from 'lucide-react';
import { useRFIs, RFI } from '@/hooks/useRFIs';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { useProjectSelection } from '@/context/ProjectSelectionContext';
// Import components
import { EmailStyleRFIInbox } from '@/components/rfis/EmailStyleRFIInbox';
import { CategorizedRFIInbox } from '@/components/rfis/CategorizedRFIInbox';
import { RFIListView } from '@/components/rfis/RFIListView';
import { RFIDetailPanel } from '@/components/rfis/RFIDetailPanel';
import { SimplifiedRFIComposer } from '@/components/rfis/SimplifiedRFIComposer';
import { RFIMessageComposer } from '@/components/messages/RFIMessageComposer';
// Legacy components for fallback
import { RFIDetailsDialog } from '@/components/rfis/RFIDetailsDialog';
import { ProjectScopeValidator } from '@/components/rfis/ProjectScopeValidator';
import { RFIPermissionsValidator } from '@/components/rfis/RFIPermissionsValidator';
import { RFIEnhancementsValidator } from '@/components/rfis/RFIEnhancementsValidator';
import { useProjectTeam } from '@/hooks/useProjectTeam';

const RFIs = () => {
  const [simplifiedComposerOpen, setSimplifiedComposerOpen] = useState(false);
  const [messageComposerOpen, setMessageComposerOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedRFI, setSelectedRFI] = useState<RFI | null>(null);
  const [replyToRFI, setReplyToRFI] = useState<RFI | null>(null);
  const [selectedRFIForDetail, setSelectedRFIForDetail] = useState<RFI | null>(null);
  const [projectUsers, setProjectUsers] = useState<any[]>([]);
  const [sidebarFilter, setSidebarFilter] = useState<'all' | 'inbox' | 'sent' | 'draft'>('all');
  const [isDetailOverlayOpen, setIsDetailOverlayOpen] = useState(false);
  const [overlaySelectedRFI, setOverlaySelectedRFI] = useState<RFI | null>(null);
  const { selectedProject } = useProjectSelection();
  const {
    projects
  } = useProjects();
  const {
    profile
  } = useAuth();
  const {
    rfis,
    loading,
    updateRFI
  } = useRFIs();
  const {
    teamMembers
  } = useProjectTeam(selectedProject?.id || '');
  const location = useLocation();
  const showDebug = process.env.NODE_ENV === 'development' && new URLSearchParams(location.search).get('debug') === 'rfi';

  // Update project users from teamMembers
  React.useEffect(() => {
    setProjectUsers(teamMembers);
  }, [teamMembers]);

  // Auto-open create dialog when navigated with state
  useEffect(() => {
    if ((location.state as any)?.openCreate) {
      setSimplifiedComposerOpen(true);
      // Clear the flag to prevent reopening on internal state changes
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // All RFIs for the current project - ensure proper project scoping
  const projectRFIs = rfis.filter(rfi => rfi.project_id === selectedProject?.id);

  const handleViewRFI = (rfi: RFI) => {
    setSelectedRFI(rfi);
    setDetailsDialogOpen(true);
  };

  const handleReplyToRFI = (rfi: RFI) => {
    setReplyToRFI(rfi);
    setSimplifiedComposerOpen(true);
  };

  const handleDoubleClickRFI = (rfi: RFI) => {
    setOverlaySelectedRFI(rfi);
    setIsDetailOverlayOpen(true);
  };

  const handleCloseDetailOverlay = () => {
    setIsDetailOverlayOpen(false);
    setOverlaySelectedRFI(null);
  };

  const handleCreateMessageForRFI = (rfi: RFI) => {
    setSelectedRFI(rfi);
    setMessageComposerOpen(true);
  };

  const handleExportPDF = (rfi: RFI) => {
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>RFI ${rfi.rfi_number || rfi.id}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 40px 20px;
            }
            .header { 
              background: linear-gradient(135deg, #1e293b, #334155);
              color: white;
              padding: 30px;
              border-radius: 8px;
              margin-bottom: 30px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .header h1 { 
              font-size: 28px;
              margin-bottom: 15px;
              font-weight: 600;
            }
            .header-info {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 15px;
              margin-top: 20px;
            }
            .field { 
              margin: 20px 0;
              padding: 15px;
              border-left: 4px solid #3b82f6;
              background: #f8fafc;
              border-radius: 0 8px 8px 0;
            }
            .label { 
              font-weight: 600;
              color: #1e293b;
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 8px;
            }
            .content { 
              font-size: 16px;
              line-height: 1.7;
              color: #334155;
            }
            .status-priority {
              display: flex;
              gap: 15px;
              margin: 20px 0;
            }
            .badge {
              display: inline-block;
              padding: 8px 16px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .status-outstanding { background: #dbeafe; color: #1e40af; }
            .status-responded { background: #dcfce7; color: #166534; }
            .status-overdue { background: #fee2e2; color: #dc2626; }
            .status-closed { background: #f1f5f9; color: #475569; }
            .priority-low { background: #f0fdf4; color: #166534; }
            .priority-medium { background: #fef3c7; color: #92400e; }
            .priority-high { background: #fed7aa; color: #ea580c; }
            .priority-critical { background: #fee2e2; color: #dc2626; }
            .response-section {
              background: #f1f5f9;
              border: 2px solid #e2e8f0;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .meta-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
              gap: 20px;
              margin: 20px 0;
            }
            .divider {
              height: 2px;
              background: linear-gradient(90deg, #3b82f6, #e2e8f0);
              margin: 30px 0;
              border-radius: 1px;
            }
            @media print {
              body { padding: 20px; }
              .header { background: #1e293b !important; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Request for Information</h1>
            <div class="header-info">
              <div><strong>RFI Number:</strong> ${rfi.rfi_number || `RFI-${rfi.id.slice(0, 8)}`}</div>
              <div><strong>Project:</strong> ${rfi.project_name || 'N/A'}</div>
              <div><strong>Date Created:</strong> ${new Date(rfi.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}</div>
              <div><strong>Time:</strong> ${new Date(rfi.created_at).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })}</div>
            </div>
          </div>

          <div class="status-priority">
            <span class="badge status-${rfi.status}">${rfi.status.replace('_', ' ').toUpperCase()}</span>
            <span class="badge priority-${rfi.priority}">${rfi.priority.toUpperCase()} PRIORITY</span>
            ${rfi.category ? `<span class="badge" style="background: #e0e7ff; color: #3730a3;">${rfi.category}</span>` : ''}
          </div>

          <div class="meta-grid">
            <div class="field">
              <div class="label">From</div>
              <div class="content">${rfi.sender_name || rfi.raised_by_profile?.name || 'N/A'}</div>
              ${rfi.sender_email ? `<div class="content" style="font-size: 14px; color: #64748b;">${rfi.sender_email}</div>` : ''}
            </div>
            
            <div class="field">
              <div class="label">To</div>
              <div class="content">${rfi.recipient_name || rfi.assigned_to_profile?.name || 'Unassigned'}</div>
              ${rfi.recipient_email ? `<div class="content" style="font-size: 14px; color: #64748b;">${rfi.recipient_email}</div>` : ''}
            </div>
          </div>

          ${rfi.subject ? `
          <div class="field">
            <div class="label">Subject</div>
            <div class="content">${rfi.subject}</div>
          </div>
          ` : ''}

          <div class="field">
            <div class="label">Question/Request</div>
            <div class="content">${rfi.question}</div>
          </div>

          ${rfi.drawing_no || rfi.specification_section || rfi.contract_clause ? `
          <div class="divider"></div>
          <h3 style="margin: 20px 0 15px 0; color: #1e293b;">Reference Information</h3>
          <div class="meta-grid">
            ${rfi.drawing_no ? `
            <div class="field">
              <div class="label">Drawing Number</div>
              <div class="content">${rfi.drawing_no}</div>
            </div>
            ` : ''}
            ${rfi.specification_section ? `
            <div class="field">
              <div class="label">Specification Section</div>
              <div class="content">${rfi.specification_section}</div>
            </div>
            ` : ''}
            ${rfi.contract_clause ? `
            <div class="field">
              <div class="label">Contract Clause</div>
              <div class="content">${rfi.contract_clause}</div>
            </div>
            ` : ''}
          </div>
          ` : ''}

          ${rfi.proposed_solution ? `
          <div class="field">
            <div class="label">Proposed Solution</div>
            <div class="content">${rfi.proposed_solution}</div>
          </div>
          ` : ''}

          ${rfi.due_date || rfi.required_response_by ? `
          <div class="field">
            <div class="label">Response Required By</div>
            <div class="content">${new Date(rfi.due_date || rfi.required_response_by).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}</div>
          </div>
          ` : ''}

          ${rfi.response ? `
          <div class="divider"></div>
          <div class="response-section">
            <div class="label" style="margin-bottom: 15px;">Response</div>
            <div class="content">${rfi.response}</div>
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
              <div style="font-size: 14px; color: #64748b;">
                <strong>Responded by:</strong> ${rfi.responder_name || 'N/A'}<br>
                <strong>Response Date:</strong> ${rfi.response_date ? new Date(rfi.response_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : 'N/A'}
              </div>
            </div>
          </div>
          ` : `
          <div class="response-section">
            <div class="label">Response Status</div>
            <div class="content" style="color: #64748b; font-style: italic;">Awaiting response</div>
          </div>
          `}

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 12px;">
            Generated on ${new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}
          </div>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

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
              <h3 className="text-lg font-semibold mb-2">RFIs</h3>
              <p className="text-muted-foreground mb-4">
                No projects available. Create a project first to create an RFI.
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
        <div className="text-center">Loading RFIs...</div>
      </div>;
  }

  if (!selectedProject) {
    return <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <h3 className="text-lg font-semibold mb-2">No Project Selected</h3>
            <p className="text-muted-foreground mb-4">
              Please select a project to view RFIs.
            </p>
          </CardContent>
        </Card>
      </div>;
  }

  return <div className="space-y-6">
      {/* Debug validators - only show in development */}
      {showDebug && (
        <div className="space-y-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800">Debug Mode - RFI System Validators</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ProjectScopeValidator 
              projectId={selectedProject?.id || ''}
              rfis={rfis}
              onViolationFound={(violation) => console.error('Project scope violation:', violation)}
            />
            <RFIPermissionsValidator 
              projectId={selectedProject?.id || ''}
              projectUsers={projectUsers}
            />
            <RFIEnhancementsValidator rfis={projectRFIs} />
          </div>
        </div>
      )}

      {/* Three-Column Layout */}
      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-200px)]">
        {/* Left Column - Navigation Sidebar (~20% width) */}
        <div className="col-span-2">
          <div className="h-full border border-muted rounded-lg bg-muted/10 p-3 overflow-hidden">
            <h3 className="text-xs font-medium text-muted-foreground/70 mb-4 uppercase tracking-wide">
              RFI Filters
            </h3>
            <nav className="space-y-1">
              <button
                onClick={() => setSidebarFilter('all')}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                  sidebarFilter === 'all'
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Archive className="h-4 w-4" />
                All
              </button>
              <button
                onClick={() => setSidebarFilter('inbox')}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                  sidebarFilter === 'inbox'
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Inbox className="h-4 w-4" />
                Inbox
              </button>
              <button
                onClick={() => setSidebarFilter('sent')}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                  sidebarFilter === 'sent'
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Send className="h-4 w-4" />
                Sent
              </button>
              <button
                onClick={() => setSidebarFilter('draft')}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                  sidebarFilter === 'draft'
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <FileEdit className="h-4 w-4" />
                Draft
              </button>
            </nav>
          </div>
        </div>

        {/* Center-Right Column - RFI List (Expanded, ~75-80% width) */}
        <div className="col-span-10 relative">
          {/* Backdrop overlay when detail panel is open */}
          {isDetailOverlayOpen && (
            <div 
              className="absolute inset-0 bg-black/20 backdrop-blur-sm z-10 transition-all duration-300"
              onClick={handleCloseDetailOverlay}
            />
          )}
          
          <div className={`h-full border rounded-lg bg-card p-4 overflow-hidden transition-all duration-300 ${
            isDetailOverlayOpen ? 'brightness-75' : ''
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">RFI List</h2>
              <Button onClick={() => setSimplifiedComposerOpen(true)} size="sm">
                Create RFI
              </Button>
            </div>
            <div className="overflow-y-auto h-full">
              <RFIListView 
                rfis={projectRFIs}
                onView={handleViewRFI}
                onExportPDF={handleExportPDF}
                onSelectRFI={setSelectedRFIForDetail}
                selectedRFI={selectedRFIForDetail}
                onDoubleClick={handleDoubleClickRFI}
              />
            </div>
          </div>

          {/* Slide-over Detail Panel */}
          {isDetailOverlayOpen && (
            <div className="absolute top-0 right-0 h-full w-1/2 bg-card border-l border-border shadow-2xl z-20 animate-slide-in-right overflow-hidden">
              <RFIDetailPanel 
                rfi={overlaySelectedRFI} 
                onClose={handleCloseDetailOverlay}
              />
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <SimplifiedRFIComposer
        open={simplifiedComposerOpen}
        onOpenChange={(open) => {
          setSimplifiedComposerOpen(open);
          if (!open) setReplyToRFI(null);
        }}
        projectId={selectedProject?.id || ''}
        replyToRFI={replyToRFI}
      />

      <RFIMessageComposer
        open={messageComposerOpen}
        onOpenChange={setMessageComposerOpen}
        projectId={selectedProject?.id || ''}
        linkedRFI={selectedRFI}
      />

      <RFIDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        rfi={selectedRFI}
      />
    </div>;
};

export default RFIs;