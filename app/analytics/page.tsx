'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ROIChart } from '@/components/analytics/roi-chart';
import { UtilizationChart } from '@/components/analytics/utilization-chart';
import { useDashboardMetrics, useTaskOnTimePercentage, useClientProfitability, useBudgetAccuracy } from '@/hooks/useAnalytics';
import { Loading } from '@/components/loading';
import {
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
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function AnalyticsPage() {
  const { data: dashboardMetrics, isLoading: metricsLoading } = useDashboardMetrics();
  const { data: onTimeData, isLoading: onTimeLoading } = useTaskOnTimePercentage();
  const { data: profitabilityData, isLoading: profitabilityLoading } = useClientProfitability();
  const { data: budgetData, isLoading: budgetLoading } = useBudgetAccuracy();

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Insights and performance metrics
        </p>
      </div>

      {metricsLoading ? (
        <Loading text="Loading analytics..." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardMetrics?.totalClients || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardMetrics?.activeCampaigns || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardMetrics?.pendingTasks || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(dashboardMetrics?.totalRevenue || 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <ROIChart />
        <UtilizationChart />
      </div>

      <div className="grid gap-4 md:grid-cols-2 mt-4">
        {onTimeLoading ? (
          <Card>
            <CardHeader>
              <CardTitle>Task On-Time Percentage</CardTitle>
            </CardHeader>
            <CardContent>
              <Loading text="Loading..." />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Task On-Time Percentage</CardTitle>
              <CardDescription>Percentage of tasks completed on time</CardDescription>
            </CardHeader>
            <CardContent>
              {onTimeData ? (
                <div className="text-center">
                  <div className="text-4xl font-bold">{onTimeData.percentage || 0}%</div>
                  <p className="text-muted-foreground mt-2">
                    {onTimeData.onTime || 0} of {onTimeData.total || 0} tasks completed on time
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No data available</p>
              )}
            </CardContent>
          </Card>
        )}

        {profitabilityLoading ? (
          <Card>
            <CardHeader>
              <CardTitle>Client Profitability</CardTitle>
            </CardHeader>
            <CardContent>
              <Loading text="Loading..." />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Client Profitability</CardTitle>
              <CardDescription>Top clients by profitability</CardDescription>
            </CardHeader>
            <CardContent>
              {profitabilityData && Array.isArray(profitabilityData) && profitabilityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={profitabilityData.slice(0, 5)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: $${value.toLocaleString()}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="profitability"
                    >
                      {profitabilityData.slice(0, 5).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-8">No profitability data available</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {budgetLoading ? (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Budget Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <Loading text="Loading..." />
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Budget Accuracy</CardTitle>
            <CardDescription>Budget vs actual spending accuracy</CardDescription>
          </CardHeader>
          <CardContent>
            {budgetData ? (
              <div className="text-center">
                <div className="text-4xl font-bold">{budgetData.accuracy || 0}%</div>
                <p className="text-muted-foreground mt-2">
                  Average budget accuracy across all campaigns
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No budget data available</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

