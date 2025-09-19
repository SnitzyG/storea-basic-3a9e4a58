import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Shield, 
  Plus, 
  User, 
  Building, 
  FileText, 
  Award, 
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  Edit
} from 'lucide-react';
import { ContractorPrequalification } from '@/hooks/useEnhancedTenders';
import { formatDistanceToNow } from 'date-fns';

interface ContractorPrequalificationPanelProps {
  projectId: string;
  userRole: string;
  prequalifications: ContractorPrequalification[];
}

export const ContractorPrequalificationPanel = ({ 
  projectId, 
  userRole, 
  prequalifications 
}: ContractorPrequalificationPanelProps) => {
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [viewingPrequalification, setViewingPrequalification] = useState<ContractorPrequalification | null>(null);
  
  const [prequalForm, setPrequalForm] = useState({
    experience_years: '',
    certifications: [] as any[],
    previous_projects: [] as any[],
    financial_capacity: '',
    insurance_details: {} as any,
    contractor_references: [] as any[],
    documents: [] as any[],
  });

  const canSubmitPrequalification = userRole === 'contractor' || userRole === 'builder';
  const canReviewPrequalifications = userRole === 'architect';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const handleSubmitPrequalification = async () => {
    // Implementation for submitting prequalification
    console.log('Submitting prequalification:', prequalForm);
    setSubmitDialogOpen(false);
  };

  const pendingPrequalifications = prequalifications.filter(p => p.status === 'pending');
  const approvedPrequalifications = prequalifications.filter(p => p.status === 'approved');
  const rejectedPrequalifications = prequalifications.filter(p => p.status === 'rejected');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Contractor Prequalification
          </h2>
          <p className="text-muted-foreground">
            Manage contractor qualifications and approvals for project participation.
          </p>
        </div>
        
        {canSubmitPrequalification && (
          <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Submit Prequalification
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Submit Prequalification Application</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Experience */}
                <div>
                  <Label htmlFor="experience">Years of Experience</Label>
                  <Input
                    id="experience"
                    type="number"
                    placeholder="Enter years of relevant experience"
                    value={prequalForm.experience_years}
                    onChange={(e) => setPrequalForm(prev => ({ ...prev, experience_years: e.target.value }))}
                  />
                </div>

                {/* Financial Capacity */}
                <div>
                  <Label htmlFor="financial">Financial Capacity</Label>
                  <Input
                    id="financial"
                    type="number"
                    placeholder="Maximum project value you can handle"
                    value={prequalForm.financial_capacity}
                    onChange={(e) => setPrequalForm(prev => ({ ...prev, financial_capacity: e.target.value }))}
                  />
                </div>

                {/* Certifications */}
                <div>
                  <Label>Certifications & Licenses</Label>
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const certification = { name: '', issuer: '', expiry_date: '', document_url: '' };
                        setPrequalForm(prev => ({ 
                          ...prev, 
                          certifications: [...prev.certifications, certification] 
                        }));
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Certification
                    </Button>
                    
                    {prequalForm.certifications.map((cert, index) => (
                      <div key={index} className="grid grid-cols-2 gap-2 p-3 border rounded">
                        <Input
                          placeholder="Certification name"
                          value={cert.name}
                          onChange={(e) => {
                            const updated = [...prequalForm.certifications];
                            updated[index].name = e.target.value;
                            setPrequalForm(prev => ({ ...prev, certifications: updated }));
                          }}
                        />
                        <Input
                          placeholder="Issuing authority"
                          value={cert.issuer}
                          onChange={(e) => {
                            const updated = [...prequalForm.certifications];
                            updated[index].issuer = e.target.value;
                            setPrequalForm(prev => ({ ...prev, certifications: updated }));
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Previous Projects */}
                <div>
                  <Label>Previous Projects (Last 3 years)</Label>
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const project = { name: '', client: '', value: '', completion_date: '', description: '' };
                        setPrequalForm(prev => ({ 
                          ...prev, 
                          previous_projects: [...prev.previous_projects, project] 
                        }));
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Project
                    </Button>
                    
                    {prequalForm.previous_projects.map((project, index) => (
                      <div key={index} className="space-y-2 p-3 border rounded">
                        <Input
                          placeholder="Project name"
                          value={project.name}
                          onChange={(e) => {
                            const updated = [...prequalForm.previous_projects];
                            updated[index].name = e.target.value;
                            setPrequalForm(prev => ({ ...prev, previous_projects: updated }));
                          }}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="Client name"
                            value={project.client}
                            onChange={(e) => {
                              const updated = [...prequalForm.previous_projects];
                              updated[index].client = e.target.value;
                              setPrequalForm(prev => ({ ...prev, previous_projects: updated }));
                            }}
                          />
                          <Input
                            placeholder="Project value"
                            value={project.value}
                            onChange={(e) => {
                              const updated = [...prequalForm.previous_projects];
                              updated[index].value = e.target.value;
                              setPrequalForm(prev => ({ ...prev, previous_projects: updated }));
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* References */}
                <div>
                  <Label>Professional References</Label>
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const reference = { name: '', company: '', position: '', phone: '', email: '' };
                        setPrequalForm(prev => ({ 
                          ...prev, 
                          contractor_references: [...prev.contractor_references, reference] 
                        }));
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Reference
                    </Button>
                    
                    {prequalForm.contractor_references.map((ref, index) => (
                      <div key={index} className="grid grid-cols-2 gap-2 p-3 border rounded">
                        <Input
                          placeholder="Reference name"
                          value={ref.name}
                          onChange={(e) => {
                            const updated = [...prequalForm.contractor_references];
                            updated[index].name = e.target.value;
                            setPrequalForm(prev => ({ ...prev, contractor_references: updated }));
                          }}
                        />
                        <Input
                          placeholder="Company"
                          value={ref.company}
                          onChange={(e) => {
                            const updated = [...prequalForm.contractor_references];
                            updated[index].company = e.target.value;
                            setPrequalForm(prev => ({ ...prev, contractor_references: updated }));
                          }}
                        />
                        <Input
                          placeholder="Phone"
                          value={ref.phone}
                          onChange={(e) => {
                            const updated = [...prequalForm.contractor_references];
                            updated[index].phone = e.target.value;
                            setPrequalForm(prev => ({ ...prev, contractor_references: updated }));
                          }}
                        />
                        <Input
                          placeholder="Email"
                          value={ref.email}
                          onChange={(e) => {
                            const updated = [...prequalForm.contractor_references];
                            updated[index].email = e.target.value;
                            setPrequalForm(prev => ({ ...prev, contractor_references: updated }));
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setSubmitDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmitPrequalification}>
                    Submit Application
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium">Pending Review</span>
            </div>
            <div className="text-2xl font-bold">{pendingPrequalifications.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">Approved</span>
            </div>
            <div className="text-2xl font-bold">{approvedPrequalifications.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium">Rejected</span>
            </div>
            <div className="text-2xl font-bold">{rejectedPrequalifications.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Total Applications</span>
            </div>
            <div className="text-2xl font-bold">{prequalifications.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Prequalifications List */}
      {prequalifications.length > 0 ? (
        <div className="space-y-4">
          {prequalifications.map(prequalification => (
            <Card key={prequalification.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <Building className="w-5 h-5 text-muted-foreground" />
                        <h3 className="font-semibold text-lg">
                          {prequalification.contractor_profile?.name || 'Unknown Contractor'}
                        </h3>
                      </div>
                      
                      <Badge className={getStatusColor(prequalification.status)}>
                        {getStatusIcon(prequalification.status)}
                        <span className="ml-1 capitalize">{prequalification.status}</span>
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Experience:</span>
                        <div className="font-medium">
                          {prequalification.experience_years ? 
                            `${prequalification.experience_years} years` : 
                            'Not specified'
                          }
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-muted-foreground">Financial Capacity:</span>
                        <div className="font-medium">
                          {prequalification.financial_capacity ? 
                            `$${prequalification.financial_capacity.toLocaleString()}` : 
                            'Not specified'
                          }
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-muted-foreground">Submitted:</span>
                        <div className="font-medium">
                          {formatDistanceToNow(new Date(prequalification.submitted_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="flex items-center gap-6 mt-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        {prequalification.certifications.length} certifications
                      </div>
                      <div className="flex items-center gap-1">
                        <Building className="w-3 h-3" />
                        {prequalification.previous_projects.length} previous projects
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {prequalification.contractor_references.length} references
                      </div>
                    </div>

                    {/* Review Notes */}
                    {prequalification.review_notes && (
                      <div className="mt-3 p-3 bg-muted/50 rounded-md">
                        <div className="text-xs font-medium text-muted-foreground mb-1">Review Notes:</div>
                        <p className="text-sm">{prequalification.review_notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewingPrequalification(prequalification)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                    
                    {canReviewPrequalifications && prequalification.status === 'pending' && (
                      <Button size="sm">
                        <Edit className="w-4 h-4 mr-1" />
                        Review
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Prequalifications</h3>
            <p className="text-muted-foreground mb-4">
              {canSubmitPrequalification 
                ? "Submit your prequalification to participate in project tenders."
                : "No contractor prequalifications have been submitted yet."
              }
            </p>
            {canSubmitPrequalification && (
              <Button onClick={() => setSubmitDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Submit Prequalification
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Detailed View Dialog */}
      {viewingPrequalification && (
        <Dialog open={!!viewingPrequalification} onOpenChange={() => setViewingPrequalification(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                {viewingPrequalification.contractor_profile?.name} - Prequalification Details
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Status and Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Application Status</h4>
                  <Badge className={getStatusColor(viewingPrequalification.status)} size="lg">
                    {getStatusIcon(viewingPrequalification.status)}
                    <span className="ml-2 capitalize">{viewingPrequalification.status}</span>
                  </Badge>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Key Metrics</h4>
                  <div className="space-y-1 text-sm">
                    <div>Experience: {viewingPrequalification.experience_years || 'Not specified'} years</div>
                    <div>Financial Capacity: ${viewingPrequalification.financial_capacity?.toLocaleString() || 'Not specified'}</div>
                    <div>Submitted: {new Date(viewingPrequalification.submitted_at).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>

              {/* Certifications */}
              {viewingPrequalification.certifications.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Certifications & Licenses</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {viewingPrequalification.certifications.map((cert: any, index: number) => (
                      <Card key={index}>
                        <CardContent className="p-3">
                          <div className="font-medium">{cert.name}</div>
                          <div className="text-sm text-muted-foreground">{cert.issuer}</div>
                          {cert.expiry_date && (
                            <div className="text-xs text-muted-foreground">Expires: {cert.expiry_date}</div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Previous Projects */}
              {viewingPrequalification.previous_projects.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Previous Projects</h4>
                  <div className="space-y-3">
                    {viewingPrequalification.previous_projects.map((project: any, index: number) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-medium">{project.name}</h5>
                            <Badge variant="outline">${project.value}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Client: {project.client}
                          </div>
                          {project.description && (
                            <p className="text-sm mt-2">{project.description}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* References */}
              {viewingPrequalification.contractor_references.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Professional References</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {viewingPrequalification.contractor_references.map((ref: any, index: number) => (
                      <Card key={index}>
                        <CardContent className="p-3">
                          <div className="font-medium">{ref.name}</div>
                          <div className="text-sm text-muted-foreground">{ref.position}</div>
                          <div className="text-sm text-muted-foreground">{ref.company}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {ref.phone} | {ref.email}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Review Section for Architects */}
              {canReviewPrequalifications && viewingPrequalification.status === 'pending' && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Review Application</h4>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Add review notes and feedback..."
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button className="bg-green-600 hover:bg-green-700">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button variant="destructive">
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};