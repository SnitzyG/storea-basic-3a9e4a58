import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { ZoomIn, ZoomOut, Calendar, CalendarDays, Clock } from 'lucide-react';
import { AdvancedProject } from '@/hooks/useAdvancedProjects';
type ZoomLevel = 'day' | 'week' | 'month' | 'quarter' | 'halfyear' | 'year';
interface ProjectGanttChartProps {
  projects: AdvancedProject[];
}
export const ProjectGanttChart: React.FC<ProjectGanttChartProps> = ({
  projects
}) => {
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('quarter');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Filter projects with valid dates
  const validProjects = useMemo(() => {
    return projects.filter(project => project.estimated_start_date && project.estimated_finish_date);
  }, [projects]);

  // Calculate date range and scale
  const {
    startDate,
    endDate,
    totalDays,
    dateLabels
  } = useMemo(() => {
    if (validProjects.length === 0) {
      const today = new Date();
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
      return {
        startDate: today,
        endDate: nextMonth,
        totalDays: 30,
        dateLabels: []
      };
    }
    const allDates = validProjects.flatMap(project => [new Date(project.estimated_start_date!), new Date(project.estimated_finish_date!)]);
    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));

    // Add padding
    const padding = 7; // 7 days
    const startWithPadding = new Date(minDate);
    startWithPadding.setDate(startWithPadding.getDate() - padding);
    const endWithPadding = new Date(maxDate);
    endWithPadding.setDate(endWithPadding.getDate() + padding);
    const diffTime = endWithPadding.getTime() - startWithPadding.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Generate date labels based on zoom level
    const labels = [];
    const current = new Date(startWithPadding);
    if (zoomLevel === 'day') {
      while (current <= endWithPadding) {
        const month = String(current.getMonth() + 1).padStart(2, '0');
        const day = String(current.getDate()).padStart(2, '0');
        labels.push({
          date: new Date(current),
          label: `${month}.${day}`
        });
        current.setDate(current.getDate() + 1);
      }
    } else if (zoomLevel === 'week') {
      // Start from beginning of week
      current.setDate(current.getDate() - current.getDay());
      while (current <= endWithPadding) {
        const month = String(current.getMonth() + 1).padStart(2, '0');
        const day = String(current.getDate()).padStart(2, '0');
        labels.push({
          date: new Date(current),
          label: `${month}.${day}`
        });
        current.setDate(current.getDate() + 7);
      }
    } else if (zoomLevel === 'month') {
      current.setDate(1); // Start from beginning of month
      while (current <= endWithPadding) {
        const month = String(current.getMonth() + 1).padStart(2, '0');
        const year = String(current.getFullYear()).slice(-2);
        labels.push({
          date: new Date(current),
          label: `${month}.${year}`
        });
        current.setMonth(current.getMonth() + 1);
      }
    } else if (zoomLevel === 'quarter') {
      // Start from beginning of quarter
      const quarter = Math.floor(current.getMonth() / 3);
      current.setMonth(quarter * 3, 1);
      while (current <= endWithPadding) {
        const q = Math.floor(current.getMonth() / 3) + 1;
        const year = String(current.getFullYear()).slice(-2);
        labels.push({
          date: new Date(current),
          label: `Q${q}.${year}`
        });
        current.setMonth(current.getMonth() + 3);
      }
    } else if (zoomLevel === 'halfyear') {
      // Start from beginning of half year (Jan or Jul)
      const half = current.getMonth() < 6 ? 0 : 6;
      current.setMonth(half, 1);
      while (current <= endWithPadding) {
        const h = current.getMonth() < 6 ? 1 : 2;
        const year = String(current.getFullYear()).slice(-2);
        labels.push({
          date: new Date(current),
          label: `H${h}.${year}`
        });
        current.setMonth(current.getMonth() + 6);
      }
    } else {
      // year
      current.setMonth(0, 1); // Start from beginning of year
      while (current <= endWithPadding) {
        const year = String(current.getFullYear()).slice(-2);
        labels.push({
          date: new Date(current),
          label: year
        });
        current.setFullYear(current.getFullYear() + 1);
      }
    }
    return {
      startDate: startWithPadding,
      endDate: endWithPadding,
      totalDays: diffDays,
      dateLabels: labels
    };
  }, [validProjects, zoomLevel]);

  // Calculate positions for project bars
  const projectBars = useMemo(() => {
    return validProjects.map(project => {
      const projectStart = new Date(project.estimated_start_date!);
      const projectEnd = new Date(project.estimated_finish_date!);
      const startOffset = (projectStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      const duration = (projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24);
      const leftPercent = startOffset / totalDays * 100;
      const widthPercent = duration / totalDays * 100;
      return {
        project,
        leftPercent: Math.max(0, leftPercent),
        widthPercent: Math.max(1, widthPercent),
        startDate: projectStart,
        endDate: projectEnd
      };
    });
  }, [validProjects, startDate, totalDays]);
  const getPixelWidth = () => {
    const baseWidth = 800; // Reduced from 1200
    const multiplier = {
      day: 2,
      week: 1.5,
      month: 1,
      quarter: 0.8, // Reduced from 1
      halfyear: 0.6, // Reduced from 0.8
      year: 0.5 // Reduced from 0.6
    }[zoomLevel];
    return baseWidth * multiplier;
  };
  const statusColors = {
    planning: 'bg-gradient-to-r from-blue-500 to-blue-600',
    active: 'bg-gradient-to-r from-green-500 to-green-600',
    on_hold: 'bg-gradient-to-r from-yellow-500 to-orange-500',
    completed: 'bg-gradient-to-r from-emerald-500 to-teal-600',
    cancelled: 'bg-gradient-to-r from-red-500 to-red-600'
  };
  if (validProjects.length === 0) {
    return <Card className="shadow-lg border-0 bg-gradient-to-br from-card to-card/50">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
          <CardTitle className="flex items-center gap-3 text-xl font-bold">
            <div className="p-2 rounded-lg bg-primary/10">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Project Timeline
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="text-center py-12">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Timeline Data</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              No projects with valid start and finish dates found. Add project dates to see your timeline visualization.
            </p>
          </div>
        </CardContent>
      </Card>;
  }
  return <TooltipProvider>
      <Card className="shadow-lg border-0 bg-gradient-to-br from-card to-card/50">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-xl font-bold">
              <div className="p-2 rounded-lg bg-primary/10">
                <CalendarDays className="h-5 w-5 text-primary" />
              </div>
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Project Timeline
              </span>
            </CardTitle>
            <div className="flex items-center gap-2 bg-background/50 backdrop-blur-sm rounded-lg p-1 border">
              <Button 
                variant={zoomLevel === 'quarter' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => setZoomLevel('quarter')}
                className="transition-all duration-200 hover:scale-105"
              >
                Quarterly
              </Button>
              <Button 
                variant={zoomLevel === 'halfyear' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => setZoomLevel('halfyear')}
                className="transition-all duration-200 hover:scale-105"
              >
                Half-Yearly
              </Button>
              <Button 
                variant={zoomLevel === 'year' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => setZoomLevel('year')}
                className="transition-all duration-200 hover:scale-105"
              >
                Yearly
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-t bg-gradient-to-b from-background to-muted/20">
            <div ref={scrollContainerRef} className="overflow-x-auto overflow-y-hidden" style={{
            maxHeight: '350px' // Reduced from 500px
          }}>
              <div className="relative" style={{
              width: `${getPixelWidth()}px`,
              minHeight: `${validProjects.length * 50 + 60}px` // Reduced height from 70 to 50
            }}>
                {/* Timeline header */}
                <div className="sticky top-0 bg-gradient-to-r from-background via-background/95 to-background border-b-2 border-primary/20 h-12 flex items-center relative z-10 shadow-sm">
                  {dateLabels.map((label, index) => <div key={index} className="absolute text-xs font-medium text-foreground/80 border-l-2 border-primary/30 pl-2" style={{
                  left: `${(label.date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) / totalDays * 100}%`,
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                      <div className="bg-background/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-xs shadow-sm border">
                        {label.label}
                      </div>
                    </div>)}
                </div>

                {/* Project bars */}
                <div className="relative py-2">
                  {projectBars.map((bar, index) => <div key={bar.project.id} className="absolute h-8 flex items-center group" style={{
                  top: `${index * 50 + 12}px`,
                  left: `${bar.leftPercent}%`,
                  width: `${bar.widthPercent}%`,
                  minWidth: '100px'
                }}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className={`w-full h-6 rounded-lg flex items-center px-3 text-white text-xs font-semibold cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg group-hover:shadow-xl ${statusColors[bar.project.status] || 'bg-gray-500'} shadow-md relative overflow-hidden`}> {/* Reduced from h-8 to h-6, px-4 to px-3, text-sm to text-xs */}
                            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-50"></div>
                            <div className="absolute inset-0 bg-gradient-to-l from-black/10 to-transparent"></div>
                            <Clock className="h-3 w-3 mr-1.5 opacity-80" /> {/* Reduced from h-4 w-4 mr-2 to h-3 w-3 mr-1.5 */}
                            <span className="truncate relative z-10">
                              {bar.project.project_reference_number || bar.project.name}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm bg-background/95 backdrop-blur-sm border-2">
                          <div className="space-y-3 p-2">
                            <div className="font-bold text-lg text-primary">{bar.project.name}</div>
                            {bar.project.project_reference_number && <div className="text-sm text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                                Reference: {bar.project.project_reference_number}
                              </div>}
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="space-y-1">
                                <div className="font-medium text-green-600">Start Date</div>
                                <div>{bar.startDate.toLocaleDateString()}</div>
                              </div>
                              <div className="space-y-1">
                                <div className="font-medium text-red-600">End Date</div>
                                <div>{bar.endDate.toLocaleDateString()}</div>
                              </div>
                            </div>
                            <Badge variant="secondary" className="text-sm px-3 py-1 font-medium">
                              {bar.project.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>)}
                </div>

                {/* Enhanced Grid lines */}
                <div className="absolute inset-0 pointer-events-none">
                  {dateLabels.map((label, index) => <div key={index} className="absolute border-l border-primary/10" style={{
                  left: `${(label.date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) / totalDays * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(to bottom, transparent 0%, hsl(var(--primary) / 0.05) 50%, transparent 100%)'
                }} />)}
                  {/* Horizontal grid lines */}
                  {validProjects.map((_, index) => (
                    <div 
                      key={index} 
                      className="absolute border-b border-muted/30 w-full"
                      style={{
                        top: `${index * 50 + 40}px`, // Adjusted for new spacing
                        height: '1px'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>;
};