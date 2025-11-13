import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Users, BarChart3, Download, Filter, Star, Clock, Award, Target, FileText, Package, ChevronDown, ChevronUp, AlertTriangle, Scale, MessageSquare, Lightbulb } from 'lucide-react';
import { TenderBid, useTenders } from '@/hooks/useTenders';
import { downloadFromStorage } from '@/utils/storageUtils';
import { toast } from 'sonner';
import { BidLineItemsTable } from './BidLineItemsTable';
import { supabase } from '@/integrations/supabase/client';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Loader2 } from 'lucide-react';

interface TenderBidLineItem {
  id: string;
  bid_id: string;
  tender_line_item_id: string;
  line_number: number;
  item_description: string;
  quantity: number | null;
  unit_price: number | null;
  total: number;
  notes: string | null;
  category?: string;
}

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
  const [tenderData, setTenderData] = useState<{ project_id: string; title: string } | null>(null);
  const [awardingBid, setAwardingBid] = useState<string | null>(null);
  const [showAwardDialog, setShowAwardDialog] = useState(false);
  const [selectedBid, setSelectedBid] = useState<TenderBid | null>(null);
  const [lineItemCount, setLineItemCount] = useState(0);
  const [collapsedBids, setCollapsedBids] = useState<Record<string, boolean>>({});
  const [allBidLineItems, setAllBidLineItems] = useState<Record<string, TenderBidLineItem[]>>({});
  const [tenderLineItems, setTenderLineItems] = useState<any[]>([]);
  const [comparisonExpanded, setComparisonExpanded] = useState(true);

  const { awardTender } = useTenders();

  // Fetch bids and tender data from database
  useEffect(() => {
    console.log('TenderComparisonDashboard mounted with tenderId:', tenderId);
    console.log('tenderId type:', typeof tenderId);
    console.log('tenderId length:', tenderId?.length);
    fetchBids();
    fetchTenderData();
    fetchTenderLineItems();
  }, [tenderId]);

  const fetchTenderData = async () => {
    try {
      const { data, error } = await supabase
        .from('tenders')
        .select('project_id, title')
        .eq('id', tenderId)
        .single();

      if (error) {
        console.error('Error fetching tender data:', error);
        return;
      }

      setTenderData(data);
    } catch (error) {
      console.error('Error fetching tender data:', error);
    }
  };

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
        toast.error(`Failed to fetch bids: ${error.message}`);
        return;
      }

      console.log('Fetched bids:', data);
      
      // Fetch bidder profiles with company names
      if (data && data.length > 0) {
        const bidderIds = data.map(bid => bid.bidder_id).filter(Boolean);
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select(`
            user_id, 
            name, 
            role, 
            company_id,
            companies (
              name
            )
          `)
          .in('user_id', bidderIds);
        
        if (profileError) {
          console.error('Error fetching profiles:', profileError);
        }
        
        console.log('Fetched profiles:', profiles);
        
        // Enrich bids with profile and company data
        const enrichedBids = data.map(bid => {
          const profile = profiles?.find(p => p.user_id === bid.bidder_id);
          const companyName = profile?.companies?.name;
          const bidderName = profile?.name || 'Unknown Bidder';
          const displayName = companyName ? `${companyName} - ${bidderName}` : bidderName;
          
          return {
            ...bid,
            bidder_profile: {
              ...profile,
              company_name: companyName
            },
            bidder_name: displayName
          };
        });
        
        setBids(enrichedBids as any);
        
        // Fetch line items for all bids
        await fetchAllBidLineItems(data.map(b => b.id));
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

  const fetchTenderLineItems = async () => {
    try {
      const { data, error } = await supabase
        .from('tender_line_items')
        .select('*')
        .eq('tender_id', tenderId)
        .order('line_number', { ascending: true });

      if (error) throw error;
      setTenderLineItems(data || []);
    } catch (error) {
      console.error('Error fetching tender line items:', error);
    }
  };

  const fetchAllBidLineItems = async (bidIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from('tender_bid_line_items')
        .select(`
          *,
          tender_line_items!inner(category)
        `)
        .in('bid_id', bidIds)
        .order('line_number', { ascending: true });

      if (error) throw error;

      // Group by bid_id and flatten the structure
      const groupedItems: Record<string, TenderBidLineItem[]> = {};
      data?.forEach((item: any) => {
        if (!groupedItems[item.bid_id]) {
          groupedItems[item.bid_id] = [];
        }
        groupedItems[item.bid_id].push({
          ...item,
          category: item.tender_line_items?.category
        });
      });

      setAllBidLineItems(groupedItems);
    } catch (error) {
      console.error('Error fetching bid line items:', error);
    }
  };

  const handleAwardTender = async (bid: TenderBid) => {
    // Fetch line item count for the confirmation dialog
    const { data: lineItems } = await supabase
      .from('tender_bid_line_items')
      .select('id')
      .eq('bid_id', bid.id);
    
    setLineItemCount(lineItems?.length || 0);
    setSelectedBid(bid);
    setShowAwardDialog(true);
  };

  const confirmAward = async () => {
    if (!selectedBid) return;
    
    setAwardingBid(selectedBid.id);
    setShowAwardDialog(false);
    
    const success = await awardTender(tenderId, selectedBid.bidder_id);
    
    if (success) {
      toast.success(`Tender awarded to ${selectedBid.bidder_profile?.name}. ${lineItemCount} line items transferred to financials.`);
      fetchBids(); // Refresh the list
    }
    
    setAwardingBid(null);
    setSelectedBid(null);
    setLineItemCount(0);
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
      name: (bid as any).bidder_name || bid.bidder_profile?.name || 'Unknown Bidder',
      price: bid.bid_amount,
      timeline: bid.timeline_days || 0,
      overallScore: bid.evaluation ? (bid.evaluation.price_score + bid.evaluation.experience_score + bid.evaluation.timeline_score + bid.evaluation.technical_score + bid.evaluation.communication_score) / 5 : 0
    }));
  }, [sortedBids]);
  const pieChartData = useMemo(() => {
    return sortedBids.map((bid, index) => ({
      name: (bid as any).bidder_name || bid.bidder_profile?.name || 'Unknown Bidder',
      value: bid.bid_amount,
      percentage: (bid.bid_amount / bids.reduce((sum, b) => sum + b.bid_amount, 0) * 100).toFixed(1)
    }));
  }, [sortedBids, bids]);
  const radarData = useMemo(() => {
    return sortedBids.map(bid => ({
      bidder: (bid as any).bidder_name || bid.bidder_profile?.name || 'Unknown',
      Price: bid.evaluation?.price_score || 0,
      Experience: bid.evaluation?.experience_score || 0,
      Timeline: bid.evaluation?.timeline_score || 0,
      Technical: bid.evaluation?.technical_score || 0,
      Communication: bid.evaluation?.communication_score || 0
    }));
  }, [sortedBids]);

  // Category-level comparison analysis
  const categoryComparison = useMemo(() => {
    if (Object.keys(allBidLineItems).length === 0 || sortedBids.length === 0) {
      return {
        categories: [],
        summary: '',
        totalDifference: 0,
        totalDifferencePercent: 0,
        bidTotals: []
      };
    }

    // Group by category for each bid
    const categoryTotals: Record<string, Record<string, number>> = {};
    const bidTotals: Record<string, number> = {};

    sortedBids.forEach(bid => {
      const bidLineItems = allBidLineItems[bid.id] || [];
      bidTotals[bid.id] = 0;

      bidLineItems.forEach(item => {
        const category = item.category || 'Uncategorized';
        const total = item.total || 0;

        if (!categoryTotals[category]) {
          categoryTotals[category] = {};
        }
        if (!categoryTotals[category][bid.id]) {
          categoryTotals[category][bid.id] = 0;
        }

        categoryTotals[category][bid.id] += total;
        bidTotals[bid.id] += total;
      });
    });

    // Create category comparison array
    const categories = Object.entries(categoryTotals).map(([category, bidAmounts]) => {
      const amounts = sortedBids.map(bid => ({
        bidId: bid.id,
        bidderName: (bid as any).bidder_name || bid.bidder_profile?.name || 'Unknown',
        amount: bidAmounts[bid.id] || 0
      }));

      const values = amounts.map(a => a.amount);
      const minAmount = Math.min(...values);
      const maxAmount = Math.max(...values);
      const difference = maxAmount - minAmount;
      const differencePercent = minAmount > 0 ? ((difference / minAmount) * 100) : 0;

      return {
        category,
        amounts,
        difference,
        differencePercent
      };
    }).sort((a, b) => b.difference - a.difference);

    // Calculate overall totals
    const bidTotalValues = sortedBids.map(bid => bidTotals[bid.id] || 0);
    const minTotal = Math.min(...bidTotalValues);
    const maxTotal = Math.max(...bidTotalValues);
    const totalDifference = maxTotal - minTotal;
    const totalDifferencePercent = minTotal > 0 ? ((totalDifference / minTotal) * 100) : 0;

    // Generate summary
    const lowestBid = sortedBids.find(bid => bidTotals[bid.id] === minTotal);
    const highestBid = sortedBids.find(bid => bidTotals[bid.id] === maxTotal);
    const topDifferenceCategory = categories[0];

    let summary = '';
    if (lowestBid && highestBid && sortedBids.length >= 2) {
      const lowestName = (lowestBid as any).bidder_name || lowestBid.bidder_profile?.name || 'Unknown';
      const highestName = (highestBid as any).bidder_name || highestBid.bidder_profile?.name || 'Unknown';
      
      summary = `${lowestName}'s bid ($${(minTotal / 1000).toFixed(0)}k) is $${(totalDifference / 1000).toFixed(0)}k (${totalDifferencePercent.toFixed(0)}%) lower than ${highestName}'s bid ($${(maxTotal / 1000).toFixed(0)}k). `;
      
      if (topDifferenceCategory && topDifferenceCategory.differencePercent > 5) {
        summary += `The largest variance is in ${topDifferenceCategory.category}, with a difference of $${(topDifferenceCategory.difference / 1000).toFixed(0)}k (${topDifferenceCategory.differencePercent.toFixed(0)}%). `;
      } else {
        summary += `Category pricing is relatively consistent across both bids. `;
      }

      // Count priced items
      const firstBidItemCount = allBidLineItems[sortedBids[0]?.id]?.length || 0;
      summary += `Both bids priced ${firstBidItemCount} line items.`;
    }

    return {
      categories,
      bidTotals: sortedBids.map(bid => ({
        bidId: bid.id,
        bidderName: (bid as any).bidder_name || bid.bidder_profile?.name || 'Unknown',
        total: bidTotals[bid.id] || 0
      })),
      summary,
      totalDifference,
      totalDifferencePercent
    };
  }, [allBidLineItems, sortedBids]);

  // Proposal comparison analysis
  const proposalComparison = useMemo(() => {
    return sortedBids.map(bid => {
      const proposalText = bid.proposal_text || '';
      const wordCount = proposalText.split(/\s+/).filter(w => w.length > 0).length;
      
      // Extract key features
      const hasWarranty = /warranty|guarantee/i.test(proposalText);
      const hasTimeline = /timeline|schedule|duration|days|weeks|months/i.test(proposalText);
      const hasExclusions = /exclude|excluding|not included|does not include/i.test(proposalText);
      const hasSpecialTerms = /special|bonus|additional|extra|free/i.test(proposalText);

      return {
        bidId: bid.id,
        bidderName: (bid as any).bidder_name || bid.bidder_profile?.name || 'Unknown',
        wordCount,
        hasWarranty,
        hasTimeline,
        hasExclusions,
        hasSpecialTerms,
        proposalText: proposalText.substring(0, 200) + (proposalText.length > 200 ? '...' : '')
      };
    });
  }, [sortedBids]);

  // Smart insights based on category comparison
  const smartInsights = useMemo(() => {
    const insights: string[] = [];

    if (categoryComparison.categories.length === 0) return insights;

    // High variance categories
    const highVarianceCategories = categoryComparison.categories.filter(
      cat => cat.differencePercent > 20
    );
    
    if (highVarianceCategories.length > 0) {
      insights.push(
        `${highVarianceCategories.length} ${highVarianceCategories.length === 1 ? 'category has' : 'categories have'} significant price differences (>20%)`
      );
    }

    // Consistent categories
    const consistentCategories = categoryComparison.categories.filter(
      cat => cat.differencePercent < 5
    );
    
    if (consistentCategories.length > 0) {
      insights.push(
        `${consistentCategories.length} ${consistentCategories.length === 1 ? 'category shows' : 'categories show'} consistent pricing across bids`
      );
    }

    // Proposal insights
    const bidsWithWarranty = proposalComparison.filter(p => p.hasWarranty);
    if (bidsWithWarranty.length > 0 && bidsWithWarranty.length < bids.length) {
      insights.push(`${bidsWithWarranty.length} out of ${bids.length} bids mention warranty terms`);
    }

    const bidsWithExclusions = proposalComparison.filter(p => p.hasExclusions);
    if (bidsWithExclusions.length > 0) {
      insights.push(`${bidsWithExclusions.length} bid(s) include scope exclusions`);
    }

    return insights;
  }, [categoryComparison, proposalComparison, bids]);
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

      {/* Bid Comparison Analysis */}
      {sortedBids.length >= 2 && categoryComparison.categories.length > 0 && (
        <Card>
          <Collapsible open={comparisonExpanded} onOpenChange={setComparisonExpanded}>
            <CardHeader className="cursor-pointer" onClick={() => setComparisonExpanded(!comparisonExpanded)}>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  Bid Comparison Analysis
                </CardTitle>
                <Button variant="ghost" size="sm">
                  {comparisonExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Category-level price comparison and key differences
              </p>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="space-y-6">
                {/* Summary */}
                {categoryComparison.summary && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-900 leading-relaxed">{categoryComparison.summary}</p>
                    </div>
                  </div>
                )}

                {/* Smart Insights */}
                {smartInsights.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {smartInsights.map((insight, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs py-1.5 px-3">
                        {insight}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Category Comparison Table */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Category Breakdown
                  </h4>

                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted">
                          <tr>
                            <th className="text-left p-3 font-medium text-sm">Category</th>
                            {sortedBids.map(bid => (
                              <th key={bid.id} className="text-right p-3 font-medium text-sm">
                                {(bid as any).bidder_name || bid.bidder_profile?.name || 'Unknown'}
                              </th>
                            ))}
                            <th className="text-right p-3 font-medium text-sm">Difference</th>
                          </tr>
                        </thead>
                        <tbody>
                          {categoryComparison.categories.map((category) => {
                            const varianceClass =
                              category.differencePercent > 20
                                ? 'bg-red-50'
                                : category.differencePercent > 5
                                ? 'bg-yellow-50'
                                : '';

                            return (
                              <tr key={category.category} className={`border-t hover:bg-muted/50 ${varianceClass}`}>
                                <td className="p-3 text-sm font-medium">
                                  {category.category}
                                </td>
                                {category.amounts.map((amount, idx) => (
                                  <td key={idx} className="p-3 text-right text-sm">
                                    ${amount.amount.toLocaleString()}
                                  </td>
                                ))}
                                <td className="p-3 text-right text-sm">
                                  <div className="flex flex-col items-end gap-1">
                                    <span className="font-semibold">
                                      ${category.difference.toLocaleString()}
                                    </span>
                                    {category.differencePercent > 0 && (
                                      <Badge
                                        variant={
                                          category.differencePercent > 20
                                            ? 'destructive'
                                            : category.differencePercent > 5
                                            ? 'secondary'
                                            : 'outline'
                                        }
                                        className="text-xs"
                                      >
                                        {category.differencePercent.toFixed(1)}%
                                      </Badge>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          {/* Total Row */}
                          <tr className="bg-muted font-semibold border-t-2">
                            <td className="p-3 text-sm">Total</td>
                            {categoryComparison.bidTotals.map((bidTotal) => (
                              <td key={bidTotal.bidId} className="p-3 text-right text-sm">
                                ${bidTotal.total.toLocaleString()}
                              </td>
                            ))}
                            <td className="p-3 text-right text-sm">
                              <div className="flex flex-col items-end gap-1">
                                <span>${categoryComparison.totalDifference.toLocaleString()}</span>
                                {categoryComparison.totalDifferencePercent > 0 && (
                                  <Badge variant="destructive" className="text-xs">
                                    {categoryComparison.totalDifferencePercent.toFixed(1)}%
                                  </Badge>
                                )}
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Proposal Notes - Only show if there are meaningful differences */}
                {proposalComparison.some(p => p.hasWarranty || p.hasTimeline || p.hasSpecialTerms || p.hasExclusions) && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Additional Proposal Notes
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {proposalComparison.map(proposal => (
                        <Card key={proposal.bidId} className="border">
                          <CardHeader className="pb-3">
                            <span className="font-semibold">{proposal.bidderName}</span>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-1.5">
                              {proposal.hasWarranty && (
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                  ✓ Warranty
                                </Badge>
                              )}
                              {proposal.hasTimeline && (
                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                  ✓ Timeline Details
                                </Badge>
                              )}
                              {proposal.hasExclusions && (
                                <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                                  ⚠ Exclusions
                                </Badge>
                              )}
                              {proposal.hasSpecialTerms && (
                                <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                  ★ Special Terms
                                </Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

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
              const isOpen = collapsedBids[bid.id] !== false; // default to open
              
              return (
                <Card key={bid.id} className="border-2">
                  <Collapsible 
                    open={isOpen} 
                    onOpenChange={(open) => setCollapsedBids(prev => ({ ...prev, [bid.id]: open }))}
                  >
                    <CardHeader className="bg-muted/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-semibold">{bid.bidder_profile?.name || 'Unknown Bidder'}</span>
                          {isLowest && <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">Lowest Price</Badge>}
                          {isFastest && <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">Fastest</Badge>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={bid.status === 'submitted' ? 'default' : bid.status === 'accepted' ? 'default' : 'secondary'}>
                            {bid.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm">
                              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                          </CollapsibleTrigger>
                        </div>
                      </div>
                    </CardHeader>
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

                        {/* Award Button */}
                        {(bid.status === 'submitted' || bid.status === 'under_review') && (
                          <div className="mt-6 pt-4 border-t">
                            <Button
                              onClick={() => handleAwardTender(bid)}
                              disabled={awardingBid !== null}
                              className="w-full"
                              size="lg"
                            >
                              {awardingBid === bid.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Awarding Tender...
                                </>
                              ) : (
                                <>
                                  <Award className="h-4 w-4 mr-2" />
                                  Award Tender to {bid.bidder_profile?.name}
                                </>
                              )}
                            </Button>
                          </div>
                        )}

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
                  </Collapsible>
                </Card>
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

      {/* Award Confirmation Dialog */}
      <ConfirmationDialog
        open={showAwardDialog}
        onClose={() => {
          setShowAwardDialog(false);
          setSelectedBid(null);
          setLineItemCount(0);
        }}
        onConfirm={confirmAward}
        title="Award Tender"
        description={`Are you sure you want to award this tender to ${selectedBid?.bidder_profile?.name}? This will give the builder access to the project and transfer ${lineItemCount} line items to the Financials tab. All other bids will be rejected.`}
        confirmText="Award Tender"
        cancelText="Cancel"
      />
    </div>;
};