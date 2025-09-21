import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { ZoomIn, ZoomOut, Calendar, CalendarDays, Clock } from 'lucide-react';
import { AdvancedProject } from '@/hooks/useAdvancedProjects';
type ZoomLevel = 'day' | 'week' | 'month';
interface ProjectGanttChartProps {
  projects: AdvancedProject[];
}
export const ProjectGanttChart: React.FC<ProjectGanttChartProps> = ({
  projects
}) => {
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('month');
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
    } else {
      // month
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
    const baseWidth = 1200;
    const multiplier = zoomLevel === 'day' ? 3 : zoomLevel === 'week' ? 2 : 1;
    return baseWidth * multiplier;
  };
  const statusColors = {
    planning: 'bg-blue-500',
    active: 'bg-green-500',
    on_hold: 'bg-yellow-500',
    completed: 'bg-gray-500',
    cancelled: 'bg-red-500'
  };
  if (validProjects.length === 0) {
    return <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Project Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No projects with valid start and finish dates found.
          </div>
        </CardContent>
      </Card>;
  }
  return <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Project Timeline
            </CardTitle>
            <div className="flex items-center gap-2">
              
              
              <Button variant={zoomLevel === 'month' ? 'default' : 'outline'} size="sm" onClick={() => setZoomLevel('month')}>
                <Calendar className="h-4 w-4 mr-1" />
                Month
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-t">
            <div ref={scrollContainerRef} className="overflow-x-auto overflow-y-hidden" style={{
            maxHeight: '400px'
          }}>
              <div className="relative" style={{
              width: `${getPixelWidth()}px`,
              minHeight: `${validProjects.length * 60 + 60}px`
            }}>
                {/* Timeline header */}
                <div className="sticky top-0 bg-background border-b h-12 flex items-center relative z-10">
                  {dateLabels.map((label, index) => <div key={index} className="absolute text-xs text-muted-foreground border-l border-border pl-2" style={{
                  left: `${(label.date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) / totalDays * 100}%`,
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                      {label.label}
                    </div>)}
                </div>

                {/* Project bars */}
                <div className="relative">
                  {projectBars.map((bar, index) => <div key={bar.project.id} className="absolute h-8 flex items-center" style={{
                  top: `${index * 60 + 16}px`,
                  left: `${bar.leftPercent}%`,
                  width: `${bar.widthPercent}%`,
                  minWidth: '80px'
                }}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className={`w-full h-6 rounded-md flex items-center px-2 text-white text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${statusColors[bar.project.status] || 'bg-gray-500'}`}>
                            <span className="truncate">
                              {bar.project.project_reference_number || bar.project.name}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="space-y-1">
                            <div className="font-medium">{bar.project.name}</div>
                            {bar.project.project_reference_number && <div className="text-xs text-muted-foreground">
                                Ref: {bar.project.project_reference_number}
                              </div>}
                            <div className="text-xs">
                              Start: {bar.startDate.toLocaleDateString()}
                            </div>
                            <div className="text-xs">
                              Finish: {bar.endDate.toLocaleDateString()}
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {bar.project.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>)}
                </div>

                {/* Grid lines */}
                <div className="absolute inset-0 pointer-events-none">
                  {dateLabels.map((label, index) => <div key={index} className="absolute border-l border-border/30" style={{
                  left: `${(label.date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) / totalDays * 100}%`,
                  height: '100%'
                }} />)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>;
};