'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { Loading } from '@/components/loading';
import { Activity, Calendar, Mail, Phone, FileText } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Activity {
  id: string;
  type: string;
  description: string;
  userId: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
  };
}

const activityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  note: FileText,
  task_created: Activity,
  task_completed: Activity,
  campaign_created: Activity,
  campaign_updated: Activity,
  invoice_sent: FileText,
  payment_received: Activity,
  other: Activity,
};

export function ActivityFeed() {
  const { user } = useAuth();

  const { data: activities, isLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      // Activities are embedded in client/campaign/task responses
      // For now, return empty array - can be enhanced later with dedicated endpoint
      return [];
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <Loading text="Loading activities..." />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest system activities</CardDescription>
      </CardHeader>
      <CardContent>
        {activities && activities.length > 0 ? (
          <div className="space-y-4">
            {activities.slice(0, 10).map((activity) => {
              const Icon = activityIcons[activity.type] || Activity;
              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="mt-1">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(activity.createdAt), 'PPp')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No recent activity
          </p>
        )}
      </CardContent>
    </Card>
  );
}

