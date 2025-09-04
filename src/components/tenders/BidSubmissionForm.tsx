import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building, 
  DollarSign, 
  Calendar, 
  Upload, 
  FileText, 
  CheckCircle,
  AlertTriangle,
  Plus,
  Trash2,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import DocumentUploadSystem from '@/components/documents/DocumentUploadSystem';

interface TenderDetails {
  id: string;
  title: string;
  budget?: number;
  deadline: string;
}

interface BidSubmissionFormProps {
  tender: TenderDetails;
  onSubmit: (bidData: any) => void;
  onBack: () => void;
}

interface CostItem {
  id: string;
  category: string;
  description: string;
  quantity: number;
  unitCost: number;
  total: number;
}

interface Document {
  id: string;
  name: string;
  size: number;
  category: string;
  file?: File;
}

const BidSubmissionForm: React.FC<BidSubmissionFormProps> = ({ tender, onSubmit, onBack }) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(25);

  // Company Information
  const [companyInfo, setCompanyInfo] = useState({
    businessName: '',
    abn: '',
    acn: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    establishedYear: '',
    employeeCount: '',
    insuranceProvider: '',
    publicLiabilityAmount: '',
    workersCompPolicy: '',
    licenseNumber: '',
    licenseExpiry: '',
    experienceSummary: '',
    keyPersonnel: [{ name: '', position: '', qualifications: '', experience: '' }]
  });

  // Financial Proposal
  const [financialData, setFinancialData] = useState({
    bidAmount: '',
    costBreakdown: [
      { id: '1', category: 'Labour Costs', description: '', quantity: 1, unitCost: 0, total: 0 },
      { id: '2', category: 'Materials & Supplies', description: '', quantity: 1, unitCost: 0, total: 0 },
      { id: '3', category: 'Equipment & Machinery', description: '', quantity: 1, unitCost: 0, total: 0 },
      { id: '4', category: 'Subcontractor Costs', description: '', quantity: 1, unitCost: 0, total: 0 },
      { id: '5', category: 'Overhead & Profit', description: '', quantity: 1, unitCost: 0, total: 0 }
    ] as CostItem[],
    gstAmount: '',
    totalIncludingGst: '',
    paymentSchedule: '',
    variationRates: {
      labourRate: '',
      materialMarkup: '',
      equipmentRate: ''
    }
  });

  // Project Execution
  const [executionData, setExecutionData] = useState({
    proposedTimeline: '',
    startDate: '',
    completionDate: '',
    keyMilestones: [{ description: '', date: '', deliverables: '' }],
    resourceAllocation: '',
    riskAssessment: '',
    mitigationStrategies: '',
    qualityAssurance: '',
    environmentalCompliance: '',
    safetyManagement: '',
    projectMethodology: ''
  });

  // Documents
  const [documents, setDocuments] = useState<Document[]>([]);

  const steps = [
    { title: 'Company Information', icon: Building },
    { title: 'Financial Proposal', icon: DollarSign },
    { title: 'Project Execution', icon: Calendar },
    { title: 'Document Upload', icon: Upload },
    { title: 'Review & Submit', icon: CheckCircle }
  ];

  const updateProgress = (step: number) => {
    setProgress(25 + (step * 15));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        return !!(companyInfo.businessName && companyInfo.abn && companyInfo.address);
      case 1:
        return !!(financialData.bidAmount);
      case 2:
        return !!(executionData.startDate && executionData.completionDate);
      case 3:
        return documents.length >= 3; // Minimum required documents
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      const newStep = Math.min(currentStep + 1, steps.length - 1);
      setCurrentStep(newStep);
      updateProgress(newStep);
    } else {
      toast({
        title: "Incomplete Information",
        description: "Please fill in all required fields before proceeding.",
        variant: "destructive"
      });
    }
  };

  const prevStep = () => {
    const newStep = Math.max(currentStep - 1, 0);
    setCurrentStep(newStep);
    updateProgress(newStep);
  };

  const calculateCostTotal = (item: CostItem): number => {
    return item.quantity * item.unitCost;
  };

  const updateCostItem = (id: string, field: keyof CostItem, value: any) => {
    setFinancialData(prev => ({
      ...prev,
      costBreakdown: prev.costBreakdown.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'quantity' || field === 'unitCost') {
            updated.total = calculateCostTotal(updated);
          }
          return updated;
        }
        return item;
      })
    }));
  };

  const addCostItem = () => {
    const newItem: CostItem = {
      id: Date.now().toString(),
      category: 'Other',
      description: '',
      quantity: 1,
      unitCost: 0,
      total: 0
    };
    setFinancialData(prev => ({
      ...prev,
      costBreakdown: [...prev.costBreakdown, newItem]
    }));
  };

  const removeCostItem = (id: string) => {
    setFinancialData(prev => ({
      ...prev,
      costBreakdown: prev.costBreakdown.filter(item => item.id !== id)
    }));
  };

  const calculateSubtotal = (): number => {
    return financialData.costBreakdown.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateGST = (): number => {
    return calculateSubtotal() * 0.1; // 10% GST for Australia
  };

  const calculateTotalIncGST = (): number => {
    return calculateSubtotal() + calculateGST();
  };

  const addMilestone = () => {
    setExecutionData(prev => ({
      ...prev,
      keyMilestones: [...prev.keyMilestones, { description: '', date: '', deliverables: '' }]
    }));
  };

  const updateMilestone = (index: number, field: string, value: string) => {
    setExecutionData(prev => ({
      ...prev,
      keyMilestones: prev.keyMilestones.map((milestone, i) => 
        i === index ? { ...milestone, [field]: value } : milestone
      )
    }));
  };

  const handleFileUpload = (files: FileList, category: string) => {
    Array.from(files).forEach(file => {
      const newDoc: Document = {
        id: Date.now().toString() + Math.random(),
        name: file.name,
        size: file.size,
        category,
        file
      };
      setDocuments(prev => [...prev, newDoc]);
    });
  };

  const removeDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = () => {
    const bidData = {
      tender_id: tender.id,
      bid_amount: calculateTotalIncGST(),
      company_info: companyInfo,
      financial_proposal: {
        ...financialData,
        subtotal: calculateSubtotal(),
        gst_amount: calculateGST(),
        total_inc_gst: calculateTotalIncGST()
      },
      execution_details: executionData,
      documents: documents.map(doc => ({ name: doc.name, size: doc.size, category: doc.category })),
      submitted_at: new Date().toISOString()
    };

    onSubmit(bidData);
  };

  const renderCompanyInformation = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="businessName" className="text-sm font-medium">
              Business Name *
            </Label>
            <Input
              id="businessName"
              value={companyInfo.businessName}
              onChange={(e) => setCompanyInfo(prev => ({ ...prev, businessName: e.target.value }))}
              placeholder="Enter your business name"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="abn" className="text-sm font-medium">
              Australian Business Number (ABN) *
            </Label>
            <Input
              id="abn"
              value={companyInfo.abn}
              onChange={(e) => setCompanyInfo(prev => ({ ...prev, abn: e.target.value }))}
              placeholder="XX XXX XXX XXX"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="acn" className="text-sm font-medium">
              Australian Company Number (ACN)
            </Label>
            <Input
              id="acn"
              value={companyInfo.acn}
              onChange={(e) => setCompanyInfo(prev => ({ ...prev, acn: e.target.value }))}
              placeholder="XXX XXX XXX"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="phone" className="text-sm font-medium">
              Phone Number *
            </Label>
            <Input
              id="phone"
              value={companyInfo.phone}
              onChange={(e) => setCompanyInfo(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+61 X XXXX XXXX"
              className="mt-1"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="address" className="text-sm font-medium">
              Business Address *
            </Label>
            <Textarea
              id="address"
              value={companyInfo.address}
              onChange={(e) => setCompanyInfo(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Enter your complete business address"
              className="mt-1"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address *
            </Label>
            <Input
              id="email"
              type="email"
              value={companyInfo.email}
              onChange={(e) => setCompanyInfo(prev => ({ ...prev, email: e.target.value }))}
              placeholder="contact@yourcompany.com.au"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="website" className="text-sm font-medium">
              Website
            </Label>
            <Input
              id="website"
              value={companyInfo.website}
              onChange={(e) => setCompanyInfo(prev => ({ ...prev, website: e.target.value }))}
              placeholder="www.yourcompany.com.au"
              className="mt-1"
            />
          </div>
        </div>
      </div>

      <Separator />

      <div className="grid md:grid-cols-3 gap-6">
        <div>
          <Label htmlFor="establishedYear" className="text-sm font-medium">
            Year Established
          </Label>
          <Input
            id="establishedYear"
            value={companyInfo.establishedYear}
            onChange={(e) => setCompanyInfo(prev => ({ ...prev, establishedYear: e.target.value }))}
            placeholder="YYYY"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="employeeCount" className="text-sm font-medium">
            Number of Employees
          </Label>
          <Input
            id="employeeCount"
            value={companyInfo.employeeCount}
            onChange={(e) => setCompanyInfo(prev => ({ ...prev, employeeCount: e.target.value }))}
            placeholder="e.g., 1-10, 11-50, 50+"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="licenseNumber" className="text-sm font-medium">
            Builder's License Number *
          </Label>
          <Input
            id="licenseNumber"
            value={companyInfo.licenseNumber}
            onChange={(e) => setCompanyInfo(prev => ({ ...prev, licenseNumber: e.target.value }))}
            placeholder="License number"
            className="mt-1"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Insurance Details</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="insuranceProvider" className="text-sm font-medium">
              Insurance Provider *
            </Label>
            <Input
              id="insuranceProvider"
              value={companyInfo.insuranceProvider}
              onChange={(e) => setCompanyInfo(prev => ({ ...prev, insuranceProvider: e.target.value }))}
              placeholder="Insurance company name"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="publicLiabilityAmount" className="text-sm font-medium">
              Public Liability Coverage *
            </Label>
            <Input
              id="publicLiabilityAmount"
              value={companyInfo.publicLiabilityAmount}
              onChange={(e) => setCompanyInfo(prev => ({ ...prev, publicLiabilityAmount: e.target.value }))}
              placeholder="e.g., $20,000,000"
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="workersCompPolicy" className="text-sm font-medium">
            Workers Compensation Policy Number *
          </Label>
          <Input
            id="workersCompPolicy"
            value={companyInfo.workersCompPolicy}
            onChange={(e) => setCompanyInfo(prev => ({ ...prev, workersCompPolicy: e.target.value }))}
            placeholder="Policy number"
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="experienceSummary" className="text-sm font-medium">
          Company Experience Summary
        </Label>
        <Textarea
          id="experienceSummary"
          value={companyInfo.experienceSummary}
          onChange={(e) => setCompanyInfo(prev => ({ ...prev, experienceSummary: e.target.value }))}
          placeholder="Describe your company's relevant experience and notable projects..."
          className="mt-1"
          rows={4}
        />
      </div>
    </div>
  );

  const renderFinancialProposal = () => (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          All amounts should be in Australian Dollars (AUD). GST will be calculated automatically at 10%.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Cost Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {financialData.costBreakdown.map((item) => (
              <div key={item.id} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border rounded-lg">
                <div>
                  <Label className="text-xs">Category</Label>
                  <Input
                    value={item.category}
                    onChange={(e) => updateCostItem(item.id, 'category', e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs">Description</Label>
                  <Input
                    value={item.description}
                    onChange={(e) => updateCostItem(item.id, 'description', e.target.value)}
                    placeholder="Describe this cost item"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Quantity</Label>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateCostItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Unit Cost ($)</Label>
                  <Input
                    type="number"
                    value={item.unitCost}
                    onChange={(e) => updateCostItem(item.id, 'unitCost', parseFloat(e.target.value) || 0)}
                    className="text-sm"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label className="text-xs">Total ($)</Label>
                    <div className="text-sm font-medium p-2 bg-muted rounded">
                      ${item.total.toLocaleString()}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeCostItem(item.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            <Button variant="outline" onClick={addCostItem} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Cost Item
            </Button>
          </div>

          <Separator className="my-6" />

          <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>${calculateSubtotal().toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>GST (10%):</span>
              <span>${calculateGST().toLocaleString()}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-semibold">
              <span>Total (Inc. GST):</span>
              <span>${calculateTotalIncGST().toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Schedule & Variation Rates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="paymentSchedule" className="text-sm font-medium">
              Proposed Payment Schedule
            </Label>
            <Textarea
              id="paymentSchedule"
              value={financialData.paymentSchedule}
              onChange={(e) => setFinancialData(prev => ({ ...prev, paymentSchedule: e.target.value }))}
              placeholder="e.g., 10% deposit, 30% at completion of foundations, 30% at lock-up stage, 25% at practical completion, 5% after defects liability period"
              className="mt-1"
              rows={3}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="labourRate" className="text-sm font-medium">
                Labour Rate ($/hour)
              </Label>
              <Input
                id="labourRate"
                type="number"
                value={financialData.variationRates.labourRate}
                onChange={(e) => setFinancialData(prev => ({
                  ...prev,
                  variationRates: { ...prev.variationRates, labourRate: e.target.value }
                }))}
                placeholder="0.00"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="materialMarkup" className="text-sm font-medium">
                Material Markup (%)
              </Label>
              <Input
                id="materialMarkup"
                type="number"
                value={financialData.variationRates.materialMarkup}
                onChange={(e) => setFinancialData(prev => ({
                  ...prev,
                  variationRates: { ...prev.variationRates, materialMarkup: e.target.value }
                }))}
                placeholder="0"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="equipmentRate" className="text-sm font-medium">
                Equipment Rate ($/day)
              </Label>
              <Input
                id="equipmentRate"
                type="number"
                value={financialData.variationRates.equipmentRate}
                onChange={(e) => setFinancialData(prev => ({
                  ...prev,
                  variationRates: { ...prev.variationRates, equipmentRate: e.target.value }
                }))}
                placeholder="0.00"
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderProjectExecution = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Project Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate" className="text-sm font-medium">
                Proposed Start Date *
              </Label>
              <Input
                id="startDate"
                type="date"
                value={executionData.startDate}
                onChange={(e) => setExecutionData(prev => ({ ...prev, startDate: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="completionDate" className="text-sm font-medium">
                Estimated Completion Date *
              </Label>
              <Input
                id="completionDate"
                type="date"
                value={executionData.completionDate}
                onChange={(e) => setExecutionData(prev => ({ ...prev, completionDate: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="proposedTimeline" className="text-sm font-medium">
              Detailed Timeline Description
            </Label>
            <Textarea
              id="proposedTimeline"
              value={executionData.proposedTimeline}
              onChange={(e) => setExecutionData(prev => ({ ...prev, proposedTimeline: e.target.value }))}
              placeholder="Describe your proposed project timeline, including key phases and activities..."
              className="mt-1"
              rows={4}
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Key Milestones</Label>
            <div className="space-y-3 mt-2">
              {executionData.keyMilestones.map((milestone, index) => (
                <div key={index} className="grid md:grid-cols-3 gap-3 p-3 border rounded-lg">
                  <Input
                    value={milestone.description}
                    onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                    placeholder="Milestone description"
                  />
                  <Input
                    type="date"
                    value={milestone.date}
                    onChange={(e) => updateMilestone(index, 'date', e.target.value)}
                  />
                  <Input
                    value={milestone.deliverables}
                    onChange={(e) => updateMilestone(index, 'deliverables', e.target.value)}
                    placeholder="Key deliverables"
                  />
                </div>
              ))}
              <Button variant="outline" onClick={addMilestone} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Milestone
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Resource Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={executionData.resourceAllocation}
              onChange={(e) => setExecutionData(prev => ({ ...prev, resourceAllocation: e.target.value }))}
              placeholder="Describe your resource allocation plan, including team size, key personnel, equipment, etc."
              rows={4}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={executionData.riskAssessment}
              onChange={(e) => setExecutionData(prev => ({ ...prev, riskAssessment: e.target.value }))}
              placeholder="Identify potential risks and challenges for this project..."
              rows={4}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quality Assurance</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={executionData.qualityAssurance}
              onChange={(e) => setExecutionData(prev => ({ ...prev, qualityAssurance: e.target.value }))}
              placeholder="Describe your quality assurance procedures and standards..."
              rows={4}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Safety Management</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={executionData.safetyManagement}
              onChange={(e) => setExecutionData(prev => ({ ...prev, safetyManagement: e.target.value }))}
              placeholder="Outline your site safety management plan and procedures..."
              rows={4}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderDocumentUpload = () => (
    <div className="space-y-6">
      <DocumentUploadSystem
        onFilesUploaded={(files) => {
          const formattedFiles = files.map(file => ({
            id: file.id,
            name: file.name,
            size: file.size,
            category: file.category
          }));
          setDocuments(formattedFiles);
        }}
        maxFileSize={50}
        allowMultiple={true}
      />
    </div>
  );

  const renderReviewSubmit = () => (
    <div className="space-y-6">
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          Please review all information carefully before submitting your bid. Once submitted, changes cannot be made.
        </AlertDescription>
      </Alert>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Bid Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Total Bid Amount:</span>
              <span className="font-semibold">${calculateTotalIncGST().toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Project Duration:</span>
              <span>{executionData.startDate && executionData.completionDate ? 
                Math.ceil((new Date(executionData.completionDate).getTime() - new Date(executionData.startDate).getTime()) / (1000 * 3600 * 24)) + ' days' : 
                'Not specified'}</span>
            </div>
            <div className="flex justify-between">
              <span>Documents Uploaded:</span>
              <span>{documents.length} files</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Company Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div><strong>Business:</strong> {companyInfo.businessName}</div>
            <div><strong>ABN:</strong> {companyInfo.abn}</div>
            <div><strong>License:</strong> {companyInfo.licenseNumber}</div>
            <div><strong>Contact:</strong> {companyInfo.email}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Terms & Conditions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>By submitting this bid, I acknowledge that:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>All information provided is accurate and complete</li>
            <li>I have the necessary licenses and insurance to undertake this work</li>
            <li>This bid remains valid for 30 days from submission</li>
            <li>I agree to comply with all Australian building codes and regulations</li>
            <li>Payment terms are subject to negotiation upon award</li>
            <li>This bid is binding upon acceptance by the client</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bid Submission</h1>
          <p className="text-muted-foreground">{tender.title}</p>
        </div>
        <Button variant="outline" onClick={onBack}>
          Back to Tender Details
        </Button>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Submission Progress</h3>
            <span className="text-sm text-muted-foreground">{progress}% Complete</span>
          </div>
          <Progress value={progress} className="mb-4" />
          <div className="flex justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="flex flex-col items-center text-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                    index <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs">{step.title}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Form Content */}
      <Card>
        <CardContent className="p-6">
          {currentStep === 0 && renderCompanyInformation()}
          {currentStep === 1 && renderFinancialProposal()}
          {currentStep === 2 && renderProjectExecution()}
          {currentStep === 3 && renderDocumentUpload()}
          {currentStep === 4 && renderReviewSubmit()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={prevStep}
          disabled={currentStep === 0}
        >
          Previous
        </Button>
        
        {currentStep < steps.length - 1 ? (
          <Button onClick={nextStep}>
            Next
          </Button>
        ) : (
          <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="h-4 w-4 mr-2" />
            Submit Bid
          </Button>
        )}
      </div>
    </div>
  );
};

export default BidSubmissionForm;