import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Star, 
  StarOff,
  Settings,
  Search,
  Filter
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface RFITemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  is_favorite: boolean;
  is_shared: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  template_data: {
    subject?: string;
    question: string;
    drawing_no?: string;
    specification_section?: string;
    contract_clause?: string;
    other_reference?: string;
    proposed_solution?: string;
    required_response_by?: number; // days from creation
  };
  usage_count: number;
  created_by_profile?: {
    name: string;
    role: string;
  };
}

interface RFITemplateManagerProps {
  onSelectTemplate?: (template: RFITemplate) => void;
  mode?: 'select' | 'manage';
}

export function RFITemplateManager({ onSelectTemplate, mode = 'manage' }: RFITemplateManagerProps) {
  const [templates, setTemplates] = useState<RFITemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<RFITemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<RFITemplate | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const [newTemplate, setNewTemplate] = useState<Partial<RFITemplate>>({
    name: '',
    description: '',
    category: 'Technical',
    priority: 'medium',
    is_favorite: false,
    is_shared: false,
    template_data: {
      subject: '',
      question: '',
      drawing_no: '',
      specification_section: '',
      contract_clause: '',
      other_reference: '',
      proposed_solution: '',
      required_response_by: 7
    }
  });

  const categories = [
    'Technical', 'Design', 'Material', 'Schedule', 'Cost', 
    'Site', 'Safety', 'Quality', 'Environmental', 'General'
  ];

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('rfi_templates')
        .select(`
          *,
          created_by_profile:profiles!created_by (
            name,
            role
          )
        `)
        .or(`created_by.eq.${user?.id},is_shared.eq.true`)
        .order('usage_count', { ascending: false });

      if (error) throw error;

      setTemplates(data || []);
      setFilteredTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error",
        description: "Failed to fetch RFI templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async () => {
    if (!user || !newTemplate.name || !newTemplate.template_data?.question) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('rfi_templates')
        .insert({
          ...newTemplate,
          created_by: user.id,
          usage_count: 0
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "RFI template created successfully",
      });

      setCreateDialogOpen(false);
      resetNewTemplate();
      fetchTemplates();
    } catch (error) {
      console.error('Error creating template:', error);
      toast({
        title: "Error",
        description: "Failed to create template",
        variant: "destructive",
      });
    }
  };

  const updateTemplate = async (template: RFITemplate) => {
    try {
      const { error } = await supabase
        .from('rfi_templates')
        .update({
          name: template.name,
          description: template.description,
          category: template.category,
          priority: template.priority,
          is_favorite: template.is_favorite,
          is_shared: template.is_shared,
          template_data: template.template_data,
          updated_at: new Date().toISOString()
        })
        .eq('id', template.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Template updated successfully",
      });

      setEditingTemplate(null);
      fetchTemplates();
    } catch (error) {
      console.error('Error updating template:', error);
      toast({
        title: "Error",
        description: "Failed to update template",
        variant: "destructive",
      });
    }
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('rfi_templates')
        .delete()
        .eq('id', templateId)
        .eq('created_by', user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Template deleted successfully",
      });

      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    }
  };

  const toggleFavorite = async (template: RFITemplate) => {
    try {
      const { error } = await supabase
        .from('rfi_templates')
        .update({ is_favorite: !template.is_favorite })
        .eq('id', template.id);

      if (error) throw error;

      fetchTemplates();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const useTemplate = async (template: RFITemplate) => {
    try {
      // Increment usage count
      await supabase
        .from('rfi_templates')
        .update({ usage_count: template.usage_count + 1 })
        .eq('id', template.id);

      if (onSelectTemplate) {
        onSelectTemplate(template);
      }

      toast({
        title: "Template Selected",
        description: `Using template: ${template.name}`,
      });
    } catch (error) {
      console.error('Error using template:', error);
    }
  };

  const duplicateTemplate = async (template: RFITemplate) => {
    try {
      const { data, error } = await supabase
        .from('rfi_templates')
        .insert({
          name: `${template.name} (Copy)`,
          description: template.description,
          category: template.category,
          priority: template.priority,
          is_favorite: false,
          is_shared: false,
          created_by: user?.id,
          template_data: template.template_data,
          usage_count: 0
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Template duplicated successfully",
      });

      fetchTemplates();
    } catch (error) {
      console.error('Error duplicating template:', error);
      toast({
        title: "Error",
        description: "Failed to duplicate template",
        variant: "destructive",
      });
    }
  };

  const resetNewTemplate = () => {
    setNewTemplate({
      name: '',
      description: '',
      category: 'Technical',
      priority: 'medium',
      is_favorite: false,
      is_shared: false,
      template_data: {
        subject: '',
        question: '',
        drawing_no: '',
        specification_section: '',
        contract_clause: '',
        other_reference: '',
        proposed_solution: '',
        required_response_by: 7
      }
    });
  };

  // Filter templates based on search and filters
  useEffect(() => {
    let filtered = templates;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.template_data.question.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter && categoryFilter !== 'all') {
      filtered = filtered.filter(template => template.category === categoryFilter);
    }

    // Favorites filter
    if (showFavoritesOnly) {
      filtered = filtered.filter(template => template.is_favorite);
    }

    setFilteredTemplates(filtered);
  }, [templates, searchQuery, categoryFilter, showFavoritesOnly]);

  useEffect(() => {
    fetchTemplates();
  }, [user]);

  if (loading) {
    return <div className="p-4 text-center text-muted-foreground">Loading templates...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">RFI Templates</h2>
          <p className="text-muted-foreground">
            {mode === 'select' ? 'Choose a template to get started' : 'Manage your RFI templates'}
          </p>
        </div>
        {mode === 'manage' && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create RFI Template</DialogTitle>
                <DialogDescription>
                  Create a reusable template for common RFI scenarios
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="template-name">Template Name *</Label>
                    <Input
                      id="template-name"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Structural Detail Clarification"
                    />
                  </div>
                  <div>
                    <Label htmlFor="template-category">Category</Label>
                    <Select 
                      value={newTemplate.category} 
                      onValueChange={(value) => setNewTemplate(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="template-description">Description</Label>
                  <Textarea
                    id="template-description"
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of when to use this template"
                  />
                </div>

                <Separator />

                <div>
                  <Label htmlFor="template-question">Question/Description *</Label>
                  <Textarea
                    id="template-question"
                    value={newTemplate.template_data?.question}
                    onChange={(e) => setNewTemplate(prev => ({
                      ...prev,
                      template_data: { ...prev.template_data, question: e.target.value }
                    }))}
                    placeholder="The main question or description for the RFI"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="template-subject">Subject Template</Label>
                    <Input
                      id="template-subject"
                      value={newTemplate.template_data?.subject}
                      onChange={(e) => setNewTemplate(prev => ({
                        ...prev,
                        template_data: { ...prev.template_data, subject: e.target.value }
                      }))}
                      placeholder="RFI subject template"
                    />
                  </div>
                  <div>
                    <Label htmlFor="template-priority">Default Priority</Label>
                    <Select 
                      value={newTemplate.priority} 
                      onValueChange={(value: any) => setNewTemplate(prev => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button onClick={createTemplate} className="flex-1">
                    Create Template
                  </Button>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant={showFavoritesOnly ? "default" : "outline"}
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
        >
          <Star className="h-4 w-4 mr-2" />
          Favorites Only
        </Button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{template.category}</Badge>
                    <Badge variant="outline" className="text-xs capitalize">{template.priority}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFavorite(template)}
                  >
                    {template.is_favorite ? 
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /> : 
                      <StarOff className="h-4 w-4" />
                    }
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {template.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {template.description}
                </p>
              )}
              
              <p className="text-sm line-clamp-3">
                {template.template_data.question}
              </p>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Used {template.usage_count} times</span>
                <span>By {template.created_by_profile?.name}</span>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={() => useTemplate(template)}
                  className="flex-1"
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Use
                </Button>
                {mode === 'manage' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => duplicateTemplate(template)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    {template.created_by === user?.id && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingTemplate(template)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteTemplate(template.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No templates found</h3>
          <p className="text-muted-foreground">
            {searchQuery || categoryFilter !== 'all' || showFavoritesOnly
              ? 'Try adjusting your filters'
              : mode === 'manage' 
                ? 'Create your first RFI template to get started'
                : 'No templates are available yet'
            }
          </p>
        </div>
      )}
    </div>
  );
}