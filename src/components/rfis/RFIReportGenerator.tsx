import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  FileDown, Mail, Calendar, Building, Users, FileText,
  TrendingUp, Clock, Target, Share, Settings, Download,
  Printer, Eye, Filter, BookOpen
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { RFI } from '@/hooks/useRFIs';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface RFIReportGeneratorProps {
  rfis: RFI[];
  projectUsers: any[];
  projectName?: string;
  className?: string;
}

type ReportType = 'executive' | 'detailed' | 'performance' | 'team' | 'custom';
type ReportFormat = 'pdf' | 'excel' | 'json' | 'csv';
type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all' | 'custom';

interface ReportConfig {
  type: ReportType;
  format: ReportFormat;
  timeRange: TimeRange;
  customStartDate?: string;
  customEndDate?: string;
  includeCharts: boolean;
  includeDetails: boolean;
  includeRecommendations: boolean;
  filters: {
    status?: string[];
    priority?: string[];
    category?: string[];
    assignedTo?: string[];
  };
  customSections: string[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6'];

export const RFIReportGenerator: React.FC<RFIReportGeneratorProps> = ({
  rfis,
  projectUsers,
  projectName = 'Project',
  className
}) => {
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    type: 'executive',
    format: 'pdf',
    timeRange: '30d',
    includeCharts: true,
    includeDetails: false,
    includeRecommendations: true,
    filters: {},
    customSections: []
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Filter RFIs based on configuration
  const filteredRFIs = useMemo(() => {
    let filtered = [...rfis];

    // Time range filter
    if (reportConfig.timeRange !== 'all') {
      const now = new Date();
      let startDate: Date;

      if (reportConfig.timeRange === 'custom') {
        startDate = reportConfig.customStartDate ? new Date(reportConfig.customStartDate) : new Date(0);
        const endDate = reportConfig.customEndDate ? new Date(reportConfig.customEndDate) : now;
        filtered = filtered.filter(rfi => {
          const rfiDate = new Date(rfi.created_at);
          return rfiDate >= startDate && rfiDate <= endDate;
        });
      } else {
        const days = {
          '7d': 7,
          '30d': 30,
          '90d': 90,
          '1y': 365
        }[reportConfig.timeRange] || 30;

        startDate = subDays(now, days);
        filtered = filtered.filter(rfi => new Date(rfi.created_at) >= startDate);
      }
    }

    // Apply filters
    const { filters } = reportConfig;
    
    if (filters.status?.length) {
      filtered = filtered.filter(rfi => filters.status!.includes(rfi.status));
    }
    
    if (filters.priority?.length) {
      filtered = filtered.filter(rfi => filters.priority!.includes(rfi.priority));
    }
    
    if (filters.category?.length) {
      filtered = filtered.filter(rfi => filters.category!.includes(rfi.category || 'Uncategorized'));
    }
    
    if (filters.assignedTo?.length) {
      filtered = filtered.filter(rfi => rfi.assigned_to && filters.assignedTo!.includes(rfi.assigned_to));
    }

    return filtered;
  }, [rfis, reportConfig]);

  // Calculate report metrics
  const reportMetrics = useMemo(() => {
    const total = filteredRFIs.length;
    const answered = filteredRFIs.filter(rfi => rfi.status === 'answered').length;
    const overdue = filteredRFIs.filter(rfi => rfi.status === 'overdue').length;
    const outstanding = filteredRFIs.filter(rfi => rfi.status === 'outstanding').length;

    // Response time analysis
    const responseTimes = filteredRFIs
      .filter(rfi => rfi.response_date && rfi.created_at)
      .map(rfi => {
        const created = new Date(rfi.created_at);
        const responded = new Date(rfi.response_date!);
        return Math.round((responded.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      });

    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;

    // Status distribution
    const statusDistribution = filteredRFIs.reduce((acc, rfi) => {
      acc[rfi.status] = (acc[rfi.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Priority distribution
    const priorityDistribution = filteredRFIs.reduce((acc, rfi) => {
      acc[rfi.priority] = (acc[rfi.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Category analysis
    const categoryDistribution = filteredRFIs.reduce((acc, rfi) => {
      const category = rfi.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Team performance
    const teamPerformance = projectUsers.map(user => {
      const userRFIs = filteredRFIs.filter(rfi => rfi.assigned_to === user.user_id);
      const answeredRFIs = userRFIs.filter(rfi => rfi.status === 'answered');
      
      return {
        name: user.user_profile?.name || 'Unknown',
        role: user.user_profile?.role || user.role,
        assigned: userRFIs.length,
        answered: answeredRFIs.length,
        responseRate: userRFIs.length > 0 ? Math.round((answeredRFIs.length / userRFIs.length) * 100) : 0
      };
    }).filter(user => user.assigned > 0);

    return {
      summary: {
        total,
        answered,
        overdue,
        outstanding,
        responseRate: total > 0 ? Math.round((answered / total) * 100) : 0,
        avgResponseTime: Math.round(avgResponseTime * 10) / 10
      },
      distributions: {
        status: statusDistribution,
        priority: priorityDistribution,
        category: categoryDistribution
      },
      teamPerformance,
      responseTimes
    };
  }, [filteredRFIs, projectUsers]);

  // Generate chart data
  const chartData = useMemo(() => {
    const statusData = Object.entries(reportMetrics.distributions.status).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
      value: count,
      percentage: Math.round((count / filteredRFIs.length) * 100)
    }));

    const priorityData = Object.entries(reportMetrics.distributions.priority).map(([priority, count]) => ({
      name: priority.charAt(0).toUpperCase() + priority.slice(1),
      value: count,
      percentage: Math.round((count / filteredRFIs.length) * 100)
    }));

    const categoryData = Object.entries(reportMetrics.distributions.category)
      .map(([category, count]) => ({
        category,
        count,
        percentage: Math.round((count / filteredRFIs.length) * 100)
      }))
      .sort((a, b) => b.count - a.count);

    return { statusData, priorityData, categoryData };
  }, [reportMetrics, filteredRFIs.length]);

  // Generate recommendations
  const generateRecommendations = () => {
    const recommendations = [];
    const { summary } = reportMetrics;

    if (summary.responseRate < 75) {
      recommendations.push({
        type: 'critical',
        title: 'Low Response Rate',
        description: `Response rate of ${summary.responseRate}% is below recommended 75%. Consider implementing automated reminders and escalation procedures.`
      });
    }

    if (summary.avgResponseTime > 7) {
      recommendations.push({
        type: 'warning',
        title: 'Slow Response Times',
        description: `Average response time of ${summary.avgResponseTime} days exceeds target. Review workload distribution and assignment processes.`
      });
    }

    if (summary.overdue > summary.total * 0.2) {
      recommendations.push({
        type: 'critical',
        title: 'High Overdue Rate',
        description: `${Math.round((summary.overdue / summary.total) * 100)}% of RFIs are overdue. Implement stricter deadline management.`
      });
    }

    const poorPerformers = reportMetrics.teamPerformance.filter(member => member.responseRate < 60);
    if (poorPerformers.length > 0) {
      recommendations.push({
        type: 'info',
        title: 'Team Performance',
        description: `${poorPerformers.length} team member(s) have response rates below 60%. Consider additional training or workload adjustment.`
      });
    }

    if (summary.responseRate >= 85 && summary.avgResponseTime <= 3) {
      recommendations.push({
        type: 'success',
        title: 'Excellent Performance',
        description: 'Your team is performing exceptionally well with high response rates and fast response times.'
      });
    }

    return recommendations;
  };

  const recommendations = generateRecommendations();

  // Report templates
  const getReportContent = () => {
    const { type } = reportConfig;
    
    switch (type) {
      case 'executive':
        return {
          title: 'Executive Summary Report',
          sections: [
            'summary',
            'charts',
            'recommendations'
          ]
        };
      case 'detailed':
        return {
          title: 'Detailed RFI Analysis Report',
          sections: [
            'summary',
            'charts',
            'details',
            'team',
            'recommendations'
          ]
        };
      case 'performance':
        return {
          title: 'Performance Metrics Report',
          sections: [
            'summary',
            'performance',
            'team',
            'charts',
            'recommendations'
          ]
        };
      case 'team':
        return {
          title: 'Team Performance Report',
          sections: [
            'team',
            'charts',
            'recommendations'
          ]
        };
      case 'custom':
        return {
          title: 'Custom Report',
          sections: reportConfig.customSections
        };
      default:
        return {
          title: 'RFI Report',
          sections: ['summary', 'charts']
        };
    }
  };

  // Generate PDF report
  const generatePDFReport = async () => {
    setIsGenerating(true);
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const content = getReportContent();
      
      // Title page
      pdf.setFontSize(24);
      pdf.text(content.title, 20, 30);
      pdf.setFontSize(12);
      pdf.text(`Project: ${projectName}`, 20, 45);
      pdf.text(`Generated: ${format(new Date(), 'PPP')}`, 20, 55);
      pdf.text(`Time Range: ${reportConfig.timeRange}`, 20, 65);
      
      // Summary section
      let yPosition = 80;
      if (content.sections.includes('summary')) {
        pdf.setFontSize(16);
        pdf.text('Executive Summary', 20, yPosition);
        yPosition += 15;
        
        pdf.setFontSize(12);
        const summaryText = [
          `Total RFIs: ${reportMetrics.summary.total}`,
          `Answered: ${reportMetrics.summary.answered} (${reportMetrics.summary.responseRate}%)`,
          `Outstanding: ${reportMetrics.summary.outstanding}`,
          `Overdue: ${reportMetrics.summary.overdue}`,
          `Average Response Time: ${reportMetrics.summary.avgResponseTime} days`
        ];
        
        summaryText.forEach(text => {
          pdf.text(text, 20, yPosition);
          yPosition += 8;
        });
      }

      // Charts section (would require chart-to-image conversion)
      if (content.sections.includes('charts') && reportConfig.includeCharts) {
        // This would require converting React components to images
        // For now, we'll add a placeholder
        yPosition += 20;
        pdf.setFontSize(16);
        pdf.text('Charts and Visualizations', 20, yPosition);
        yPosition += 10;
        pdf.setFontSize(10);
        pdf.text('[Charts would be rendered here in actual implementation]', 20, yPosition);
      }

      // Recommendations section
      if (content.sections.includes('recommendations') && reportConfig.includeRecommendations) {
        yPosition += 30;
        pdf.setFontSize(16);
        pdf.text('Recommendations', 20, yPosition);
        yPosition += 15;
        
        recommendations.forEach(rec => {
          if (yPosition > 250) {
            pdf.addPage();
            yPosition = 20;
          }
          
          pdf.setFontSize(12);
          pdf.text(`• ${rec.title}`, 20, yPosition);
          yPosition += 8;
          
          pdf.setFontSize(10);
          const lines = pdf.splitTextToSize(rec.description, 170);
          lines.forEach((line: string) => {
            pdf.text(line, 25, yPosition);
            yPosition += 6;
          });
          yPosition += 5;
        });
      }

      pdf.save(`${projectName}-rfi-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate JSON export
  const generateJSONExport = () => {
    const exportData = {
      metadata: {
        title: getReportContent().title,
        project: projectName,
        generatedAt: new Date().toISOString(),
        timeRange: reportConfig.timeRange,
        filters: reportConfig.filters
      },
      summary: reportMetrics.summary,
      distributions: reportMetrics.distributions,
      teamPerformance: reportMetrics.teamPerformance,
      recommendations,
      rawData: reportConfig.includeDetails ? filteredRFIs : []
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `${projectName}-rfi-report-${format(new Date(), 'yyyy-MM-dd')}.json`);
    linkElement.click();
  };

  // Generate CSV export
  const generateCSVExport = () => {
    const headers = [
      'ID', 'Subject', 'Status', 'Priority', 'Category', 'Created Date', 
      'Raised By', 'Assigned To', 'Response Date', 'Response Time (Days)'
    ];
    
    const rows = filteredRFIs.map(rfi => {
      const createdDate = new Date(rfi.created_at);
      const responseDate = rfi.response_date ? new Date(rfi.response_date) : null;
      const responseTime = responseDate 
        ? Math.round((responseDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
        : '';

      return [
        rfi.id,
        rfi.subject || rfi.question.substring(0, 50),
        rfi.status,
        rfi.priority,
        rfi.category || 'Uncategorized',
        format(createdDate, 'yyyy-MM-dd'),
        rfi.raised_by_profile?.name || 'Unknown',
        rfi.assigned_to_profile?.name || 'Unassigned',
        responseDate ? format(responseDate, 'yyyy-MM-dd') : '',
        responseTime
      ];
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${projectName}-rfi-data-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const handleGenerate = () => {
    switch (reportConfig.format) {
      case 'pdf':
        generatePDFReport();
        break;
      case 'json':
        generateJSONExport();
        break;
      case 'csv':
        generateCSVExport();
        break;
      default:
        generateJSONExport();
    }
  };

  const PreviewComponent = () => (
    <div className="space-y-6 p-6 bg-white">
      {/* Header */}
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold">{getReportContent().title}</h1>
        <p className="text-muted-foreground">Project: {projectName}</p>
        <p className="text-sm text-muted-foreground">
          Generated: {format(new Date(), 'PPP')} | Time Range: {reportConfig.timeRange}
        </p>
      </div>

      {/* Executive Summary */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Executive Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{reportMetrics.summary.total}</p>
            <p className="text-sm text-muted-foreground">Total RFIs</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-2xl font-bold text-green-600">{reportMetrics.summary.responseRate}%</p>
            <p className="text-sm text-muted-foreground">Response Rate</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">{reportMetrics.summary.avgResponseTime}</p>
            <p className="text-sm text-muted-foreground">Avg Response Days</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      {reportConfig.includeCharts && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Visual Analysis</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-4">Status Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} (${percentage}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-4">Priority Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.priorityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Performance */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Team Performance</h2>
        <div className="space-y-3">
          {reportMetrics.teamPerformance.map((member, index) => (
            <div key={member.name} className="grid grid-cols-4 gap-4 p-3 border rounded">
              <div>
                <p className="font-medium">{member.name}</p>
                <p className="text-sm text-muted-foreground">{member.role}</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold">{member.assigned}</p>
                <p className="text-xs text-muted-foreground">Assigned</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold">{member.answered}</p>
                <p className="text-xs text-muted-foreground">Answered</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold">{member.responseRate}%</p>
                <p className="text-xs text-muted-foreground">Response Rate</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {reportConfig.includeRecommendations && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Recommendations</h2>
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div key={index} className={cn(
                "p-4 border rounded-lg",
                rec.type === 'critical' && "border-red-200 bg-red-50",
                rec.type === 'warning' && "border-yellow-200 bg-yellow-50",
                rec.type === 'success' && "border-green-200 bg-green-50",
                rec.type === 'info' && "border-blue-200 bg-blue-50"
              )}>
                <h4 className="font-medium">{rec.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileDown className="h-5 w-5" />
            <span>Report Generator</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Report Type</Label>
              <Select 
                value={reportConfig.type} 
                onValueChange={(value: ReportType) => 
                  setReportConfig(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="executive">Executive Summary</SelectItem>
                  <SelectItem value="detailed">Detailed Analysis</SelectItem>
                  <SelectItem value="performance">Performance Metrics</SelectItem>
                  <SelectItem value="team">Team Performance</SelectItem>
                  <SelectItem value="custom">Custom Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Format</Label>
              <Select 
                value={reportConfig.format} 
                onValueChange={(value: ReportFormat) => 
                  setReportConfig(prev => ({ ...prev, format: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Report</SelectItem>
                  <SelectItem value="json">JSON Data</SelectItem>
                  <SelectItem value="csv">CSV Data</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Time Range</Label>
              <Select 
                value={reportConfig.timeRange} 
                onValueChange={(value: TimeRange) => 
                  setReportConfig(prev => ({ ...prev, timeRange: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {reportConfig.timeRange === 'custom' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input 
                  type="date" 
                  value={reportConfig.customStartDate || ''}
                  onChange={(e) => 
                    setReportConfig(prev => ({ ...prev, customStartDate: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input 
                  type="date" 
                  value={reportConfig.customEndDate || ''}
                  onChange={(e) => 
                    setReportConfig(prev => ({ ...prev, customEndDate: e.target.value }))
                  }
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <label className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                checked={reportConfig.includeCharts}
                onChange={(e) => 
                  setReportConfig(prev => ({ ...prev, includeCharts: e.target.checked }))
                }
              />
              <span>Include Charts</span>
            </label>
            <label className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                checked={reportConfig.includeDetails}
                onChange={(e) => 
                  setReportConfig(prev => ({ ...prev, includeDetails: e.target.checked }))
                }
              />
              <span>Include Raw Data</span>
            </label>
            <label className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                checked={reportConfig.includeRecommendations}
                onChange={(e) => 
                  setReportConfig(prev => ({ ...prev, includeRecommendations: e.target.checked }))
                }
              />
              <span>Include Recommendations</span>
            </label>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Report will include {filteredRFIs.length} RFIs
            </div>
            <div className="flex space-x-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Report Preview</DialogTitle>
                  </DialogHeader>
                  <PreviewComponent />
                </DialogContent>
              </Dialog>
              
              <Button onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? (
                  <>Generating...</>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Report Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{reportMetrics.summary.total}</p>
              <p className="text-sm text-muted-foreground">Total RFIs</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{reportMetrics.summary.responseRate}%</p>
              <p className="text-sm text-muted-foreground">Response Rate</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{reportMetrics.summary.avgResponseTime}</p>
              <p className="text-sm text-muted-foreground">Avg Response Time (days)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{reportMetrics.summary.overdue}</p>
              <p className="text-sm text-muted-foreground">Overdue RFIs</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};