'use client';

import { useCampaignROI } from '@/hooks/useAnalytics';
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

export function ROIChart() {
  const { data, isLoading } = useCampaignROI();

  if (isLoading) {
    return (
      <ChartCard title="Campaign ROI">
        <Loading text="Loading ROI data..." />
      </ChartCard>
    );
  }

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <ChartCard title="Campaign ROI">
        <p className="text-muted-foreground text-center py-8">No ROI data available</p>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Campaign ROI" description="Return on investment by campaign">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="campaignName" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="roi" fill="#8884d8" name="ROI %" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

