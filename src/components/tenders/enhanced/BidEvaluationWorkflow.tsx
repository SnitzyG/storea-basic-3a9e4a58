import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Award, 
  Users, 
  DollarSign, 
  Clock, 
  Star, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  MessageSquare,
  FileText,
  Calculator
} from 'lucide-react';
import { EnhancedTender, EnhancedTenderBid, useEnhancedTenders } from '@/hooks/useEnhancedTenders';

interface BidEvaluationWorkflowProps {
  tender: EnhancedTender;
  bids: EnhancedTenderBid[];
  userRole: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SCORING_CRITERIA = {
  price_weight: { name: 'Price', description: 'Cost competitiveness and value for money' },
  experience_weight: { name: 'Experience', description: 'Relevant experience and track record' },
  timeline_weight: { name: 'Timeline', description: 'Proposed schedule and delivery dates' },
  technical_weight: { name: 'Technical Approach', description: 'Technical solution and methodology' },
  communication_weight: { name: 'Communication', description: 'Clarity and completeness of proposal' },
};

export const BidEvaluationWorkflow = ({ 
  tender, 
  bids, 
  userRole, 
  open, 
  onOpenChange 
}: BidEvaluationWorkflowProps) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [evaluatingBid, setEvaluatingBid] = useState<EnhancedTenderBid | null>(null);
  const [evaluationForm, setEvaluationForm] = useState({
    price_score: 80,
    experience_score: 75,
    timeline_score: 85,
    technical_score: 80,
    communication_score: 75,
    evaluator_notes: '',
  });

  const { evaluateBid, checkComplianceAutomatically } = useEnhancedTenders(tender.project_id);

  // Calculate bid statistics
  const bidStats = useMemo(() => {
    if (bids.length === 0) return null;

    const amounts = bids.map(b => b.bid_amount);
    const durations = bids.filter(b => b.estimated_duration_days).map(b => b.estimated_duration_days!);
    
    const lowestBid = Math.min(...amounts);
    const highestBid = Math.max(...amounts);
    const avgBid = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    
    const avgDuration = durations.length > 0 ? 
      durations.reduce((sum, duration) => sum + duration, 0) / durations.length : 0;

    const evaluatedBids = bids.filter(b => b.overall_score > 0);
    const compliantBids = bids.filter(b => b.compliance_checked && b.compliance_issues.length === 0);

    return {
      lowestBid,
      highestBid,
      avgBid,
      avgDuration,
      evaluatedCount: evaluatedBids.length,
      compliantCount: compliantBids.length,
      totalCount: bids.length,
    };
  }, [bids]);

  // Sort bids by overall score (highest first)
  const sortedBids = useMemo(() => {
    return [...bids].sort((a, b) => {
      if (a.overall_score === b.overall_score) {
        return a.bid_amount - b.bid_amount; // Lower price wins if scores are equal
      }
      return b.overall_score - a.overall_score;
    });
  }, [bids]);

  const handleEvaluateBid = (bid: EnhancedTenderBid) => {
    setEvaluatingBid(bid);
    // Pre-fill with existing evaluation if available
    if (bid.overall_score > 0) {
      setEvaluationForm({
        price_score: bid.price_score || 80,
        experience_score: bid.experience_score || 75,
        timeline_score: bid.timeline_score || 85,
        technical_score: bid.technical_score || 80,
        communication_score: bid.communication_score || 75,
        evaluator_notes: bid.evaluator_notes || '',
      });
    }
  };

  const handleSaveEvaluation = async () => {
    if (!evaluatingBid) return;

    const success = await evaluateBid(evaluatingBid.id, evaluationForm);
    if (success) {
      setEvaluatingBid(null);
      setEvaluationForm({
        price_score: 80,
        experience_score: 75,
        timeline_score: 85,
        technical_score: 80,
        communication_score: 75,
        evaluator_notes: '',
      });
    }
  };

