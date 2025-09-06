import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';
import { useRFIs, RFI } from '@/hooks/useRFIs';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { RFICard } from '@/components/rfis/RFICard';
import { CreateRFIDialog } from '@/components/rfis/CreateRFIDialog';
import { RFIDetailsDialog } from '@/components/rfis/RFIDetailsDialog';
import { RFIFilters } from '@/components/rfis/RFIFilters';
import { RFIListView } from '@/components/rfis/RFIListView';
import { useProjectTeam } from '@/hooks/useProjectTeam';

const RFIs = () => {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedRFI, setSelectedRFI] = useState<RFI | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [projectUsers, setProjectUsers] = useState<any[]>([]);

  const { projects } = useProjects();
  const { profile } = useAuth();
  const currentProject = projects.find(p => p.id === selectedProject) || projects[0];
  const { rfis, loading, updateRFI } = useRFIs(currentProject?.id);
  const { teamMembers } = useProjectTeam(currentProject?.id || '');

  // Update project users from teamMembers
  React.useEffect(() => {
    setProjectUsers(teamMembers);
  }, [teamMembers]);

  // Filter RFIs based on search and filters
  const filteredRFIs = useMemo(() => {
    return rfis.filter(rfi => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!rfi.question.toLowerCase().includes(query) &&
            !rfi.category?.toLowerCase().includes(query) &&
            !rfi.raised_by_profile?.name?.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'all' && rfi.status !== statusFilter) {
        return false;
      }

      // Priority filter
      if (priorityFilter !== 'all' && rfi.priority !== priorityFilter) {
        return false;
      }

      // Assignee filter
      if (assigneeFilter !== 'all') {
        if (assigneeFilter === 'unassigned' && rfi.assigned_to) {
          return false;
        }
        if (assigneeFilter !== 'unassigned' && rfi.assigned_to !== assigneeFilter) {
          return false;
        }
      }

      return true;
    });
  }, [rfis, searchQuery, statusFilter, priorityFilter, assigneeFilter]);

  const handleViewRFI = (rfi: RFI) => {
    setSelectedRFI(rfi);
    setDetailsDialogOpen(true);
  };

  const handleEditRFI = (rfi: RFI) => {
    // For now, just open details dialog
    // In a full implementation, you might want a separate edit dialog
    setSelectedRFI(rfi);
    setDetailsDialogOpen(true);
  };

  const handleAssignRFI = async (rfi: RFI) => {
    // In a full implementation, you'd show an assignment dialog
    // For now, we'll just auto-assign to the first architect
    const architect = teamMembers.find(user => user.role === 'architect');
    if (architect) {
      await updateRFI(rfi.id, { assigned_to: architect.user_id, status: 'in_review' });
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setAssigneeFilter('all');
  };

  const handleExportPDF = (rfi: RFI) => {
    // Create a simple PDF export by opening print dialog
    const printContent = `
      <html>
        <head>
          <title>RFI ${rfi.rfi_number || rfi.id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .field { margin: 10px 0; }
            .label { font-weight: bold; }
            .content { margin-top: 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Request for Information</h1>
            <p><strong>RFI Number:</strong> ${rfi.rfi_number || rfi.id}</p>
            <p><strong>Project:</strong> ${rfi.project_name || 'N/A'}</p>
            <p><strong>Date:</strong> ${new Date(rfi.created_at).toLocaleDateString()}</p>
          </div>
          
          <div class="field">
            <div class="label">From:</div>
            <div class="content">${rfi.sender_name || rfi.raised_by_profile?.name || 'N/A'}</div>
          </div>
          
          <div class="field">
            <div class="label">To:</div>
            <div class="content">${rfi.recipient_name || rfi.assigned_to_profile?.name || 'N/A'}</div>
          </div>
          
          <div class="field">
            <div class="label">Subject:</div>
            <div class="content">${rfi.subject || 'N/A'}</div>
          </div>
          
          <div class="field">
            <div class="label">Priority:</div>
            <div class="content">${rfi.priority.toUpperCase()}</div>
          </div>
          
          <div class="field">
            <div class="label">Question/Request:</div>
            <div class="content">${rfi.question}</div>
          </div>
          
          ${rfi.proposed_solution ? `
          <div class="field">
            <div class="label">Proposed Solution:</div>
            <div class="content">${rfi.proposed_solution}</div>
          </div>
          ` : ''}
          
          ${rfi.response ? `
          <div class="field">
            <div class="label">Response:</div>
            <div class="content">${rfi.response}</div>
            <div class="content"><strong>Response Date:</strong> ${rfi.response_date ? new Date(rfi.response_date).toLocaleDateString() : 'N/A'}</div>
          </div>
          ` : ''}
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading RFIs...</div>
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
              You need to be part of a project to manage RFIs.
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
          <h1 className="text-3xl font-bold">RFIs</h1>
          <p className="text-muted-foreground">
            Manage requests for information for {currentProject.name}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'cards' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('cards')}
          >
            Cards
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            List
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New RFI
          </Button>
        </div>
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

      {/* RFI Management */}
      <div className="space-y-6">
        {/* Filters */}
        <RFIFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          priorityFilter={priorityFilter}
          onPriorityFilterChange={setPriorityFilter}
          assigneeFilter={assigneeFilter}
          onAssigneeFilterChange={setAssigneeFilter}
          projectUsers={projectUsers}
          onClearFilters={clearFilters}
        />

        {/* RFI Display */}
        {filteredRFIs.length > 0 ? (
          viewMode === 'list' ? (
            <RFIListView
              rfis={filteredRFIs}
              onView={handleViewRFI}
              onExportPDF={handleExportPDF}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRFIs.map((rfi) => (
                <RFICard
                  key={rfi.id}
                  rfi={rfi}
                  onView={handleViewRFI}
                  onEdit={profile?.role === 'architect' ? handleEditRFI : undefined}
                  onAssign={profile?.role === 'architect' ? handleAssignRFI : undefined}
                />
              ))}
            </div>
          )
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2">No RFIs Found</h3>
              <p className="text-muted-foreground mb-4">
                {rfis.length === 0
                  ? "No RFIs have been created for this project yet."
                  : "No RFIs match your current filters."
                }
              </p>
              {rfis.length === 0 && (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  Create First RFI
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialogs */}
      <CreateRFIDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        projectId={currentProject.id}
      />

      <RFIDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        rfi={selectedRFI}
      />
    </div>
  );
};

export default RFIs;