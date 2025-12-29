'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useClients } from '@/hooks/useClients';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useTasks } from '@/hooks/useTasks';
import Link from 'next/link';
import { format } from 'date-fns';
import { Loading } from '@/components/loading';

export function RecentItems() {
  const { data: clientsData } = useClients({ limit: 5 });
  const { data: campaignsData } = useCampaigns({ limit: 5 });
  const { data: tasksData } = useTasks({ limit: 5 });

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Recent Clients</CardTitle>
          <CardDescription>Latest client additions</CardDescription>
        </CardHeader>
        <CardContent>
          {!clientsData ? (
            <Loading size="sm" />
          ) : clientsData.clients.length > 0 ? (
            <div className="space-y-2">
              {clientsData.clients.slice(0, 5).map((client) => (
                <Link
                  key={client.id}
                  href={`/clients/${client.id}`}
                  className="block p-2 rounded hover:bg-muted transition-colors"
                >
                  <div className="font-medium">{client.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(client.createdAt), 'MMM d, yyyy')}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No clients yet</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Campaigns</CardTitle>
          <CardDescription>Latest campaign activity</CardDescription>
        </CardHeader>
        <CardContent>
          {!campaignsData ? (
            <Loading size="sm" />
          ) : campaignsData.campaigns.length > 0 ? (
            <div className="space-y-2">
              {campaignsData.campaigns.slice(0, 5).map((campaign) => (
                <Link
                  key={campaign.id}
                  href={`/campaigns/${campaign.id}`}
                  className="block p-2 rounded hover:bg-muted transition-colors"
                >
                  <div className="font-medium">{campaign.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(campaign.createdAt), 'MMM d, yyyy')}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No campaigns yet</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Tasks</CardTitle>
          <CardDescription>Latest task updates</CardDescription>
        </CardHeader>
        <CardContent>
          {!tasksData ? (
            <Loading size="sm" />
          ) : tasksData.tasks.length > 0 ? (
            <div className="space-y-2">
              {tasksData.tasks.slice(0, 5).map((task) => (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="block p-2 rounded hover:bg-muted transition-colors"
                >
                  <div className="font-medium">{task.title || task.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(task.updatedAt), 'MMM d, yyyy')}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No tasks yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