  const calculateOverallScore = () => {
    const criteria = tender.evaluation_criteria;
    return (
      (evaluationForm.price_score * criteria.price_weight / 100) +
      (evaluationForm.experience_score * criteria.experience_weight / 100) +
      (evaluationForm.timeline_score * criteria.timeline_weight / 100) +
      (evaluationForm.technical_score * criteria.technical_weight / 100) +
      (evaluationForm.communication_score * criteria.communication_weight / 100)
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getComplianceStatus = (bid: EnhancedTenderBid) => {
    if (!bid.compliance_checked) return { status: 'pending', color: 'bg-gray-100 text-gray-700' };
    if (bid.compliance_issues.length === 0) return { status: 'compliant', color: 'bg-green-100 text-green-700' };
    return { status: 'issues', color: 'bg-red-100 text-red-700' };
  };

  if (!bidStats) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>No Bids to Evaluate</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No bids have been submitted for this tender yet.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Bid Evaluation - {tender.title}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
            <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Total Bids</span>
                  </div>
                  <div className="text-2xl font-bold">{bidStats.totalCount}</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Avg Bid</span>
                  </div>
                  <div className="text-2xl font-bold">${bidStats.avgBid.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Evaluated</span>
                  </div>
                  <div className="text-2xl font-bold">{bidStats.evaluatedCount}/{bidStats.totalCount}</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Compliant</span>
                  </div>
                  <div className="text-2xl font-bold">{bidStats.compliantCount}/{bidStats.totalCount}</div>
                </CardContent>
              </Card>
            </div>

            {/* Evaluation Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Evaluation Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Bids Evaluated</span>
                    <span>{bidStats.evaluatedCount} of {bidStats.totalCount}</span>
                  </div>
                  <Progress value={(bidStats.evaluatedCount / bidStats.totalCount) * 100} />
                </div>
              </CardContent>
            </Card>

            {/* Bid List with Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Submitted Bids</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sortedBids.map(bid => {
                    const compliance = getComplianceStatus(bid);
                    
                    return (
                      <div key={bid.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium">{bid.bidder_profile?.name || 'Unknown Bidder'}</h4>
                            <Badge className={compliance.color}>
                              {compliance.status === 'pending' ? 'Compliance Pending' :
                               compliance.status === 'compliant' ? 'Compliant' : 
                               `${bid.compliance_issues.length} Issues`}
                            </Badge>
                            {bid.overall_score > 0 && (
                              <Badge variant="outline">
                                Score: {bid.overall_score.toFixed(1)}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                            <div>
                              <span className="font-medium">${bid.bid_amount.toLocaleString()}</span>
                            </div>
                            <div>
                              {bid.estimated_duration_days ? `${bid.estimated_duration_days} days` : 'No timeline'}
                            </div>
                            <div>
                              Submitted {new Date(bid.submitted_at).toLocaleDateString()}
                            </div>
                            <div>
                              Status: <span className="capitalize">{bid.status}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {!bid.compliance_checked && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => checkComplianceAutomatically(bid.id)}
                            >
                              Check Compliance
                            </Button>
                          )}
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEvaluateBid(bid)}
                          >
                            {bid.overall_score > 0 ? 'Update' : 'Evaluate'}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-4">
            {/* Side-by-side bid comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedBids.slice(0, 6).map(bid => (
                <Card key={bid.id} className={bid.overall_score > 0 ? 'border-green-200' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{bid.bidder_profile?.name}</h4>
                      {bid.overall_score > 0 && (
                        <Badge className={getScoreColor(bid.overall_score)}>
                          {bid.overall_score.toFixed(1)}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-2xl font-bold text-primary">
                      ${bid.bid_amount.toLocaleString()}
                    </div>
                    
                    {bid.estimated_duration_days && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4" />
                        {bid.estimated_duration_days} days
                      </div>
                    )}

                    {bid.overall_score > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-medium">Score Breakdown:</div>
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          <div>Price: {bid.price_score}/100</div>
                          <div>Experience: {bid.experience_score}/100</div>
                          <div>Timeline: {bid.timeline_score}/100</div>
                          <div>Technical: {bid.technical_score}/100</div>
                        </div>
                      </div>
                    )}

                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleEvaluateBid(bid)}
                    >
                      {bid.overall_score > 0 ? 'Review' : 'Evaluate'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="evaluation" className="space-y-4">
            {/* Evaluation criteria weights */}
            <Card>
              <CardHeader>
                <CardTitle>Evaluation Criteria Weights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(tender.evaluation_criteria).map(([key, weight]) => (
                    <div key={key} className="text-center">
                      <div className="text-2xl font-bold">{weight}%</div>
                      <div className="text-sm text-muted-foreground">
                        {SCORING_CRITERIA[key as keyof typeof SCORING_CRITERIA]?.name}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Ranked bids table */}
            <Card>
              <CardHeader>
                <CardTitle>Evaluation Rankings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Rank</th>
                        <th className="text-left p-2">Bidder</th>
                        <th className="text-left p-2">Bid Amount</th>
                        <th className="text-left p-2">Overall Score</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedBids.map((bid, index) => (
                        <tr key={bid.id} className="border-b">
                          <td className="p-2">
                            <Badge variant={index === 0 ? 'default' : 'outline'}>
                              #{index + 1}
                            </Badge>
                          </td>
                          <td className="p-2 font-medium">{bid.bidder_profile?.name}</td>
                          <td className="p-2">${bid.bid_amount.toLocaleString()}</td>
                          <td className="p-2">
                            {bid.overall_score > 0 ? (
                              <span className={getScoreColor(bid.overall_score)}>
                                {bid.overall_score.toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Not evaluated</span>
                            )}
                          </td>
                          <td className="p-2">
                            <Badge className={getComplianceStatus(bid).color}>
                              {getComplianceStatus(bid).status}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEvaluateBid(bid)}
                            >
                              Evaluate
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            {/* Evaluation summary report */}
            <Card>
              <CardHeader>
                <CardTitle>Evaluation Summary Report</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Bid Statistics</h4>
                    <div className="space-y-1 text-sm">
                      <div>Lowest Bid: ${bidStats.lowestBid.toLocaleString()}</div>
                      <div>Highest Bid: ${bidStats.highestBid.toLocaleString()}</div>
                      <div>Average Bid: ${bidStats.avgBid.toLocaleString()}</div>
                      {bidStats.avgDuration > 0 && (
                        <div>Avg Duration: {Math.round(bidStats.avgDuration)} days</div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Evaluation Status</h4>
                    <div className="space-y-1 text-sm">
                      <div>Total Bids: {bidStats.totalCount}</div>
                      <div>Evaluated: {bidStats.evaluatedCount}</div>
                      <div>Compliant: {bidStats.compliantCount}</div>
                      <div>Completion: {Math.round((bidStats.evaluatedCount / bidStats.totalCount) * 100)}%</div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    Export Summary
                  </Button>
                  <Button variant="outline">
                    <Calculator className="w-4 h-4 mr-2" />
                    Detailed Analysis
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Evaluation Dialog */}
        {evaluatingBid && (
          <Dialog open={!!evaluatingBid} onOpenChange={() => setEvaluatingBid(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  Evaluate Bid - {evaluatingBid.bidder_profile?.name}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Bid Summary */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>Bid Amount: <span className="font-medium">${evaluatingBid.bid_amount.toLocaleString()}</span></div>
                    <div>Timeline: <span className="font-medium">{evaluatingBid.estimated_duration_days || 'Not specified'} days</span></div>
                  </div>
                </div>

                {/* Scoring Section */}
                <div className="space-y-4">
                  {Object.entries(SCORING_CRITERIA).map(([key, criteria]) => {
                    const scoreKey = key as keyof typeof evaluationForm;
                    const weight = tender.evaluation_criteria[key as keyof typeof tender.evaluation_criteria];
                    
                    return (
                      <div key={key} className="space-y-2">
                        <div className="flex justify-between">
                          <Label className="font-medium">
                            {criteria.name} ({weight}% weight)
                          </Label>
                          <span className="text-sm font-medium">
                            {evaluationForm[scoreKey]}/100
                          </span>
                        </div>
                  <Slider
                    value={[Number(evaluationForm[scoreKey])]}
                    onValueChange={(value) => 
                      setEvaluationForm(prev => ({ ...prev, [scoreKey]: value[0] }))
                    }
                          max={100}
                          min={0}
                          step={5}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">{criteria.description}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Overall Score Preview */}
                <div className="p-4 bg-primary/5 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Overall Score:</span>
                    <span className="text-2xl font-bold text-primary">
                      {calculateOverallScore().toFixed(1)}/100
                    </span>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Evaluation Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any additional comments or observations..."
                    value={evaluationForm.evaluator_notes}
                    onChange={(e) => setEvaluationForm(prev => ({ ...prev, evaluator_notes: e.target.value }))}
                    rows={3}
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEvaluatingBid(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveEvaluation}>
                    Save Evaluation
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};