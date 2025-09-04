import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Trophy, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Users, 
  FileText, 
  Star,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUp,
  ArrowDown,
  Eye,
  Award,
  MessageSquare,
  Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BidData {
  id: string;
  bidder_name: string;
  bidder_email: string;
  company_name: string;
  abn: string;
  bid_amount: number;
  timeline_days: number;
  submitted_at: string;
  status: 'submitted' | 'under_review' | 'shortlisted' | 'awarded' | 'rejected';
  company_info: {
    businessName: string;
    abn: string;
    establishedYear: string;
    employeeCount: string;
    experienceSummary: string;
    insuranceProvider: string;
    publicLiabilityAmount: string;
    licenseNumber: string;
  };
  financial_proposal: {
    subtotal: number;
    gst_amount: number;
    total_inc_gst: number;
    paymentSchedule: string;
  };
  execution_details: {
    startDate: string;
    completionDate: string;
    proposedTimeline: string;
    riskAssessment: string;
    qualityAssurance: string;
    safetyManagement: string;
  };
  documents: Array<{
    name: string;
    category: string;
    size: number;
  }>;
  evaluation?: {
    price_score: number;
    experience_score: number;
    timeline_score: number;
    technical_score: number;
    risk_score: number;
    overall_score: number;
    evaluator_notes: string;
    evaluated_at: string;
    evaluator_id: string;
  };
}

interface TenderReviewDashboardProps {
  tender: {
    id: string;
    title: string;
    budget?: number;
    deadline: string;
    status: string;
  };
  bids: BidData[];
  onAwardTender?: (bidId: string) => void;
  onUpdateBidStatus?: (bidId: string, status: string) => void;
  onSaveEvaluation?: (bidId: string, evaluation: any) => void;
}

const SCORING_CRITERIA = {
  price: { weight: 30, name: 'Price Competitiveness' },
  experience: { weight: 25, name: 'Experience & Qualifications' },
  timeline: { weight: 20, name: 'Timeline Feasibility' },
  technical: { weight: 15, name: 'Technical Approach' },
  risk: { weight: 10, name: 'Risk Assessment' }
};

