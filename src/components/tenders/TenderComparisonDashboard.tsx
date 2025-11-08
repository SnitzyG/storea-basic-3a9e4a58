import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Users, BarChart3, Download, Filter, Star, Clock, Award, Target, FileText, Package, ChevronDown, Building2 } from 'lucide-react';
import { TenderBid } from '@/hooks/useTenders';
import { downloadFromStorage } from '@/utils/storageUtils';
import { toast } from 'sonner';
import { BidLineItemsTable } from './BidLineItemsTable';
import { supabase } from '@/integrations/supabase/client';

interface TenderComparisonDashboardProps {
  tenderId: string;
  bids?: TenderBid[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#d084d0'];

export const TenderComparisonDashboard: React.FC<TenderComparisonDashboardProps> = ({
  tenderId,
  bids: propsBids
}) => {
  const [bids, setBids] = useState<TenderBid[]>(propsBids || []);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'price' | 'timeline' | 'score'>('price');
  const [filterBy, setFilterBy] = useState<'all' | 'submitted' | 'under_review'>('all');

  // Fetch bids from database
  useEffect(() => {
    console.log('TenderComparisonDashboard mounted with tenderId:', tenderId);
    console.log('tenderId type:', typeof tenderId);
    console.log('tenderId length:', tenderId?.length);
    fetchBids();
  }, [tenderId]);

  const fetchBids = async () => {
    try {
      setLoading(true);
      console.log('Fetching bids for tender:', tenderId);
      
      const { data, error } = await supabase
        .from('tender_bids')
        .select('*')
        .eq('tender_id', tenderId)
        .order('bid_amount', { ascending: true });

      if (error) {
        console.error('Error fetching bids:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        toast.error(`Failed to fetch bids: ${error.message}`);
        return;
      }

      console.log('Fetched bids:', data);
      console.log('Number of bids:', data?.length || 0);
      
      // Fetch bidder profiles with company information
      if (data && data.length > 0) {
        const bidderIds = data.map(bid => bid.bidder_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select(`
            user_id,
            name,
            role,
            company:companies(name)
          `)
          .in('user_id', bidderIds);
        
        console.log('Fetched profiles with companies:', profiles);
        
        // Enrich bids with profile and company data
        const enrichedBids = data.map(bid => ({
          ...bid,
          bidder_profile: profiles?.find(p => p.user_id === bid.bidder_id)
        }));
        
        console.log('Enriched bids:', enrichedBids);
        setBids(enrichedBids as any);
      } else {
        setBids([]);
      }
    } catch (error) {
      console.error('Error fetching bids:', error);
      toast.error('Failed to fetch bids');
    } finally {
      setLoading(false);
    }
  };
  const filteredBids = useMemo(() => {
    return bids.filter(bid => filterBy === 'all' || bid.status === filterBy);
  }, [bids, filterBy]);
  const sortedBids = useMemo(() => {
    return [...filteredBids].sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.bid_amount - b.bid_amount;
        case 'timeline':
          return (a.timeline_days || 0) - (b.timeline_days || 0);
        case 'score':
          const scoreA = a.evaluation ? (a.evaluation.price_score + a.evaluation.experience_score + a.evaluation.timeline_score + a.evaluation.technical_score + a.evaluation.communication_score) / 5 : 0;
          const scoreB = b.evaluation ? (b.evaluation.price_score + b.evaluation.experience_score + b.evaluation.timeline_score + b.evaluation.technical_score + b.evaluation.communication_score) / 5 : 0;
          return scoreB - scoreA;
        default:
          return 0;
      }
    });
  }, [filteredBids, sortBy]);
  const priceAnalysis = useMemo(() => {
    const prices = bids.map(bid => bid.bid_amount);
    if (prices.length === 0) {
      return {
        highest: 0,
        lowest: 0,
        average: 0,
        range: 0,
        savings: 0
      };
    }
    return {
      highest: Math.max(...prices),
      lowest: Math.min(...prices),
      average: prices.reduce((sum, price) => sum + price, 0) / prices.length,
      range: Math.max(...prices) - Math.min(...prices),
      savings: Math.max(...prices) - Math.min(...prices)
    };
  }, [bids]);
  const timelineAnalysis = useMemo(() => {
    const timelines = bids.map(bid => bid.timeline_days || 0);
    if (timelines.length === 0) {
      return {
        fastest: 0,
        slowest: 0,
        average: 0,
        range: 0
      };
    }
    return {
      fastest: Math.min(...timelines),
      slowest: Math.max(...timelines),
      average: timelines.reduce((sum, days) => sum + days, 0) / timelines.length,
      range: Math.max(...timelines) - Math.min(...timelines)
    };
  }, [bids]);
  const chartData = useMemo(() => {
    return sortedBids.map(bid => ({
      name: bid.bidder_profile?.name || 'Unknown Bidder',
      price: bid.bid_amount,
      timeline: bid.timeline_days || 0,
      overallScore: bid.evaluation ? (bid.evaluation.price_score + bid.evaluation.experience_score + bid.evaluation.timeline_score + bid.evaluation.technical_score + bid.evaluation.communication_score) / 5 : 0
    }));
  }, [sortedBids]);
  const pieChartData = useMemo(() => {
    return sortedBids.map((bid, index) => ({
      name: bid.bidder_profile?.name || 'Unknown Bidder',
      value: bid.bid_amount,
      percentage: (bid.bid_amount / bids.reduce((sum, b) => sum + b.bid_amount, 0) * 100).toFixed(1)
    }));
  }, [sortedBids, bids]);
  const radarData = useMemo(() => {
    return sortedBids.map(bid => ({
      bidder: bid.bidder_profile?.name || 'Unknown',
      Price: bid.evaluation?.price_score || 0,
      Experience: bid.evaluation?.experience_score || 0,
      Timeline: bid.evaluation?.timeline_score || 0,
      Technical: bid.evaluation?.technical_score || 0,
      Communication: bid.evaluation?.communication_score || 0
    }));
  }, [sortedBids]);
  const exportData = () => {
    const csvContent = [['Bidder', 'Price', 'Timeline (Days)', 'Overall Score', 'Status'], ...sortedBids.map(bid => [bid.bidder_profile?.name || 'Unknown', bid.bid_amount.toString(), (bid.timeline_days || 0).toString(), bid.evaluation ? ((bid.evaluation.price_score + bid.evaluation.experience_score + bid.evaluation.timeline_score + bid.evaluation.technical_score + bid.evaluation.communication_score) / 5).toFixed(1) : '0', bid.status])].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], {
      type: 'text/csv'
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tender-comparison-${tenderId}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };
  const renderOverviewTab = () => <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Bids</p>
                <p className="text-2xl font-bold">{bids.length}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Price Range</p>
                <p className="text-2xl font-bold">{bids.length === 0 ? 'N/A' : `$${(priceAnalysis.range / 1000).toFixed(0)}k`}</p>
                <p className="text-xs text-muted-foreground">
                  {bids.length === 0 ? 'No bids received' : `$${(priceAnalysis.lowest / 1000).toFixed(0)}k - $${(priceAnalysis.highest / 1000).toFixed(0)}k`}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Potential Savings</p>
                <p className="text-2xl font-bold text-green-600">{bids.length === 0 ? 'N/A' : `$${(priceAnalysis.savings / 1000).toFixed(0)}k`}</p>
                <p className="text-xs text-muted-foreground">
                  {bids.length === 0 ? 'No bids received' : `${(priceAnalysis.savings / priceAnalysis.highest * 100).toFixed(1)}% below highest`}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Timeline Range</p>
                <p className="text-2xl font-bold">{bids.length === 0 ? 'N/A' : `${timelineAnalysis.range} days`}</p>
                <p className="text-xs text-muted-foreground">
                  {bids.length === 0 ? 'No bids received' : `${timelineAnalysis.fastest} - ${timelineAnalysis.slowest} days`}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Bid Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Bid Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {sortedBids.map((bid) => {
              const isLowest = bid.bid_amount === priceAnalysis.lowest;
              const isFastest = bid.timeline_days === timelineAnalysis.fastest;
              const overallScore = bid.evaluation ? (bid.evaluation.price_score + bid.evaluation.experience_score + bid.evaluation.timeline_score + bid.evaluation.technical_score + bid.evaluation.communication_score) / 5 : 0;
              const attachments = bid.attachments || [];
              const [isExpanded, setIsExpanded] = useState(true);
              
              const bidderName = bid.bidder_profile?.name || 'Unknown Bidder';
              const companyName = (bid.bidder_profile as any)?.company?.name || '';
              
              return (
                <Collapsible key={bid.id} open={isExpanded} onOpenChange={setIsExpanded}>
                  <Card className="border-2">
                    <CollapsibleTrigger asChild>
                      <CardHeader className="bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-semibold">{bidderName}</span>
                                {isLowest && <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">Lowest Price</Badge>}
                                {isFastest && <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">Fastest</Badge>}
                              </div>
                              {companyName && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Building2 className="h-3 w-3" />
                                  <span>{companyName}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant={bid.status === 'submitted' ? 'default' : bid.status === 'accepted' ? 'default' : 'secondary'}>
                              {bid.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <ChevronDown className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-6">
                        {/* Summary Info */}
                        <div className="grid grid-cols-4 gap-4 mb-6">
                          <div className="text-center p-4 bg-primary/5 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Bid Amount</p>
                            <p className="text-2xl font-bold text-primary">${(bid.bid_amount / 1000).toFixed(0)}k</p>
                          </div>
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Timeline</p>
                            <p className="text-2xl font-bold text-blue-600">{bid.timeline_days || 'N/A'}</p>
                            <p className="text-xs text-muted-foreground">days</p>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Documents</p>
                            <p className="text-2xl font-bold text-green-600">{attachments.length}</p>
                            <p className="text-xs text-muted-foreground">files</p>
                          </div>
                          <div className="text-center p-4 bg-amber-50 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Overall Score</p>
                            <p className="text-2xl font-bold text-amber-600">{overallScore.toFixed(1)}</p>
                            <p className="text-xs text-muted-foreground">out of 10</p>
                          </div>
                        </div>

                        <Separator className="my-4" />

                        {/* Bid Documents */}
                        {attachments.length > 0 && (
                          <div className="mb-6">
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Supporting Documents ({attachments.length})
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {attachments.map((doc: any, docIndex: number) => (
                                <div key={docIndex} className="flex items-center justify-between p-3 border rounded-lg bg-background hover:bg-muted/50 transition-colors">
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                      <p className="font-medium truncate">{doc.name || 'Document ' + (docIndex + 1)}</p>
                                      {doc.file_size && (
                                        <p className="text-xs text-muted-foreground">
                                          {(doc.file_size / 1024).toFixed(2)} KB
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      if (doc.file_path) {
                                        downloadFromStorage(doc.file_path, doc.name || 'document');
                                      } else {
                                        toast.error('File path not available');
                                      }
                                    }}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Proposal Text */}
                        {bid.proposal_text && (
                          <div className="mb-6">
                            <h4 className="font-semibold mb-2">Proposal Notes</h4>
                            <p className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg whitespace-pre-wrap">
                              {bid.proposal_text}
                            </p>
                          </div>
                        )}

                        <Separator className="my-4" />

                        {/* Line Item Breakdown */}
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Line Item Breakdown
                          </h4>
                          <BidLineItemsTable bidId={bid.id} tenderId={tenderId} />
                        </div>

                        {/* Submission Details */}
                        <div className="mt-6 pt-4 border-t">
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>Submitted: {new Date(bid.submitted_at).toLocaleString()}</span>
                            {bid.updated_at !== bid.submitted_at && (
                              <span>Last updated: {new Date(bid.updated_at).toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}

            {sortedBids.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Bids Submitted</h3>
                <p className="text-muted-foreground">
                  Bid details will appear here once builders submit their proposals.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>;
  const renderChartsTab = () => <div className="space-y-6">
      {/* Price Comparison Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Price Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} />
              <YAxis />
              <Tooltip formatter={(value: any) => [`$${(value / 1000).toFixed(0)}k`, 'Price']} />
              <Bar dataKey="price" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Timeline vs Price Scatter */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Timeline Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} />
                <YAxis />
                <Tooltip formatter={(value: any) => [`${value} days`, 'Timeline']} />
                <Bar dataKey="timeline" fill="hsl(var(--secondary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Price Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieChartData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({
                percentage
              }) => `${percentage}%`}>
                  {pieChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value: any) => [`$${(value / 1000).toFixed(0)}k`, 'Price']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Radar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData[0] ? [radarData[0]] : []}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              {radarData.map((bid, index) => <Radar key={index} name={bid.bidder} dataKey="value" stroke={COLORS[index % COLORS.length]} fill={COLORS[index % COLORS.length]} fillOpacity={0.1} />)}
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>;
  const renderAnalyticsTab = () => <div className="space-y-6">
      {/* High/Low Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Best Value Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Lowest Price:</span>
                <span className="text-green-600 font-semibold">
                  {bids.length === 0 ? 'N/A' : `$${(priceAnalysis.lowest / 1000).toFixed(0)}k`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Fastest Timeline:</span>
                <span className="text-blue-600 font-semibold">
                  {bids.length === 0 ? 'N/A' : `${timelineAnalysis.fastest} days`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Potential Savings:</span>
                <span className="text-green-600 font-semibold">
                  {bids.length === 0 ? 'N/A' : `$${(priceAnalysis.savings / 1000).toFixed(0)}k (${(priceAnalysis.savings / priceAnalysis.highest * 100).toFixed(1)}%)`}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-600" />
              Risk Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Highest Price:</span>
                <span className="text-red-600 font-semibold">
                  {bids.length === 0 ? 'N/A' : `$${(priceAnalysis.highest / 1000).toFixed(0)}k`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Longest Timeline:</span>
                <span className="text-orange-600 font-semibold">
                  {bids.length === 0 ? 'N/A' : `${timelineAnalysis.slowest} days`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Price Variance:</span>
                <span className="text-orange-600 font-semibold">
                  {bids.length === 0 ? 'N/A' : `$${(priceAnalysis.range / 1000).toFixed(0)}k`}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Performance Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Bidder</th>
                  <th className="text-right p-2">Price</th>
                  <th className="text-right p-2">Timeline</th>
                  <th className="text-right p-2">Price Score</th>
                  <th className="text-right p-2">Experience</th>
                  <th className="text-right p-2">Technical</th>
                  <th className="text-right p-2">Overall</th>
                </tr>
              </thead>
              <tbody>
                {sortedBids.map(bid => {
                const overallScore = bid.evaluation ? (bid.evaluation.price_score + bid.evaluation.experience_score + bid.evaluation.timeline_score + bid.evaluation.technical_score + bid.evaluation.communication_score) / 5 : 0;
                return <tr key={bid.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">{bid.bidder_profile?.name}</td>
                      <td className="p-2 text-right">${(bid.bid_amount / 1000).toFixed(0)}k</td>
                      <td className="p-2 text-right">{bid.timeline_days} days</td>
                      <td className="p-2 text-right">
                        <Badge variant={bid.evaluation?.price_score && bid.evaluation.price_score > 80 ? "default" : "secondary"}>
                          {bid.evaluation?.price_score || 0}
                        </Badge>
                      </td>
                      <td className="p-2 text-right">
                        <Badge variant={bid.evaluation?.experience_score && bid.evaluation.experience_score > 80 ? "default" : "secondary"}>
                          {bid.evaluation?.experience_score || 0}
                        </Badge>
                      </td>
                      <td className="p-2 text-right">
                        <Badge variant={bid.evaluation?.technical_score && bid.evaluation.technical_score > 80 ? "default" : "secondary"}>
                          {bid.evaluation?.technical_score || 0}
                        </Badge>
                      </td>
                      <td className="p-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="font-semibold">{overallScore.toFixed(1)}</span>
                        </div>
                      </td>
                    </tr>;
              })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>;
  return <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Tender Comparison Dashboard</h2>
          <p className="text-muted-foreground">Analyze and compare all submitted bids</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price">Sort by Price</SelectItem>
              <SelectItem value="timeline">Sort by Timeline</SelectItem>
              <SelectItem value="score">Sort by Score</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Bids</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={exportData} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        

        <TabsContent value="overview">
          {renderOverviewTab()}
        </TabsContent>

        <TabsContent value="charts">
          {renderChartsTab()}
        </TabsContent>

        <TabsContent value="analytics">
          {renderAnalyticsTab()}
        </TabsContent>
      </Tabs>
    </div>;
};