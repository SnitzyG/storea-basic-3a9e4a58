import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Calendar as CalendarIcon, X, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface CreateProjectDialogProps {
  children?: React.ReactNode;
}

interface Collaborator {
  email: string;
  name: string;
  role: 'homeowner' | 'contractor' | 'builder';
}

export const CreateProjectDialog = ({ children }: CreateProjectDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    budget: '',
    description: '',
    estimated_start_date: undefined as Date | undefined,
    estimated_finish_date: undefined as Date | undefined,
    homeowner_name: '',
    homeowner_phone: '',
    homeowner_email: ''
  });
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [newCollaborator, setNewCollaborator] = useState<{
    email: string;
    name: string;
    role: 'homeowner' | 'contractor' | 'builder';
  }>({
    email: '',
    name: '',
    role: 'contractor'
  });
  const [loading, setLoading] = useState(false);
  const { createProject } = useProjects();
  const { profile } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation for required fields
    if (!formData.estimated_start_date || !formData.estimated_finish_date || !formData.homeowner_name || !formData.homeowner_phone || !formData.homeowner_email) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields including dates, homeowner name, phone number, and email.",
        variant: "destructive"
      });
      return;
    }

    // Validate phone number format
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(formData.homeowner_phone.replace(/\s+/g, ''))) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number.",
        variant: "destructive"
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.homeowner_email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      const project = await createProject({
        name: formData.name,
        address: formData.address || undefined,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        description: formData.description || undefined,
        estimated_start_date: formData.estimated_start_date.toISOString().split('T')[0],
        estimated_finish_date: formData.estimated_finish_date.toISOString().split('T')[0],
        homeowner_name: formData.homeowner_name,
        homeowner_phone: formData.homeowner_phone,
        homeowner_email: formData.homeowner_email,
        collaborators
      });
      
      setFormData({ 
        name: '', 
        address: '', 
        budget: '', 
        description: '',
        estimated_start_date: undefined,
        estimated_finish_date: undefined,
        homeowner_name: '',
        homeowner_phone: '',
        homeowner_email: ''
      });
      setCollaborators([]);
      setNewCollaborator({ email: '', name: '', role: 'contractor' });
      setOpen(false);
    } catch (error: any) {
      // Additional error handling for specific cases
      if (error.message?.includes('policy')) {
        toast({
          title: "Permission Denied",
          description: "You don't have permission to create projects. Only architects can create projects.",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | Date | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addCollaborator = () => {
    if (newCollaborator.email && newCollaborator.name) {
      setCollaborators(prev => [...prev, newCollaborator]);
      setNewCollaborator({ email: '', name: '', role: 'contractor' });
    }
  };

  const removeCollaborator = (index: number) => {
    setCollaborators(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Project
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Add a new project to your portfolio. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter project name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter project address"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter project description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Budget</Label>
              <Input
                id="budget"
                type="number"
                step="0.01"
                value={formData.budget}
                onChange={(e) => handleInputChange('budget', e.target.value)}
                placeholder="Enter budget amount"
              />
            </div>
          </div>

          {/* Project Timeline */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Project Timeline</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estimated Start Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.estimated_start_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.estimated_start_date ? (
                        format(formData.estimated_start_date, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.estimated_start_date}
                      onSelect={(date) => handleInputChange('estimated_start_date', date)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Estimated Finish Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.estimated_finish_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.estimated_finish_date ? (
                        format(formData.estimated_finish_date, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.estimated_finish_date}
                      onSelect={(date) => handleInputChange('estimated_finish_date', date)}
                      disabled={(date) =>
                        formData.estimated_start_date ? date < formData.estimated_start_date : false
                      }
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Homeowner Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Homeowner Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="homeowner_name">Homeowner Name *</Label>
                <Input
                  id="homeowner_name"
                  value={formData.homeowner_name}
                  onChange={(e) => handleInputChange('homeowner_name', e.target.value)}
                  placeholder="Enter homeowner name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="homeowner_email">Homeowner Email *</Label>
                <Input
                  id="homeowner_email"
                  type="email"
                  value={formData.homeowner_email}
                  onChange={(e) => handleInputChange('homeowner_email', e.target.value)}
                  placeholder="Enter homeowner email"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="homeowner_phone">Homeowner Phone *</Label>
              <Input
                id="homeowner_phone"
                type="tel"
                value={formData.homeowner_phone}
                onChange={(e) => handleInputChange('homeowner_phone', e.target.value)}
                placeholder="Enter phone number"
                required
              />
            </div>
          </div>

          {/* Project Collaborators */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Project Collaborators</h3>
            
            {/* Add New Collaborator */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <UserPlus className="h-4 w-4" />
                  Add Collaborator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="collaborator_email">Email</Label>
                    <Input
                      id="collaborator_email"
                      type="email"
                      value={newCollaborator.email}
                      onChange={(e) => setNewCollaborator(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="collaborator_name">Name</Label>
                    <Input
                      id="collaborator_name"
                      value={newCollaborator.name}
                      onChange={(e) => setNewCollaborator(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="collaborator_role">Role</Label>
                    <Select
                      value={newCollaborator.role}
                      onValueChange={(value: 'homeowner' | 'contractor' | 'builder') => 
                        setNewCollaborator(prev => ({ ...prev, role: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="homeowner">Homeowner</SelectItem>
                        <SelectItem value="contractor">Contractor</SelectItem>
                        <SelectItem value="builder">Builder</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addCollaborator}
                  disabled={!newCollaborator.email || !newCollaborator.name}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Collaborator
                </Button>
              </CardContent>
            </Card>

            {/* Existing Collaborators */}
            {collaborators.length > 0 && (
              <div className="space-y-2">
                <Label>Added Collaborators</Label>
                <div className="space-y-2">
                  {collaborators.map((collaborator, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="font-medium">{collaborator.name}</p>
                            <p className="text-sm text-muted-foreground">{collaborator.email}</p>
                          </div>
                          <div className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                            {collaborator.role}
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCollaborator(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !formData.name || !formData.estimated_start_date || !formData.estimated_finish_date || !formData.homeowner_name || !formData.homeowner_phone || !formData.homeowner_email}
            >
              {loading ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};