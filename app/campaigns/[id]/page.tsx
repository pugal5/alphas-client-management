'use client';

import { useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCampaign, useDeleteCampaign, useUpdateCampaignStatus, useUpdateCampaignKPI, Campaign } from '@/hooks/useCampaigns';
import { CampaignForm } from '@/components/campaigns/campaign-form';
import { KPITracker } from '@/components/campaigns/kpi-tracker';
import { Pencil, Trash2, Calendar, DollarSign, Target } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { Loading } from '@/components/loading';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editMode = searchParams.get('edit') === 'true';
  const campaignId = params.id as string;

  const { data: campaign, isLoading } = useCampaign(campaignId);
  const deleteCampaign = useDeleteCampaign();
  const updateStatus = useUpdateCampaignStatus();
  const updateKPI = useUpdateCampaignKPI();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [kpiActual, setKpiActual] = useState('');

  if (isLoading) {
    return (
      <div className="p-8">
        <Loading text="Loading campaign..." />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6">
            <p>Campaign not found</p>
            <Button onClick={() => router.push('/campaigns')} className="mt-4">
              Back to Campaigns
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      await deleteCampaign.mutateAsync(campaignId);
      router.push('/campaigns');
    }
  };

  const handleStatusChange = async (status: Campaign['status']) => {
    await updateStatus.mutateAsync({ id: campaignId, status });
  };

  const handleKPIUpdate = async () => {
    if (kpiActual.trim()) {
      await updateKPI.mutateAsync({ id: campaignId, kpiActual });
      setKpiActual('');
    }
  };

  const statusColors = {
    planning: 'outline',
    active: 'default',
    paused: 'secondary',
    completed: 'default',
    cancelled: 'secondary',
  } as const;

  const typeLabels: Record<Campaign['type'], string> = {
    social_media: 'Social Media',
    content_marketing: 'Content Marketing',
    email_marketing: 'Email Marketing',
    paid_advertising: 'Paid Advertising',
    seo: 'SEO',
    pr: 'PR',
    event: 'Event',
    other: 'Other',
  };

  const budgetUtilization = campaign.budget !== undefined && campaign.budget !== null && campaign.actualSpend !== undefined && campaign.actualSpend !== null
    ? (Number(campaign.actualSpend) / Number(campaign.budget)) * 100
    : 0;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{campaign.name}</h1>
            <Badge variant={statusColors[campaign.status] || 'default'}>
              {campaign.status}
            </Badge>
            <Badge variant="outline">{typeLabels[campaign.type]}</Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            {campaign.client?.name || 'No client'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsFormOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="kpi">KPIs</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {campaign.description && (
                  <div>
                    <div className="text-sm text-muted-foreground">Description</div>
                    <div className="mt-1">{campaign.description}</div>
                  </div>
                )}
                {campaign.startDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Start Date</div>
                      <div>{format(new Date(campaign.startDate), 'PPP')}</div>
                    </div>
                  </div>
                )}
                {campaign.endDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">End Date</div>
                      <div>{format(new Date(campaign.endDate), 'PPP')}</div>
                    </div>
                  </div>
                )}
                {campaign.assignedTo && (
                  <div>
                    <div className="text-sm text-muted-foreground">Assigned To</div>
                    <div>
                      {campaign.assignedTo.firstName} {campaign.assignedTo.lastName}
                    </div>
                  </div>
                )}
                {campaign.creator && (
                  <div>
                    <div className="text-sm text-muted-foreground">Created By</div>
                    <div>
                      {campaign.creator.firstName} {campaign.creator.lastName}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Budget & Spending</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {campaign.budget !== undefined && campaign.budget !== null && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="text-sm text-muted-foreground">Budget</div>
                      <div className="text-lg font-semibold">
                        ${campaign.budget.toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}
                {campaign.actualSpend !== undefined && campaign.actualSpend !== null && (
                  <div>
                    <div className="text-sm text-muted-foreground">Actual Spend</div>
                    <div className="text-lg font-semibold">
                      ${campaign.actualSpend.toLocaleString()}
                    </div>
                  </div>
                )}
                {campaign.budget && campaign.actualSpend !== undefined && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Budget Utilization</span>
                      <span>{budgetUtilization.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                {campaign.client && (
                  <div className="pt-2">
                    <div className="text-sm text-muted-foreground">Client</div>
                    <Link
                      href={`/clients/${campaign.client.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {campaign.client.name}
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Status Management</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={campaign.status}
                onValueChange={(value) => handleStatusChange(value as Campaign['status'])}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {campaign.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{campaign.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="kpi" className="space-y-4">
          <KPITracker campaign={campaign} />
          <Card>
            <CardHeader>
              <CardTitle>Update KPI Actuals</CardTitle>
              <CardDescription>
                Enter actual KPI values (one per line, format: Metric Name: value)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Reach: 95000&#10;Engagement: 4.5&#10;Conversions: 450"
                value={kpiActual}
                onChange={(e) => setKpiActual(e.target.value)}
                rows={5}
              />
              <Button onClick={handleKPIUpdate} disabled={!kpiActual.trim()}>
                Update KPIs
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Tasks</CardTitle>
              <CardDescription>
                Tasks associated with this campaign
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Tasks will be displayed here. This feature will be implemented in the tasks module.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CampaignForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        campaign={campaign}
      />
    </div>
  );
}

