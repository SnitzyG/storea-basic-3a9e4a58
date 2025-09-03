import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Project, useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { ProjectContactsSection } from './ProjectContactsSection';
import { AddUserDialog } from './AddUserDialog';
import { CalendarDays, MapPin, DollarSign, User, Edit, Save, X, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ProjectDetailsDialogProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'view' | 'edit';
  onModeChange: (mode: 'view' | 'edit') => void;
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
  onOpenChange, 
  mode, 
  onModeChange 
}: ProjectDetailsDialogProps) => {
  const [formData, setFormData] = useState({
    name: '',
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
  const isArchitect = profile?.role === 'architect';

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
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
        address: formData.address || undefined,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        description: formData.description || undefined,
        status: formData.status
      });
      
      onModeChange('view');
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
      
      // Refresh contacts section
      setContactsKey(prev => prev + 1);
    } catch (error: any) {
      toast({
        title: "Error removing user",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleUserAdded = () => {
    // Refresh contacts section
    setContactsKey(prev => prev + 1);
  };

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{mode === 'edit' ? 'Edit Project' : 'Project Details'}</DialogTitle>
              <DialogDescription>
                {mode === 'edit' ? 'Update project information and manage team' : 'View project details and team'}
              </DialogDescription>
            </div>
            {isArchitect && mode === 'view' && (
              <Button variant="outline" size="sm" onClick={() => onModeChange('edit')}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </DialogHeader>
        
        {mode === 'view' ? (
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Project Details</TabsTrigger>
              <TabsTrigger value="team">Team & Contacts</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-6 mt-6">
              {/* Project Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold">{project.name}</h3>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {project.address || 'No address specified'}
                  </div>
                </div>
                <Badge className={statusColors[project.status]}>
                  {statusLabels[project.status]}
                </Badge>
              </div>
              
              {/* Project Details */}
              <div className="grid grid-cols-2 gap-4">
                {project.budget && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">${project.budget.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              
              {/* Description */}
              {project.description && (
                <div className="space-y-2">
                  <Label>Description</Label>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    {project.description}
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="team" className="mt-6">
              <ProjectContactsSection
                key={contactsKey}
                projectId={project.id}
                isEditing={false}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Project Details</TabsTrigger>
              <TabsTrigger value="team">Team Management</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="mt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budget">Budget</Label>
                    <Input
                      id="budget"
                      type="number"
                      step="0.01"
                      value={formData.budget}
                      onChange={(e) => handleInputChange('budget', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planning">Planning</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="on_hold">On Hold</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => onModeChange('view')}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="team" className="mt-6">
              <ProjectContactsSection
                key={contactsKey}
                projectId={project.id}
                isEditing={true}
                onUserRemove={handleUserRemove}
                onUserAdd={() => setAddUserOpen(true)}
              />
            </TabsContent>
          </Tabs>
        )}
        
        <AddUserDialog
          open={addUserOpen}
          onOpenChange={setAddUserOpen}
          projectId={project?.id || ''}
          onUserAdded={handleUserAdded}
        />
      </DialogContent>
    </Dialog>
  );
};