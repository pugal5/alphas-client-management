'use client';

import { useTeamUtilization } from '@/hooks/useAnalytics';
import { ChartCard } from './chart-card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Loading } from '@/components/loading';

export function UtilizationChart() {
  const { data, isLoading } = useTeamUtilization();

  if (isLoading) {
    return (
      <ChartCard title="Team Utilization">
        <Loading text="Loading utilization data..." />
      </ChartCard>
    );
  }

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <ChartCard title="Team Utilization">
        <p className="text-muted-foreground text-center py-8">No utilization data available</p>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Team Utilization" description="Team member workload and capacity">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="userName" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="utilization" fill="#82ca9d" name="Utilization %" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

