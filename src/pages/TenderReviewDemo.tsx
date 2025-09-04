import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Award, Users, DollarSign, Clock, FileText } from 'lucide-react';
import TenderReviewDashboard from '@/components/tenders/TenderReviewDashboard';

// Mock data for demonstration
const mockBids = [
  {
    id: '1',
    bidder_name: 'John Smith',
    bidder_email: 'john@smithconstruction.com.au',
    company_name: 'Smith Construction Pty Ltd',
    abn: '12 345 678 901',
    bid_amount: 485000,
    timeline_days: 90,
    submitted_at: '2024-01-15T10:30:00Z',
    status: 'submitted' as const,
    company_info: {
      businessName: 'Smith Construction Pty Ltd',
      abn: '12 345 678 901',
      establishedYear: '2010',
      employeeCount: '15-25',
      experienceSummary: 'Specialist in residential construction with over 14 years experience. Completed 150+ residential projects across Sydney metro area.',
      insuranceProvider: 'QBE Insurance',
      publicLiabilityAmount: '$20,000,000',
      licenseNumber: 'NSW 123456C'
    },
    financial_proposal: {
      subtotal: 440909,
      gst_amount: 44091,
      total_inc_gst: 485000,
      paymentSchedule: '10% deposit, 30% at slab, 30% at frame, 25% at lockup, 5% at completion'
    },
    execution_details: {
      startDate: '2024-03-01',
      completionDate: '2024-05-30',
      proposedTimeline: 'Site preparation and excavation (1 week), Foundation and slab (2 weeks), Framing and roofing (3 weeks)...',
      riskAssessment: 'Weather delays during winter months, potential soil issues, material delivery delays',
      qualityAssurance: 'Daily inspections, third-party quality assessments, compliance with Building Code of Australia',
      safetyManagement: 'Comprehensive WHS policies, daily safety briefings, regular safety audits'
    },
    documents: [
      { name: 'Insurance_Certificate.pdf', category: 'Insurance Certificates', size: 2048576 },
      { name: 'Builders_License.pdf', category: 'License Documentation', size: 1024768 },
      { name: 'Recent_Projects.pdf', category: 'Reference Projects Portfolio', size: 8192000 }
    ],
    evaluation: {
      price_score: 85,
      experience_score: 78,
      timeline_score: 82,
      technical_score: 75,
      risk_score: 80,
      overall_score: 81,
      evaluator_notes: 'Strong price competitiveness, good experience with similar projects. Timeline is reasonable.',
      evaluated_at: '2024-01-16T14:20:00Z',
      evaluator_id: 'arch_001'
    }
  },
  {
    id: '2',
    bidder_name: 'Maria Rodriguez',
    bidder_email: 'maria@premiumbuilders.com.au',
    company_name: 'Premium Builders Australia',
    abn: '23 456 789 012',
    bid_amount: 520000,
    timeline_days: 75,
    submitted_at: '2024-01-16T09:15:00Z',
    status: 'shortlisted' as const,
    company_info: {
      businessName: 'Premium Builders Australia',
      abn: '23 456 789 012',
      establishedYear: '2005',
      employeeCount: '25-50',
      experienceSummary: 'Award-winning luxury home builders specializing in custom designs. Winner of HIA Awards 2022 & 2023.',
      insuranceProvider: 'Allianz Insurance',
      publicLiabilityAmount: '$50,000,000',
      licenseNumber: 'NSW 789012C'
    },
    financial_proposal: {
      subtotal: 472727,
      gst_amount: 47273,
      total_inc_gst: 520000,
      paymentSchedule: '15% deposit, 25% at slab, 25% at frame, 25% at lockup, 10% at completion'
    },
    execution_details: {
      startDate: '2024-02-15',
      completionDate: '2024-04-30',
      proposedTimeline: 'Fast-track construction with dedicated team, premium materials, advanced construction techniques',
      riskAssessment: 'Minimal risks due to experienced team and established supplier relationships',
      qualityAssurance: 'ISO 9001 certified processes, independent quality inspections, 7-year structural warranty',
      safetyManagement: 'Zero harm safety culture, certified safety officers on-site, monthly safety training'
    },
    documents: [
      { name: 'Insurance_Package.pdf', category: 'Insurance Certificates', size: 3072000 },
      { name: 'Professional_Licenses.pdf', category: 'License Documentation', size: 2048000 },
      { name: 'Award_Winning_Projects.pdf', category: 'Reference Projects Portfolio', size: 12288000 },
      { name: 'Quality_Management_System.pdf', category: 'Technical Proposals', size: 1536000 }
    ],
    evaluation: {
      price_score: 72,
      experience_score: 95,
      timeline_score: 88,
      technical_score: 92,
      risk_score: 85,
      overall_score: 84,
      evaluator_notes: 'Premium quality builder with excellent track record. Higher price but superior experience and faster timeline.',
      evaluated_at: '2024-01-17T11:45:00Z',
      evaluator_id: 'arch_001'
    }
  },
  {
    id: '3',
    bidder_name: 'David Wong',
    bidder_email: 'david@econobuild.com.au',
    company_name: 'EconoBuild Solutions',
    abn: '34 567 890 123',
    bid_amount: 425000,
    timeline_days: 110,
    submitted_at: '2024-01-17T16:20:00Z',
    status: 'under_review' as const,
    company_info: {
      businessName: 'EconoBuild Solutions',
      abn: '34 567 890 123',
      establishedYear: '2018',
      employeeCount: '8-15',
      experienceSummary: 'Cost-effective building solutions for first-time home builders. Focus on value engineering and efficient construction.',
      insuranceProvider: 'NRMA Insurance',
      publicLiabilityAmount: '$10,000,000',
      licenseNumber: 'NSW 345678C'
    },
    financial_proposal: {
      subtotal: 386364,
      gst_amount: 38636,
      total_inc_gst: 425000,
      paymentSchedule: '5% deposit, 35% at slab, 35% at frame, 20% at lockup, 5% at completion'
    },
    execution_details: {
      startDate: '2024-04-01',
      completionDate: '2024-07-20',
      proposedTimeline: 'Standard construction timeline with focus on cost optimization and material efficiency',
      riskAssessment: 'Limited by smaller team size, potential delays due to resource constraints',
      qualityAssurance: 'Standard building practices, regular inspections, compliance with minimum standards',
      safetyManagement: 'Basic WHS compliance, weekly safety meetings, standard safety equipment'
    },
    documents: [
      { name: 'Basic_Insurance.pdf', category: 'Insurance Certificates', size: 1024000 },
      { name: 'Builders_License_Copy.pdf', category: 'License Documentation', size: 512000 },
      { name: 'Previous_Works.pdf', category: 'Reference Projects Portfolio', size: 4096000 }
    ]
  }
];

const mockTender = {
  id: '1',
  title: 'Modern Family Home Construction',
  budget: 500000,
  deadline: '2024-01-31T23:59:59Z',
  status: 'open'
};

const TenderReviewDemo = () => {
  const [bids, setBids] = useState(mockBids);

  const handleAwardTender = (bidId: string) => {
    setBids(prev => prev.map(bid => ({
      ...bid,
      status: bid.id === bidId ? 'awarded' as any : bid.status
    })));
  };

  const handleUpdateBidStatus = (bidId: string, status: string) => {
    setBids(prev => prev.map(bid => 
      bid.id === bidId 
        ? { ...bid, status: status as any }
        : bid
    ));
  };

  const handleSaveEvaluation = (bidId: string, evaluation: any) => {
    setBids(prev => prev.map(bid => 
      bid.id === bidId 
        ? { ...bid, evaluation }
        : bid
    ));
  };

  return (
    <div className="container mx-auto p-6">
      <TenderReviewDashboard
        tender={mockTender}
        bids={bids}
        onAwardTender={handleAwardTender}
        onUpdateBidStatus={handleUpdateBidStatus}
        onSaveEvaluation={handleSaveEvaluation}
      />
    </div>
  );
};

export default TenderReviewDemo;