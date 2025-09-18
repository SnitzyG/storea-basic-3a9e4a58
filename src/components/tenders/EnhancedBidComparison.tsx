import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Trophy, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Users, 
  Star,
  CheckCircle,
  Award,
  BarChart3,
  Target,
  Scale,
  FileText
} from 'lucide-react';
import { TenderBid } from '@/hooks/useTenders';
import { useToast } from '@/hooks/use-toast';

interface EnhancedBidComparisonProps {
  bids: TenderBid[];
  onAwardTender?: (bidId: string) => void;
  onSaveEvaluation?: (bidId: string, evaluation: any) => void;
}

interface EvaluationCriteria {
  price: { weight: number; name: string };
  experience: { weight: number; name: string };
  timeline: { weight: number; name: string };
  technical: { weight: number; name: string };
  communication: { weight: number; name: string };
}

const SCORING_CRITERIA: EvaluationCriteria = {
  price: { weight: 30, name: 'Price Competitiveness' },
  experience: { weight: 25, name: 'Experience & Portfolio' },
  timeline: { weight: 20, name: 'Timeline Feasibility' },
  technical: { weight: 15, name: 'Technical Approach' },
  communication: { weight: 10, name: 'Communication & Clarity' }
};

export const EnhancedBidComparison: React.FC<EnhancedBidComparisonProps> = ({
  bids,
  onAwardTender,
  onSaveEvaluation
}) => {
  const { toast } = useToast();
  const [selectedBids, setSelectedBids] = useState<string[]>([]);
  const [evaluatingBid, setEvaluatingBid] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'price' | 'score' | 'timeline'>('price');
  const [evaluationData, setEvaluationData] = useState({
    price_score: 0,
    experience_score: 0,
    timeline_score: 0,
    technical_score: 0,
    communication_score: 0,
    evaluator_notes: ''
  });

  const calculateOverallScore = (scores: any) => {
    const weightedSum = 
      (scores.price_score * SCORING_CRITERIA.price.weight) +
      (scores.experience_score * SCORING_CRITERIA.experience.weight) +
      (scores.timeline_score * SCORING_CRITERIA.timeline.weight) +
      (scores.technical_score * SCORING_CRITERIA.technical.weight) +
      (scores.communication_score * SCORING_CRITERIA.communication.weight);
    
    return Math.round(weightedSum / 100);
  };

  const sortedBids = useMemo(() => {
    return [...bids].sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.bid_amount - b.bid_amount;
        case 'score':
          const scoreA = a.evaluation?.overall_score || 0;
          const scoreB = b.evaluation?.overall_score || 0;
          return scoreB - scoreA;
        case 'timeline':
          return (a.timeline_days || 0) - (b.timeline_days || 0);
        default:
          return 0;
      }
    });
  }, [bids, sortBy]);

  const averageBid = useMemo(() => {
    if (bids.length === 0) return 0;
    return bids.reduce((sum, bid) => sum + bid.bid_amount, 0) / bids.length;
  }, [bids]);

  const lowestBid = useMemo(() => {
    if (bids.length === 0) return 0;
    return Math.min(...bids.map(bid => bid.bid_amount));
  }, [bids]);

  const handleBidSelection = (bidId: string) => {
    setSelectedBids(prev => 
      prev.includes(bidId) 
        ? prev.filter(id => id !== bidId)
        : [...prev, bidId]
    );
  };

  const handleEvaluationSave = () => {
    if (!evaluatingBid) return;
    
    const overallScore = calculateOverallScore(evaluationData);
    const evaluation = {
      ...evaluationData,
      overall_score: overallScore,
      evaluated_at: new Date().toISOString(),
      evaluator_id: 'current_user'
    };

    if (onSaveEvaluation) {
      onSaveEvaluation(evaluatingBid, evaluation);
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
      communication_score: 0,
      evaluator_notes: ''
    });
  };

  const startEvaluation = (bid: TenderBid) => {
    setEvaluatingBid(bid.id);
    if (bid.evaluation) {
      setEvaluationData({
        price_score: bid.evaluation.price_score || 0,
        experience_score: bid.evaluation.experience_score || 0,
        timeline_score: bid.evaluation.timeline_score || 0,
        technical_score: bid.evaluation.technical_score || 0,
        communication_score: bid.evaluation.communication_score || 0,
        evaluator_notes: bid.evaluation.evaluator_notes || ''
      });
    }
  };

  const renderStatistics = () => (
    <div className="grid md:grid-cols-4 gap-4 mb-6">
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
              <p className="text-xl font-bold">${averageBid.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-600" />
            <div>
              <p className="text-sm text-muted-foreground">Lowest Bid</p>
              <p className="text-xl font-bold text-green-600">${lowestBid.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Evaluated</p>
              <p className="text-xl font-bold">{bids.filter(b => b.evaluation).length}/{bids.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderBidComparison = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Bid Comparison
          </CardTitle>
          <div className="flex items-center gap-2">
            <Label htmlFor="sort">Sort by:</Label>
            <select 
              id="sort"
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border rounded px-2 py-1"
            >
              <option value="price">Price (Low to High)</option>
              <option value="score">Score (High to Low)</option>
              <option value="timeline">Timeline</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedBids.map((bid, index) => (
            <Card key={bid.id} className={`relative ${selectedBids.includes(bid.id) ? 'ring-2 ring-primary' : ''}`}>
              <CardContent className="p-4">
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
                        <div className="flex items-center gap-2">
                          {index === 0 && sortBy === 'price' && (
                            <Trophy className="h-4 w-4 text-yellow-500" />
                          )}
                          <h3 className="text-lg font-semibold">
                            {bid.bidder_profile?.name || 'Unknown Bidder'}
                          </h3>
                        </div>
                        <Badge variant={bid.status === 'accepted' ? 'default' : 'secondary'}>
                          {bid.status.replace('_', ' ')}
                        </Badge>
                        {bid.evaluation && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-current" />
                            {bid.evaluation.overall_score}/100
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Bid Amount:</span>
                          <p className={`text-lg font-bold ${bid.bid_amount === lowestBid ? 'text-green-600' : ''}`}>
                            ${bid.bid_amount.toLocaleString()}
                          </p>
                          {bid.bid_amount !== lowestBid && (
                            <p className="text-xs text-muted-foreground">
                              +${(bid.bid_amount - lowestBid).toLocaleString()} vs lowest
                            </p>
                          )}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Timeline:</span>
                          <p className="font-medium">{bid.timeline_days || 'Not specified'} days</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Submitted:</span>
                          <p className="font-medium">{new Date(bid.submitted_at).toLocaleDateString()}</p>
                        </div>
                      </div>

                      {bid.proposal_text && (
                        <div className="mt-2">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {bid.proposal_text}
                          </p>
                        </div>
                      )}
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
                    
                    {bid.status === 'submitted' && bid.evaluation?.overall_score && bid.evaluation.overall_score >= 70 && (
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
                      {Object.entries(SCORING_CRITERIA).map(([key, criteria]) => (
                        <div key={key} className="text-center">
                          <div className="font-medium text-xs">{criteria.name}</div>
                          <div className="text-lg font-bold">{bid.evaluation?.[`${key}_score`] || 0}</div>
                          <Progress value={bid.evaluation?.[`${key}_score`] || 0} className="mt-1 h-1" />
                        </div>
                      ))}
                    </div>
                    {bid.evaluation.evaluator_notes && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-muted-foreground">{bid.evaluation.evaluator_notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderEvaluationModal = () => {
    const currentBid = bids.find(b => b.id === evaluatingBid);
    if (!evaluatingBid || !currentBid) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Evaluate Bid: {currentBid.bidder_profile?.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Bid Amount</p>
                <p className="text-lg font-bold">${currentBid.bid_amount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Timeline</p>
                <p className="text-lg font-bold">{currentBid.timeline_days || 'Not specified'} days</p>
              </div>
            </div>

            {Object.entries(SCORING_CRITERIA).map(([key, criteria]) => (
              <div key={key}>
                <Label htmlFor={key}>
                  {criteria.name} (Weight: {criteria.weight}%)
                </Label>
                <Input
                  id={key}
                  type="number"
                  min="0"
                  max="100"
                  value={evaluationData[`${key}_score` as keyof typeof evaluationData]}
                  onChange={(e) => setEvaluationData(prev => ({
                    ...prev,
                    [`${key}_score`]: parseInt(e.target.value) || 0
                  }))}
                  className="mt-1"
                />
                <Progress 
                  value={evaluationData[`${key}_score` as keyof typeof evaluationData] as number} 
                  className="mt-2 h-2" 
                />
              </div>
            ))}

            <div>
              <Label htmlFor="notes">Evaluation Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add detailed feedback and reasoning for your scores..."
                value={evaluationData.evaluator_notes}
                onChange={(e) => setEvaluationData(prev => ({
                  ...prev,
                  evaluator_notes: e.target.value
                }))}
                className="mt-1 min-h-[100px]"
              />
            </div>

            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-900">
                Overall Score: {calculateOverallScore(evaluationData)}/100
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEvaluatingBid(null)}>
                Cancel
              </Button>
              <Button onClick={handleEvaluationSave}>
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
      {renderStatistics()}
      
      <Tabs defaultValue="comparison">
        <TabsList>
          <TabsTrigger value="comparison">Bid Comparison</TabsTrigger>
          <TabsTrigger value="selected">Selected Bids ({selectedBids.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="comparison">
          {renderBidComparison()}
        </TabsContent>
        
        <TabsContent value="selected">
          <Card>
            <CardHeader>
              <CardTitle>Selected Bids for Detailed Review</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedBids.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Select bids from the comparison tab to review them here
                </p>
              ) : (
                <div className="space-y-4">
                  {selectedBids.map(bidId => {
                    const bid = bids.find(b => b.id === bidId);
                    if (!bid) return null;
                    
                    return (
                      <Card key={bidId} className="border-l-4 border-l-primary">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">{bid.bidder_profile?.name}</h3>
                              <p className="text-lg font-bold text-green-600">
                                ${bid.bid_amount.toLocaleString()}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEvaluation(bid)}
                            >
                              <Star className="h-4 w-4 mr-1" />
                              Evaluate
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {renderEvaluationModal()}
    </div>
  );
};