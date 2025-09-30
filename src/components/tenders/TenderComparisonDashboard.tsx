import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Users, 
  BarChart3,
  Download,
  Filter,
  Star,
  Clock,
  Award,
  Target
} from 'lucide-react';
import { TenderBid } from '@/hooks/useTenders';

interface TenderComparisonDashboardProps {
  tenderId: string;
  bids?: TenderBid[];
}

// Dummy data for demonstration
const DUMMY_BIDS: TenderBid[] = [
  {
    id: '1',
    tender_id: 'tender-1',
    bidder_id: 'builder-1',
    bid_amount: 850000,
    proposal_text: 'High quality construction with premium materials',
    status: 'submitted',
    submitted_at: '2024-01-15T10:00:00Z',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    timeline_days: 180,
    bidder_profile: {
      name: 'Premium Builders Ltd',
      role: 'builder'
    },
    evaluation: {
      price_score: 75,
      experience_score: 95,
      timeline_score: 85,
      technical_score: 90,
      communication_score: 88,
      overall_score: 86.6,
      evaluator_notes: 'Strong experience with premium materials',
      evaluated_at: '2024-01-20T10:00:00Z',
      evaluator_id: 'evaluator-1'
    }
  },
  {
    id: '2',
    tender_id: 'tender-1',
    bidder_id: 'builder-2',
    bid_amount: 750000,
    proposal_text: 'Cost-effective solution with quality materials',
    status: 'submitted',
    submitted_at: '2024-01-16T14:30:00Z',
    created_at: '2024-01-16T14:30:00Z',
    updated_at: '2024-01-16T14:30:00Z',
    timeline_days: 200,
    bidder_profile: {
      name: 'Value Construction Co',
      role: 'builder'
    },
    evaluation: {
      price_score: 95,
      experience_score: 75,
      timeline_score: 70,
      technical_score: 80,
      communication_score: 85,
      overall_score: 81,
      evaluator_notes: 'Good value proposition with solid track record',
      evaluated_at: '2024-01-20T11:00:00Z',
      evaluator_id: 'evaluator-1'
    }
  },
  {
    id: '3',
    tender_id: 'tender-1',
    bidder_id: 'builder-3',
    bid_amount: 920000,
    proposal_text: 'Luxury finish with sustainable practices',
    status: 'submitted',
    submitted_at: '2024-01-17T09:15:00Z',
    created_at: '2024-01-17T09:15:00Z',
    updated_at: '2024-01-17T09:15:00Z',
    timeline_days: 165,
    bidder_profile: {
      name: 'Eco Luxury Homes',
      role: 'builder'
    },
    evaluation: {
      price_score: 60,
      experience_score: 90,
      timeline_score: 95,
      technical_score: 95,
      communication_score: 92,
      overall_score: 86.4,
      evaluator_notes: 'Excellent technical approach with sustainability focus',
      evaluated_at: '2024-01-20T12:00:00Z',
      evaluator_id: 'evaluator-1'
    }
  },
  {
    id: '4',
    tender_id: 'tender-1',
    bidder_id: 'builder-4',
    bid_amount: 680000,
    proposal_text: 'Budget-friendly approach with standard quality',
    status: 'submitted',
    submitted_at: '2024-01-18T16:45:00Z',
    created_at: '2024-01-18T16:45:00Z',
    updated_at: '2024-01-18T16:45:00Z',
    timeline_days: 220,
    bidder_profile: {
      name: 'Budget Build Solutions',
      role: 'builder'
    },
    evaluation: {
      price_score: 100,
      experience_score: 65,
      timeline_score: 60,
      technical_score: 70,
      communication_score: 75,
      overall_score: 74,
      evaluator_notes: 'Most competitive price but concerns about timeline',
      evaluated_at: '2024-01-20T13:00:00Z',
      evaluator_id: 'evaluator-1'
    }
  },
  {
    id: '5',
    tender_id: 'tender-1',
    bidder_id: 'builder-5',
    bid_amount: 825000,
    proposal_text: 'Balanced approach with modern techniques',
    status: 'submitted',
    submitted_at: '2024-01-19T11:20:00Z',
    created_at: '2024-01-19T11:20:00Z',
    updated_at: '2024-01-19T11:20:00Z',
    timeline_days: 190,
    bidder_profile: {
      name: 'Modern Build Tech',
      role: 'builder'
    },
    evaluation: {
      price_score: 80,
      experience_score: 85,
      timeline_score: 75,
      technical_score: 85,
      communication_score: 80,
      overall_score: 81,
      evaluator_notes: 'Well-balanced approach with modern techniques',
      evaluated_at: '2024-01-20T14:00:00Z',
      evaluator_id: 'evaluator-1'
    }
  }
];

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#d084d0'];

