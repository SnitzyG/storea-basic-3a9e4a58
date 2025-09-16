import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRFIs, RFI } from '@/hooks/useRFIs';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
// Import email-style components
import { EmailStyleRFIInbox } from '@/components/rfis/EmailStyleRFIInbox';
import { SimplifiedRFIComposer } from '@/components/rfis/SimplifiedRFIComposer';
import { RFIMessageComposer } from '@/components/messages/RFIMessageComposer';
// Legacy components for fallback
import { RFIDetailsDialog } from '@/components/rfis/RFIDetailsDialog';
import { useProjectTeam } from '@/hooks/useProjectTeam';
const RFIs = () => {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [simplifiedComposerOpen, setSimplifiedComposerOpen] = useState(false);
  const [messageComposerOpen, setMessageComposerOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedRFI, setSelectedRFI] = useState<RFI | null>(null);
  const [replyToRFI, setReplyToRFI] = useState<RFI | null>(null);
  const [projectUsers, setProjectUsers] = useState<any[]>([]);
  const {
    projects
  } = useProjects();
  const {
    profile
  } = useAuth();
  const currentProject = projects.find(p => p.id === selectedProject) || projects[0];
  const {
    rfis,
    loading,
    updateRFI
  } = useRFIs(currentProject?.id);
  const {
    teamMembers
  } = useProjectTeam(currentProject?.id || '');
  const location = useLocation();

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

  // All RFIs for the current project (no filters needed in new design)
  const projectRFIs = rfis;
  const handleViewRFI = (rfi: RFI) => {
    setSelectedRFI(rfi);
    setDetailsDialogOpen(true);
  };

  const handleReplyToRFI = (rfi: RFI) => {
    setReplyToRFI(rfi);
    setSimplifiedComposerOpen(true);
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
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading RFIs...</div>
      </div>;
  }

  if (projects.length === 0) {
    return <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>RFIs</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              No projects available. Create a project first to create an RFI.
            </p>
            <Button asChild>
              <Link to="/projects">Go to Projects</Link>
            </Button>
          </CardContent>
        </Card>
      </div>;
  }
  if (!currentProject) {
    return <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>RFIs</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              No projects available. Create a project first to create an RFI.
            </p>
            <Button asChild>
              <Link to="/projects">Go to Projects</Link>
            </Button>
          </CardContent>
        </Card>
      </div>;
  }
  return <div className="h-screen flex flex-col">
      <EmailStyleRFIInbox 
        rfis={projectRFIs} 
        onView={handleViewRFI} 
        onCreateNew={() => setSimplifiedComposerOpen(true)} 
        onReply={handleReplyToRFI}
        projectUsers={projectUsers} 
        currentProject={currentProject} 
      />

      <SimplifiedRFIComposer 
        open={simplifiedComposerOpen} 
        onOpenChange={(open) => {
          setSimplifiedComposerOpen(open);
          if (!open) setReplyToRFI(null);
        }} 
        projectId={currentProject.id}
        replyToRFI={replyToRFI}
      />

      <RFIMessageComposer
        open={messageComposerOpen}
        onOpenChange={setMessageComposerOpen}
        projectId={currentProject.id}
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