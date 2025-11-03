import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, Copy, Save, Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AdvancedProject } from '@/hooks/useAdvancedProjects';

interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  project_type: string;
  created_by: string;
  is_public?: boolean;
}

interface ProjectTemplateManagerProps {
  templates: ProjectTemplate[];
  currentProject?: AdvancedProject;
  onCreateFromTemplate: (template: ProjectTemplate, newName: string) => Promise<void>;
  onSaveAsTemplate: (project: AdvancedProject, templateName: string, description: string) => Promise<void>;
  onCloneProject: (projectId: string, newName: string, includeTeam: boolean) => Promise<void>;
}

export const ProjectTemplateManager: React.FC<ProjectTemplateManagerProps> = ({
  templates,
  currentProject,
  onCreateFromTemplate,
  onSaveAsTemplate,
  onCloneProject
}) => {
  const { toast } = useToast();
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isSaveTemplateDialogOpen, setIsSaveTemplateDialogOpen] = useState(false);
  const [isCloneDialogOpen, setIsCloneDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [includeTeam, setIncludeTeam] = useState(false);

  const handleCreateFromTemplate = async () => {
    if (!selectedTemplate || !newProjectName) {
      toast({
        title: "Missing information",
        description: "Please select a template and enter a project name",
        variant: "destructive"
      });
      return;
    }

    try {
      await onCreateFromTemplate(selectedTemplate, newProjectName);
      setIsTemplateDialogOpen(false);
      setNewProjectName('');
      setSelectedTemplate(null);
    } catch (error) {
      console.error('Error creating project from template:', error);
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!currentProject || !templateName) {
      toast({
        title: "Missing information",
        description: "Please enter a template name",
        variant: "destructive"
      });
      return;
    }

    try {
      await onSaveAsTemplate(currentProject, templateName, templateDescription);
      setIsSaveTemplateDialogOpen(false);
      setTemplateName('');
      setTemplateDescription('');
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handleCloneProject = async () => {
    if (!currentProject || !newProjectName) {
      toast({
        title: "Missing information",
        description: "Please enter a new project name",
        variant: "destructive"
      });
      return;
    }

    try {
      await onCloneProject(currentProject.id, newProjectName, includeTeam);
      setIsCloneDialogOpen(false);
      setNewProjectName('');
      setIncludeTeam(false);
    } catch (error) {
      console.error('Error cloning project:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Template Actions */}
      <div className="flex gap-2">
        {/* Create from Template */}
        <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Use Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Project from Template</DialogTitle>
              <DialogDescription>
                Select a template to quickly create a new project with pre-configured settings
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 max-h-[300px] overflow-y-auto">
                {templates.map((template) => (
                  <Card
                    key={template.id}
                    className={`cursor-pointer transition-all ${
                      selectedTemplate?.id === template.id
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <CardHeader className="p-4">
                      <CardTitle className="text-sm">{template.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {template.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <Badge variant="secondary" className="text-xs">
                        {template.project_type}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="space-y-2">
                <Label>New Project Name</Label>
                <Input
                  placeholder="Enter project name..."
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateFromTemplate}>
                Create Project
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Save as Template */}
        {currentProject && (
          <Dialog open={isSaveTemplateDialogOpen} onOpenChange={setIsSaveTemplateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Save className="h-4 w-4 mr-2" />
                Save as Template
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Project as Template</DialogTitle>
                <DialogDescription>
                  Create a reusable template from this project
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Template Name</Label>
                  <Input
                    placeholder="e.g., Modern Residential Build"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    placeholder="Brief description of template..."
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsSaveTemplateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveAsTemplate}>
                  Save Template
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Clone Project */}
        {currentProject && (
          <Dialog open={isCloneDialogOpen} onOpenChange={setIsCloneDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Copy className="h-4 w-4 mr-2" />
                Clone Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Clone Project</DialogTitle>
                <DialogDescription>
                  Create a copy of "{currentProject.name}"
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>New Project Name</Label>
                  <Input
                    placeholder="Enter new project name..."
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="includeTeam"
                    checked={includeTeam}
                    onChange={(e) => setIncludeTeam(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="includeTeam" className="cursor-pointer">
                    Include team members
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCloneDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCloneProject}>
                  Clone Project
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};
