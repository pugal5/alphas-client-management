'use client';

import { useDashboardMetrics } from '@/hooks/useAnalytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loading } from '@/components/loading';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { RecentItems } from '@/components/dashboard/recent-items';
import { ActivityFeed } from '@/components/dashboard/activity-feed';

export default function DashboardPage() {
  const { data: metrics, isLoading } = useDashboardMetrics();

  if (isLoading) {
    return (
      <div className="p-8">
        <Loading text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Clients</CardTitle>
            <CardDescription>Active clients</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalClients || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active Campaigns</CardTitle>
            <CardDescription>Currently running</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.activeCampaigns || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tasks</CardTitle>
            <CardDescription>{metrics?.completedTasks || 0} / {metrics?.totalTasks || 0} completed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalTasks || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
            <CardDescription>Total revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(metrics?.totalRevenue || 0).toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <QuickActions />
      </div>

      {/* Recent Items and Activity Feed */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <RecentItems />
        </div>
        <div>
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}

