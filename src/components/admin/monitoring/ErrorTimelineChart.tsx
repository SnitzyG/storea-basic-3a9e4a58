import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subHours, startOfHour } from 'date-fns';
import { ErrorDetail } from '@/hooks/useMonitoringData';

interface ErrorTimelineChartProps {
  errors: ErrorDetail[];
}

export const ErrorTimelineChart = ({ errors }: ErrorTimelineChartProps) => {
  const chartData = useMemo(() => {
    const hours = 24;
    const now = new Date();
    const data: any[] = [];

    for (let i = hours - 1; i >= 0; i--) {
      const hourStart = startOfHour(subHours(now, i));
      const hourEnd = startOfHour(subHours(now, i - 1));
      
      const errorCount = errors.filter(e => {
        const errorTime = new Date(e.created_at);
        return errorTime >= hourStart && errorTime < hourEnd;
      }).length;

      data.push({
        time: format(hourStart, 'HH:mm'),
        errors: errorCount,
      });
    }

    return data;
  }, [errors]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="errorGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="time"
          className="text-xs"
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
        />
        <YAxis
          className="text-xs"
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
        />
        <Area
          type="monotone"
          dataKey="errors"
          stroke="hsl(var(--destructive))"
          fill="url(#errorGradient)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
