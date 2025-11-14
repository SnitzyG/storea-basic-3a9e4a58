import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, subMinutes, startOfMinute } from 'date-fns';
import { PerformanceMetric } from '@/hooks/useMonitoringData';

interface PerformanceChartProps {
  metrics: PerformanceMetric[];
}

export const PerformanceChart = ({ metrics }: PerformanceChartProps) => {
  const chartData = useMemo(() => {
    const minutes = 60;
    const now = new Date();
    const data: any[] = [];

    for (let i = minutes - 1; i >= 0; i--) {
      const minuteStart = startOfMinute(subMinutes(now, i));
      const minuteEnd = startOfMinute(subMinutes(now, i - 1));
      
      const minuteMetrics = metrics.filter(m => {
        const metricTime = new Date(m.created_at);
        return metricTime >= minuteStart && metricTime < minuteEnd;
      });

      const avgValue = minuteMetrics.length > 0
        ? minuteMetrics.reduce((sum, m) => sum + m.duration_ms, 0) / minuteMetrics.length
        : 0;

      data.push({
        time: format(minuteStart, 'HH:mm'),
        response_time: Math.round(avgValue),
        count: minuteMetrics.length,
      });
    }

    return data;
  }, [metrics]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="time"
          className="text-xs"
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
        />
        <YAxis
          className="text-xs"
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
          label={{ value: 'ms', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="response_time"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={false}
          name="Response Time (ms)"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
