import { useState, useEffect } from 'react';
import { Project, useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { useViewEditMode } from '@/hooks/useViewEditMode';
import { ProjectContactsSection } from './ProjectContactsSection';
import { AddTeamMemberDialog } from './AddTeamMemberDialog';
import { UnifiedDialog } from '@/components/ui/unified-dialog';
import { ViewEditField } from '@/components/ui/view-edit-field';
import { CalendarDays, MapPin, DollarSign, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ProjectDetailsDialogProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusColors = {
  planning: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  on_hold: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800'
};

const statusLabels = {
  planning: 'Planning',
  active: 'Active',
  on_hold: 'On Hold',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

export const ProjectDetailsDialog = ({ 
  project, 
  open, 
  onOpenChange
}: ProjectDetailsDialogProps) => {
  const [formData, setFormData] = useState({
    name: '',
    project_reference_number: '',
    address: '',
    budget: '',
    description: '',
    status: 'planning' as 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
  });
  const [loading, setLoading] = useState(false);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [contactsKey, setContactsKey] = useState(0);
  
  const { updateProject } = useProjects();
  const { profile } = useAuth();
  const { toast } = useToast();
  const isArchitect = profile?.role === 'lead_consultant' || profile?.role === 'architect';
  
  const {
    mode,
    switchToView,
    switchToEdit,
    canEdit
  } = useViewEditMode({
    canEdit: isArchitect
  });

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        project_reference_number: project.project_reference_number || '',
        address: project.address || '',
        budget: project.budget?.toString() || '',
        description: project.description || '',
        status: project.status
      });
    }
  }, [project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    
    setLoading(true);
    try {
      await updateProject(project.id, {
        name: formData.name,
        project_reference_number: formData.project_reference_number || undefined,
        address: formData.address || undefined,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        description: formData.description || undefined,
        status: formData.status
      });
      
      switchToView();
    } catch (error) {
      // Error handled in useProjects hook
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUserRemove = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('project_users')
        .delete()
        .eq('project_id', project?.id)
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "User removed",
        description: "Team member has been removed from the project."
      });
      
      // Refresh contacts section and notify other components
      setContactsKey(prev => prev + 1);
      window.dispatchEvent(new CustomEvent('projectTeamUpdated'));
    } catch (error: any) {
      toast({
        title: "Error removing user",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleUserAdded = () => {
    // Refresh contacts section and notify other components
    setContactsKey(prev => prev + 1);
    window.dispatchEvent(new CustomEvent('projectTeamUpdated'));
  };

  if (!project) return null;

  const statusOptions = [
    { value: 'planning', label: 'Planning' },
    { value: 'active', label: 'Active' },
    { value: 'on_hold', label: 'On Hold' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const badges = [
    {
      text: statusLabels[project.status],
      className: statusColors[project.status]
    }
  ];

  const tabs = [
    {
      id: 'details',
      label: mode === 'edit' ? 'Project Details' : 'Project Details',
      content: mode === 'edit' ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <ViewEditField
            type="text"
            label="Project Reference"
            value={formData.project_reference_number}
            onChange={(value) => handleInputChange('project_reference_number', value)}
            mode={mode}
            placeholder="Your internal reference"
          />
          
          <ViewEditField
            type="text"
            label="Project Name"
            value={formData.name}
            onChange={(value) => handleInputChange('name', value)}
            mode={mode}
            required
          />
          
          <ViewEditField
            type="text"
            label="Address"
            value={formData.address}
            onChange={(value) => handleInputChange('address', value)}
            mode={mode}
            placeholder="Enter project address"
          />
          
          <div className="grid grid-cols-2 gap-4">
            <ViewEditField
              type="number"
              label="Budget"
              value={formData.budget}
              onChange={(value) => handleInputChange('budget', value)}
              mode={mode}
              step="0.01"
            />
            
            <ViewEditField
              type="select"
              label="Status"
              value={formData.status}
              onChange={(value) => handleInputChange('status', value)}
              mode={mode}
              options={statusOptions}
            />
          </div>
          
          <ViewEditField
            type="textarea"
            label="Description"
            value={formData.description}
            onChange={(value) => handleInputChange('description', value)}
            mode={mode}
            rows={3}
          />
        </form>
      ) : (
        <div className="space-y-6">
          {/* Project Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-xl font-semibold">{project.name}</h3>
              {project.project_reference_number && (
                <p className="text-sm text-muted-foreground">
                  Reference: {project.project_reference_number}
                </p>
              )}
              <ViewEditField
                type="display"
                label=""
                value={project.address || 'No address specified'}
                mode={mode}
                icon={<MapPin className="h-4 w-4 text-muted-foreground" />}
              />
            </div>
          </div>
          
          {/* Project Details */}
          <div className="grid grid-cols-2 gap-4">
            {project.budget && (
              <ViewEditField
                type="display"
                label=""
                value={`$${project.budget.toLocaleString()}`}
                mode={mode}
                icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
              />
            )}
            <ViewEditField
              type="display"
              label=""
              value={`Created ${new Date(project.created_at).toLocaleDateString()}`}
              mode={mode}
              icon={<CalendarDays className="h-4 w-4 text-muted-foreground" />}
            />
          </div>
          
          {/* Description */}
          {project.description && (
            <ViewEditField
              type="display"
              label="Description"
              value={project.description}
              mode={mode}
            />
          )}
        </div>
      )
    },
    {
      id: 'team',
      label: mode === 'edit' ? 'Team Management' : 'Team & Contacts',
      content: (
        <ProjectContactsSection
          key={contactsKey}
          projectId={project.id}
          isEditing={mode === 'edit'}
          onUserRemove={mode === 'edit' ? handleUserRemove : undefined}
          onUserAdd={mode === 'edit' ? () => setAddUserOpen(true) : undefined}
        />
      )
    }
  ];

  return (
    <>
      <UnifiedDialog
        title="Project Details"
        description="project information and team"
        open={open}
        onOpenChange={onOpenChange}
        mode={mode}
        onModeChange={switchToEdit}
        canEdit={canEdit}
        loading={loading}
        badges={badges}
        onSave={() => handleSubmit({} as React.FormEvent)}
        onCancel={switchToView}
        maxWidth="4xl"
        tabs={tabs}
      />
      
      <AddTeamMemberDialog
        open={addUserOpen}
        onOpenChange={setAddUserOpen}
        projectId={project?.id || ''}
        projectName={project?.name || 'Project'}
        onMemberAdded={async () => {
          handleUserAdded();
          return true;
        }}
      />
    </>
  );
};