export const TenderComparisonDashboard: React.FC<TenderComparisonDashboardProps> = ({
  tenderId,
  bids = DUMMY_BIDS
}) => {
  const [sortBy, setSortBy] = useState<'price' | 'timeline' | 'score'>('price');
  const [filterBy, setFilterBy] = useState<'all' | 'submitted' | 'under_review'>('all');

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
          const scoreA = a.evaluation ? 
            (a.evaluation.price_score + a.evaluation.experience_score + a.evaluation.timeline_score + a.evaluation.technical_score + a.evaluation.communication_score) / 5 : 0;
          const scoreB = b.evaluation ? 
            (b.evaluation.price_score + b.evaluation.experience_score + b.evaluation.timeline_score + b.evaluation.technical_score + b.evaluation.communication_score) / 5 : 0;
          return scoreB - scoreA;
        default:
          return 0;
      }
    });
  }, [filteredBids, sortBy]);

  const priceAnalysis = useMemo(() => {
    const prices = bids.map(bid => bid.bid_amount);
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
      overallScore: bid.evaluation ? 
        (bid.evaluation.price_score + bid.evaluation.experience_score + bid.evaluation.timeline_score + bid.evaluation.technical_score + bid.evaluation.communication_score) / 5 : 0
    }));
  }, [sortedBids]);

  const pieChartData = useMemo(() => {
    return sortedBids.map((bid, index) => ({
      name: bid.bidder_profile?.name || 'Unknown Bidder',
      value: bid.bid_amount,
      percentage: ((bid.bid_amount / bids.reduce((sum, b) => sum + b.bid_amount, 0)) * 100).toFixed(1)
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
    const csvContent = [
      ['Bidder', 'Price', 'Timeline (Days)', 'Overall Score', 'Status'],
      ...sortedBids.map(bid => [
        bid.bidder_profile?.name || 'Unknown',
        bid.bid_amount.toString(),
        (bid.timeline_days || 0).toString(),
        bid.evaluation ? 
          ((bid.evaluation.price_score + bid.evaluation.experience_score + bid.evaluation.timeline_score + bid.evaluation.technical_score + bid.evaluation.communication_score) / 5).toFixed(1) : '0',
        bid.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tender-comparison-${tenderId}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
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
                <p className="text-2xl font-bold">${(priceAnalysis.range / 1000).toFixed(0)}k</p>
                <p className="text-xs text-muted-foreground">
                  ${(priceAnalysis.lowest / 1000).toFixed(0)}k - ${(priceAnalysis.highest / 1000).toFixed(0)}k
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
                <p className="text-2xl font-bold text-green-600">${(priceAnalysis.savings / 1000).toFixed(0)}k</p>
                <p className="text-xs text-muted-foreground">
                  {((priceAnalysis.savings / priceAnalysis.highest) * 100).toFixed(1)}% below highest
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
                <p className="text-2xl font-bold">{timelineAnalysis.range} days</p>
                <p className="text-xs text-muted-foreground">
                  {timelineAnalysis.fastest} - {timelineAnalysis.slowest} days
                </p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Bid Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Bid Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedBids.map((bid, index) => {
              const isLowest = bid.bid_amount === priceAnalysis.lowest;
              const isFastest = bid.timeline_days === timelineAnalysis.fastest;
              const overallScore = bid.evaluation ? 
                (bid.evaluation.price_score + bid.evaluation.experience_score + bid.evaluation.timeline_score + bid.evaluation.technical_score + bid.evaluation.communication_score) / 5 : 0;
              
              return (
                <div key={bid.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{bid.bidder_profile?.name}</span>
                      {isLowest && <Badge variant="secondary" className="text-green-600">Lowest Price</Badge>}
                      {isFastest && <Badge variant="secondary" className="text-blue-600">Fastest</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-right">
                      <p className="font-medium">${(bid.bid_amount / 1000).toFixed(0)}k</p>
                      <p className="text-muted-foreground">Price</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{bid.timeline_days} days</p>
                      <p className="text-muted-foreground">Timeline</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium">{overallScore.toFixed(1)}</span>
                      </div>
                      <p className="text-muted-foreground">Score</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderChartsTab = () => (
    <div className="space-y-6">
      {/* Price Comparison Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Price Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
              />
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
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
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
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ percentage }) => `${percentage}%`}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
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
              {radarData.map((bid, index) => (
                <Radar
                  key={index}
                  name={bid.bidder}
                  dataKey="value"
                  stroke={COLORS[index % COLORS.length]}
                  fill={COLORS[index % COLORS.length]}
                  fillOpacity={0.1}
                />
              ))}
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
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
                  ${(priceAnalysis.lowest / 1000).toFixed(0)}k
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Fastest Timeline:</span>
                <span className="text-blue-600 font-semibold">
                  {timelineAnalysis.fastest} days
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Potential Savings:</span>
                <span className="text-green-600 font-semibold">
                  ${(priceAnalysis.savings / 1000).toFixed(0)}k ({((priceAnalysis.savings / priceAnalysis.highest) * 100).toFixed(1)}%)
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
                  ${(priceAnalysis.highest / 1000).toFixed(0)}k
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Longest Timeline:</span>
                <span className="text-orange-600 font-semibold">
                  {timelineAnalysis.slowest} days
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Price Variance:</span>
                <span className="text-orange-600 font-semibold">
                  ${(priceAnalysis.range / 1000).toFixed(0)}k
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
                {sortedBids.map((bid) => {
                  const overallScore = bid.evaluation ? 
                    (bid.evaluation.price_score + bid.evaluation.experience_score + bid.evaluation.timeline_score + bid.evaluation.technical_score + bid.evaluation.communication_score) / 5 : 0;
                  
                  return (
                    <tr key={bid.id} className="border-b hover:bg-muted/50">
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="charts">Visual Analysis</TabsTrigger>
          <TabsTrigger value="analytics">Detailed Analytics</TabsTrigger>
        </TabsList>

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
    </div>
  );
};