const TenderReviewDashboard: React.FC<TenderReviewDashboardProps> = ({
  tender,
  bids,
  onAwardTender,
  onUpdateBidStatus,
  onSaveEvaluation
}) => {
  const { toast } = useToast();
  const [selectedBids, setSelectedBids] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [sortBy, setSortBy] = useState<'price' | 'score' | 'timeline' | 'submitted'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [evaluatingBid, setEvaluatingBid] = useState<string | null>(null);
  const [evaluationData, setEvaluationData] = useState({
    price_score: 0,
    experience_score: 0,
    timeline_score: 0,
    technical_score: 0,
    risk_score: 0,
    evaluator_notes: ''
  });

  const calculateOverallScore = (scores: any) => {
    const weightedSum = 
      (scores.price_score * SCORING_CRITERIA.price.weight) +
      (scores.experience_score * SCORING_CRITERIA.experience.weight) +
      (scores.timeline_score * SCORING_CRITERIA.timeline.weight) +
      (scores.technical_score * SCORING_CRITERIA.technical.weight) +
      (scores.risk_score * SCORING_CRITERIA.risk.weight);
    
    return Math.round(weightedSum / 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'secondary';
      case 'under_review': return 'default';
      case 'shortlisted': return 'outline';
      case 'awarded': return 'default';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const sortedAndFilteredBids = useMemo(() => {
    let filtered = bids;
    
    if (filterStatus !== 'all') {
      filtered = bids.filter(bid => bid.status === filterStatus);
    }

    return filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'price':
          aValue = a.bid_amount;
          bValue = b.bid_amount;
          break;
        case 'score':
          aValue = a.evaluation?.overall_score || 0;
          bValue = b.evaluation?.overall_score || 0;
          break;
        case 'timeline':
          aValue = a.timeline_days;
          bValue = b.timeline_days;
          break;
        case 'submitted':
          aValue = new Date(a.submitted_at).getTime();
          bValue = new Date(b.submitted_at).getTime();
          break;
        default:
          return 0;
      }

      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }, [bids, sortBy, sortOrder, filterStatus]);

  const averageBid = useMemo(() => {
    if (bids.length === 0) return 0;
    return bids.reduce((sum, bid) => sum + bid.bid_amount, 0) / bids.length;
  }, [bids]);

  const lowestBid = useMemo(() => {
    if (bids.length === 0) return 0;
    return Math.min(...bids.map(bid => bid.bid_amount));
  }, [bids]);

  const highestBid = useMemo(() => {
    if (bids.length === 0) return 0;
    return Math.max(...bids.map(bid => bid.bid_amount));
  }, [bids]);

  const evaluatedBids = useMemo(() => {
    return bids.filter(bid => bid.evaluation).length;
  }, [bids]);

  const handleBidSelection = (bidId: string) => {
    setSelectedBids(prev => 
      prev.includes(bidId) 
        ? prev.filter(id => id !== bidId)
        : [...prev, bidId]
    );
  };

  const handleEvaluationSave = (bidId: string) => {
    const overallScore = calculateOverallScore(evaluationData);
    const evaluation = {
      ...evaluationData,
      overall_score: overallScore,
      evaluated_at: new Date().toISOString(),
      evaluator_id: 'current_user' // This would come from auth context
    };

    if (onSaveEvaluation) {
      onSaveEvaluation(bidId, evaluation);
    }

    toast({
      title: "Evaluation Saved",
      description: `Bid evaluation completed with overall score of ${overallScore}/100`
    });

    setEvaluatingBid(null);
    setEvaluationData({
      price_score: 0,
      experience_score: 0,
      timeline_score: 0,
      technical_score: 0,
      risk_score: 0,
      evaluator_notes: ''
    });
  };

  const startEvaluation = (bid: BidData) => {
    setEvaluatingBid(bid.id);
    if (bid.evaluation) {
      setEvaluationData({
        price_score: bid.evaluation.price_score,
        experience_score: bid.evaluation.experience_score,
        timeline_score: bid.evaluation.timeline_score,
        technical_score: bid.evaluation.technical_score,
        risk_score: bid.evaluation.risk_score,
        evaluator_notes: bid.evaluation.evaluator_notes
      });
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Bids</p>
                <p className="text-2xl font-bold">{bids.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Average Bid</p>
                <p className="text-2xl font-bold">${averageBid.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Evaluated</p>
                <p className="text-2xl font-bold">{evaluatedBids}/{bids.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">Bid Range</p>
                <p className="text-lg font-bold">
                  ${lowestBid.toLocaleString()} - ${highestBid.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Sorting */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter & Sort Bids
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedBids([])}
                disabled={selectedBids.length === 0}
              >
                Clear Selection ({selectedBids.length})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Sort By</Label>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="score">Overall Score</SelectItem>
                  <SelectItem value="price">Bid Amount</SelectItem>
                  <SelectItem value="timeline">Timeline</SelectItem>
                  <SelectItem value="submitted">Date Submitted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Order</Label>
              <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Descending</SelectItem>
                  <SelectItem value="asc">Ascending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Filter by Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="shortlisted">Shortlisted</SelectItem>
                  <SelectItem value="awarded">Awarded</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bid List */}
      <div className="space-y-4">
        {sortedAndFilteredBids.map((bid) => (
          <Card key={bid.id} className="relative">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={selectedBids.includes(bid.id)}
                    onChange={() => handleBidSelection(bid.id)}
                    className="mt-1"
                  />
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{bid.company_name}</h3>
                      <Badge variant={getStatusColor(bid.status)}>
                        {bid.status.replace('_', ' ')}
                      </Badge>
                      {bid.evaluation && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {bid.evaluation.overall_score}/100
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Bid Amount:</span>
                        <p className="font-semibold text-lg">${bid.bid_amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Timeline:</span>
                        <p className="font-medium">{bid.timeline_days} days</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">ABN:</span>
                        <p className="font-medium">{bid.company_info.abn}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Documents:</span>
                        <p className="font-medium">{bid.documents.length} files</p>
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      Submitted: {new Date(bid.submitted_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEvaluation(bid)}
                  >
                    <Star className="h-4 w-4 mr-1" />
                    {bid.evaluation ? 'Edit Score' : 'Evaluate'}
                  </Button>
                  
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>

                  {bid.status === 'shortlisted' && (
                    <Button
                      size="sm"
                      onClick={() => onAwardTender?.(bid.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Award className="h-4 w-4 mr-1" />
                      Award
                    </Button>
                  )}
                </div>
              </div>

              {bid.evaluation && (
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <div className="grid md:grid-cols-5 gap-3 text-sm">
                    <div className="text-center">
                      <div className="font-medium">Price</div>
                      <div className="text-lg font-bold text-green-600">{bid.evaluation.price_score}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">Experience</div>
                      <div className="text-lg font-bold text-blue-600">{bid.evaluation.experience_score}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">Timeline</div>
                      <div className="text-lg font-bold text-purple-600">{bid.evaluation.timeline_score}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">Technical</div>
                      <div className="text-lg font-bold text-orange-600">{bid.evaluation.technical_score}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">Risk</div>
                      <div className="text-lg font-bold text-red-600">{bid.evaluation.risk_score}</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderComparison = () => (
    <div className="space-y-6">
      {selectedBids.length < 2 && (
        <Alert>
          <MessageSquare className="h-4 w-4" />
          <AlertDescription>
            Select at least 2 bids to use the comparison tool.
          </AlertDescription>
        </Alert>
      )}

      {selectedBids.length >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Side-by-Side Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left p-3 border-b">Criteria</th>
                    {selectedBids.map(bidId => {
                      const bid = bids.find(b => b.id === bidId);
                      return (
                        <th key={bidId} className="text-center p-3 border-b min-w-[200px]">
                          {bid?.company_name}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-3 border-b font-medium">Bid Amount</td>
                    {selectedBids.map(bidId => {
                      const bid = bids.find(b => b.id === bidId);
                      return (
                        <td key={bidId} className="p-3 border-b text-center">
                          <div className="text-lg font-bold">
                            ${bid?.bid_amount.toLocaleString()}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                  
                  <tr>
                    <td className="p-3 border-b font-medium">Timeline</td>
                    {selectedBids.map(bidId => {
                      const bid = bids.find(b => b.id === bidId);
                      return (
                        <td key={bidId} className="p-3 border-b text-center">
                          {bid?.timeline_days} days
                        </td>
                      );
                    })}
                  </tr>

                  <tr>
                    <td className="p-3 border-b font-medium">Overall Score</td>
                    {selectedBids.map(bidId => {
                      const bid = bids.find(b => b.id === bidId);
                      return (
                        <td key={bidId} className="p-3 border-b text-center">
                          {bid?.evaluation ? (
                            <Badge variant="outline" className="text-lg">
                              {bid.evaluation.overall_score}/100
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">Not evaluated</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  <tr>
                    <td className="p-3 border-b font-medium">Experience</td>
                    {selectedBids.map(bidId => {
                      const bid = bids.find(b => b.id === bidId);
                      return (
                        <td key={bidId} className="p-3 border-b text-center text-sm">
                          {bid?.company_info.experienceSummary.substring(0, 100)}...
                        </td>
                      );
                    })}
                  </tr>

                  <tr>
                    <td className="p-3 border-b font-medium">Insurance Coverage</td>
                    {selectedBids.map(bidId => {
                      const bid = bids.find(b => b.id === bidId);
                      return (
                        <td key={bidId} className="p-3 border-b text-center">
                          {bid?.company_info.publicLiabilityAmount}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderEvaluationModal = () => {
    if (!evaluatingBid) return null;
    
    const bid = bids.find(b => b.id === evaluatingBid);
    if (!bid) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <CardHeader>
            <CardTitle>Evaluate Bid - {bid.company_name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {Object.entries(SCORING_CRITERIA).map(([key, criteria]) => (
                <div key={key}>
                  <Label className="text-sm font-medium">
                    {criteria.name} ({criteria.weight}% weight)
                  </Label>
                  <div className="space-y-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={evaluationData[`${key}_score` as keyof typeof evaluationData]}
                      onChange={(e) => setEvaluationData(prev => ({
                        ...prev,
                        [`${key}_score`]: parseInt(e.target.value) || 0
                      }))}
                      placeholder="Score out of 100"
                    />
                    <Progress 
                      value={evaluationData[`${key}_score` as keyof typeof evaluationData] as number} 
                      className="w-full" 
                    />
                  </div>
                </div>
              ))}
            </div>

            <div>
              <Label>Evaluator Notes</Label>
              <Textarea
                value={evaluationData.evaluator_notes}
                onChange={(e) => setEvaluationData(prev => ({
                  ...prev,
                  evaluator_notes: e.target.value
                }))}
                placeholder="Add your evaluation notes, concerns, or recommendations..."
                rows={4}
              />
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Calculated Overall Score</div>
                <div className="text-3xl font-bold text-primary">
                  {calculateOverallScore(evaluationData)}/100
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEvaluatingBid(null)}>
                Cancel
              </Button>
              <Button onClick={() => handleEvaluationSave(bid.id)}>
                Save Evaluation
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tender Review Dashboard</h2>
          <p className="text-muted-foreground">{tender.title}</p>
        </div>
        <Badge variant="outline" className="text-lg px-3 py-1">
          {bids.length} Bids Received
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview & Evaluation</TabsTrigger>
          <TabsTrigger value="comparison">Bid Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {renderOverview()}
        </TabsContent>

        <TabsContent value="comparison">
          {renderComparison()}
        </TabsContent>
      </Tabs>

      {renderEvaluationModal()}
    </div>
  );
};

export default TenderReviewDashboard;