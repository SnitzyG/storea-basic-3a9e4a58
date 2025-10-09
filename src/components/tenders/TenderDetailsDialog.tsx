import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, DollarSign, FileText, Users, Award, BarChart3 } from 'lucide-react';
import { Tender, TenderBid, useTenders } from '@/hooks/useTenders';
import { EnhancedBidComparison } from './EnhancedBidComparison';
import { formatDistanceToNow } from 'date-fns';
interface TenderDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tender: Tender | null;
  userRole: string;
}
const statusColors = {
  draft: 'bg-gray-500/10 text-gray-700 border-gray-500/20',
  open: 'bg-green-500/10 text-green-700 border-green-500/20',
  closed: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
  awarded: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  cancelled: 'bg-red-500/10 text-red-700 border-red-500/20'
};
const bidStatusColors = {
  submitted: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  under_review: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
  accepted: 'bg-green-500/10 text-green-700 border-green-500/20',
  rejected: 'bg-red-500/10 text-red-700 border-red-500/20'
};
export const TenderDetailsDialog = ({
  open,
  onOpenChange,
  tender,
  userRole
}: TenderDetailsDialogProps) => {
  const [bids, setBids] = useState<TenderBid[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBidder, setSelectedBidder] = useState<string>('');
  const {
    getTenderBids,
    awardTender
  } = useTenders();
  useEffect(() => {
    if (tender && open) {
      fetchBids();
    }
  }, [tender, open]);
  const fetchBids = async () => {
    if (!tender) return;
    setLoading(true);
    const bidsData = await getTenderBids(tender.id);
    setBids(bidsData);
    setLoading(false);
  };
  const handleAward = async () => {
    if (!tender || !selectedBidder) return;
    const success = await awardTender(tender.id, selectedBidder);
    if (success) {
      onOpenChange(false);
    }
  };
  if (!tender) return null;
  const deadline = new Date(tender.deadline);
  const isExpired = deadline < new Date();
  const canViewBids = userRole === 'architect' || tender.issued_by;
  const canAward = tender.status === 'closed' && userRole === 'architect' && bids.length > 0;
  const lowestBid = bids.length > 0 ? Math.min(...bids.map(b => b.bid_amount)) : null;
  const averageBid = bids.length > 0 ? bids.reduce((sum, b) => sum + b.bid_amount, 0) / bids.length : null;
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{tender.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header with status */}
          <div className="flex flex-wrap gap-2">
            <Badge className={statusColors[tender.status]}>
              {tender.status.replace('_', ' ').toUpperCase()}
            </Badge>
            {tender.status === 'awarded' && tender.awarded_to_profile && <Badge variant="outline" className="flex items-center gap-1">
                <Award className="w-3 h-3" />
                Awarded to {tender.awarded_to_profile.name}
              </Badge>}
            {isExpired && tender.status === 'open' && <Badge className="bg-red-500/10 text-red-700 border-red-500/20">
                Expired
              </Badge>}
          </div>

          {/* Description */}
          <div>
            <h3 className="font-semibold mb-2 flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Description
            </h3>
            <p className="text-foreground bg-muted/50 p-3 rounded-md whitespace-pre-wrap">
              {tender.description}
            </p>
          </div>

          {/* Tender Package - All Details from 10 Steps */}
          {tender.requirements && <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-bold">Tender Package Details</h3>
              
              {/* Contract Type */}
              {tender.requirements.contract_type && <div className="bg-muted/30 p-4 rounded-md">
                  <h4 className="font-semibold mb-2">Contract Type</h4>
                  <p className="capitalize">{tender.requirements.contract_type.replace('_', ' ')}</p>
                </div>}

              {/* Project Scope */}
              {tender.requirements.scope && Object.keys(tender.requirements.scope).length > 0 && <div className="bg-muted/30 p-4 rounded-md">
                  <h4 className="font-semibold mb-3">Project Scope</h4>
                  <div className="space-y-3">
                    {Object.entries(tender.requirements.scope).map(([category, items]: [string, any]) => items && items.length > 0 && <div key={category}>
                          <h5 className="font-medium text-sm capitalize mb-1">
                            {category.replace(/([A-Z])/g, ' $1').trim()}
                          </h5>
                          <ul className="list-disc list-inside text-sm ml-2 space-y-0.5">
                            {items.map((item: string) => <li key={item}>{item}</li>)}
                          </ul>
                        </div>)}
                  </div>
                </div>}

              {/* Timeline */}
              {tender.requirements.timeline && <div className="bg-muted/30 p-4 rounded-md">
                  <h4 className="font-semibold mb-2">Timeline</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {tender.requirements.timeline.start_date && <div>
                        <span className="text-muted-foreground">Start Date:</span>
                        <span className="ml-2 font-medium">{new Date(tender.requirements.timeline.start_date).toLocaleDateString()}</span>
                      </div>}
                    {tender.requirements.timeline.completion_weeks && <div>
                        <span className="text-muted-foreground">Duration:</span>
                        <span className="ml-2 font-medium">{tender.requirements.timeline.completion_weeks} weeks</span>
                      </div>}
                    {tender.requirements.timeline.completion_date && <div>
                        <span className="text-muted-foreground">Completion Date:</span>
                        <span className="ml-2 font-medium">{new Date(tender.requirements.timeline.completion_date).toLocaleDateString()}</span>
                      </div>}
                    {tender.requirements.timeline.defect_rate && <div>
                        <span className="text-muted-foreground">Defect Liability:</span>
                        <span className="ml-2 font-medium">{tender.requirements.timeline.defect_rate} months</span>
                      </div>}
                  </div>
                </div>}

              {/* Compliance Requirements */}
              {tender.requirements.compliance && tender.requirements.compliance.length > 0 && <div className="bg-muted/30 p-4 rounded-md">
                  <h4 className="font-semibold mb-2">Compliance Requirements</h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {tender.requirements.compliance.map((item: string) => <li key={item}>{item}</li>)}
                  </ul>
                </div>}

              {/* Contractor Requirements */}
              {tender.requirements.contractor && tender.requirements.contractor.length > 0 && <div className="bg-muted/30 p-4 rounded-md">
                  <h4 className="font-semibold mb-2">Contractor Requirements</h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {tender.requirements.contractor.map((item: string) => <li key={item}>{item}</li>)}
                  </ul>
                </div>}

              {/* Environmental Targets */}
              {tender.requirements.environmental && tender.requirements.environmental.length > 0 && <div className="bg-muted/30 p-4 rounded-md">
                  <h4 className="font-semibold mb-2">Environmental Targets</h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {tender.requirements.environmental.map((item: string) => <li key={item}>{item}</li>)}
                  </ul>
                  {tender.requirements.custom_environmental && <p className="mt-2 text-sm border-t pt-2">
                      <strong>Additional:</strong> {tender.requirements.custom_environmental}
                    </p>}
                </div>}

              {/* Communication Objectives */}
              {tender.requirements.communication && tender.requirements.communication.length > 0 && <div className="bg-muted/30 p-4 rounded-md">
                  <h4 className="font-semibold mb-2">Communication & Reporting</h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {tender.requirements.communication.map((item: string) => <li key={item}>{item}</li>)}
                  </ul>
                  {tender.requirements.communication_details && <div className="mt-2 grid grid-cols-2 gap-2 text-sm border-t pt-2">
                      <div>
                        <span className="text-muted-foreground">Frequency:</span>
                        <span className="ml-2 font-medium capitalize">{tender.requirements.communication_details.reporting_frequency}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Format:</span>
                        <span className="ml-2 font-medium capitalize">{tender.requirements.communication_details.preferred_format}</span>
                      </div>
                    </div>}
                </div>}

              {/* Site Conditions */}
              {tender.requirements.site_conditions && <div className="bg-muted/30 p-4 rounded-md">
                  <h4 className="font-semibold mb-2">Site Conditions</h4>
                  <div className="space-y-2 text-sm">
                    {tender.requirements.site_conditions.access && <div>
                        <span className="text-muted-foreground">Access:</span>
                        <p className="ml-2">{tender.requirements.site_conditions.access}</p>
                      </div>}
                    {tender.requirements.site_conditions.terrain && tender.requirements.site_conditions.terrain.length > 0 && <div>
                        <span className="text-muted-foreground">Terrain:</span>
                        <p className="ml-2">{tender.requirements.site_conditions.terrain.join(', ')}</p>
                      </div>}
                    {tender.requirements.site_conditions.vegetation_demolition && <div>
                        <span className="text-muted-foreground">Vegetation/Demolition:</span>
                        <p className="ml-2">{tender.requirements.site_conditions.vegetation_demolition}</p>
                      </div>}
                    {tender.requirements.site_conditions.existing_services && tender.requirements.site_conditions.existing_services.length > 0 && <div>
                        <span className="text-muted-foreground">Existing Services:</span>
                        <p className="ml-2">{tender.requirements.site_conditions.existing_services.join(', ')}</p>
                      </div>}
                    {tender.requirements.site_conditions.neighboring_structures && <div>
                        <span className="text-muted-foreground">Neighboring Structures:</span>
                        <p className="ml-2">{tender.requirements.site_conditions.neighboring_structures}</p>
                      </div>}
                  </div>
                </div>}

              {/* Risk Assessment */}
              {tender.requirements.risk_assessment && <div className="bg-muted/30 p-4 rounded-md">
                  <h4 className="font-semibold mb-2">Risk Assessment</h4>
                  <div className="space-y-2 text-sm">
                    {tender.requirements.risk_assessment.risk_severity && <div>
                        <span className="text-muted-foreground">Risk Severity:</span>
                        <Badge className="ml-2 capitalize" variant={tender.requirements.risk_assessment.risk_severity === 'high' ? 'destructive' : 'outline'}>
                          {tender.requirements.risk_assessment.risk_severity}
                        </Badge>
                      </div>}
                    {tender.requirements.risk_assessment.identified_risks && <div>
                        <span className="text-muted-foreground">Identified Risks:</span>
                        <p className="ml-2 mt-1">{tender.requirements.risk_assessment.identified_risks}</p>
                      </div>}
                    {tender.requirements.risk_assessment.safety_measures && <div>
                        <span className="text-muted-foreground">Safety Measures:</span>
                        <p className="ml-2 mt-1">{tender.requirements.risk_assessment.safety_measures}</p>
                      </div>}
                    {tender.requirements.risk_assessment.insurance_coverage && <div>
                        <span className="text-muted-foreground">Insurance Coverage:</span>
                        <p className="ml-2 mt-1">{tender.requirements.risk_assessment.insurance_coverage}</p>
                      </div>}
                    {tender.requirements.risk_assessment.contingency_planning && <div>
                        <span className="text-muted-foreground">Contingency Planning:</span>
                        <p className="ml-2 mt-1">{tender.requirements.risk_assessment.contingency_planning}</p>
                      </div>}
                  </div>
                </div>}
            </div>}

          {/* Meta information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tender.budget && <div className="flex items-center text-sm">
                <DollarSign className="w-4 h-4 mr-2 text-muted-foreground" />
                <span className="text-muted-foreground mr-2">Budget:</span>
                <span className="font-medium">${tender.budget.toLocaleString()}</span>
              </div>}

            <div className="flex items-center text-sm">
              <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
              <span className="text-muted-foreground mr-2">Deadline:</span>
              <span className="font-medium">
                {deadline.toLocaleDateString()} 
                {!isExpired && <span className="ml-1 text-muted-foreground">
                    ({formatDistanceToNow(deadline, {
                  addSuffix: true
                })})
                  </span>}
              </span>
            </div>

            <div className="flex items-center text-sm">
              <Avatar className="w-5 h-5 mr-2">
                <AvatarFallback className="text-xs">
                  {tender.issued_by_profile?.name?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
              <span className="text-muted-foreground mr-2">Issued by:</span>
              <span>{tender.issued_by_profile?.name || 'Unknown'}</span>
            </div>

            <div className="flex items-center text-sm">
              <Users className="w-4 h-4 mr-2 text-muted-foreground" />
              <span className="text-muted-foreground mr-2">Bids received:</span>
              <span className="font-medium">{bids.length}</span>
            </div>
          </div>

          {/* Requirements */}
          {tender.requirements?.description && <div>
              <h3 className="font-semibold mb-2">Additional Requirements</h3>
              <p className="text-foreground bg-muted/50 p-3 rounded-md">
                {tender.requirements.description}
              </p>
            </div>}

          <Separator />

          {/* Bids Section */}
          {canViewBids ? <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <h3 className="font-semibold">Bids Overview ({bids.length})</h3>
                </div>
                
                {loading ? <p className="text-center text-muted-foreground py-4">Loading bids...</p> : bids.length > 0 ? <div className="space-y-4">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-md">
                      <div>
                        <p className="text-sm text-muted-foreground">Lowest Bid</p>
                        <p className="font-semibold text-green-600">
                          ${lowestBid?.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Average Bid</p>
                        <p className="font-semibold">
                          ${averageBid?.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Bids</p>
                        <p className="font-semibold">{bids.length}</p>
                      </div>
                    </div>

                    {/* Simple Bid List */}
                    <div className="space-y-2">
                      {bids.map(bid => <div key={bid.id} className="flex items-center justify-between p-3 border rounded-md">
                          <div className="flex items-center gap-3">
                            {canAward && <input type="radio" name="selectedBidder" value={bid.bidder_id} checked={selectedBidder === bid.bidder_id} onChange={e => setSelectedBidder(e.target.value)} className="w-4 h-4" />}
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="text-xs">
                                {bid.bidder_profile?.name?.charAt(0) || 'B'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{bid.bidder_profile?.name || 'Unknown'}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(bid.submitted_at), {
                          addSuffix: true
                        })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${bid.bid_amount === lowestBid ? 'text-green-600' : ''}`}>
                              ${bid.bid_amount.toLocaleString()}
                            </p>
                            <Badge className={bidStatusColors[bid.status]}>
                              {bid.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>)}
                    </div>

                    {/* Award Button */}
                    {canAward && <div className="flex justify-end">
                        <Button onClick={handleAward} disabled={!selectedBidder}>
                          Award to Selected Bidder
                        </Button>
                      </div>}
                  </div> : <p className="text-center text-muted-foreground py-4">No bids submitted yet</p>}
              </TabsContent>
              
              <TabsContent value="comparison">
                {bids.length > 0 ? <EnhancedBidComparison bids={bids} onAwardTender={bidId => {
              const bid = bids.find(b => b.id === bidId);
              if (bid) {
                awardTender(tender.id, bid.bidder_id);
                onOpenChange(false);
              }
            }} onSaveEvaluation={(bidId, evaluation) => {
              console.log('Save evaluation for bid:', bidId, evaluation);
              // In a real app, this would call an API to save the evaluation
            }} /> : <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No bids available for comparison</p>
                  </div>}
              </TabsContent>
            </Tabs> : <div className="text-center py-6 text-muted-foreground">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Bid details are only visible to the tender issuer</p>
            </div>}
        </div>
      </DialogContent>
    </Dialog>;
};