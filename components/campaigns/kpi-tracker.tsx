'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Campaign } from '@/hooks/useCampaigns';

interface KPITrackerProps {
  campaign: Campaign;
}

export function KPITracker({ campaign }: KPITrackerProps) {
  const parseKPIs = (kpiString?: string): Record<string, number> => {
    if (!kpiString) return {};
    const kpis: Record<string, number> = {};
    try {
      const lines = kpiString.split('\n');
      lines.forEach((line) => {
        const match = line.match(/(.+?):\s*(\d+)/);
        if (match) {
          const value = parseFloat(match[2]);
          if (!isNaN(value) && isFinite(value)) {
            kpis[match[1].trim()] = value;
          }
        }
      });
    } catch (e) {
      // Invalid format, return empty
    }
    return kpis;
  };

  const targets = parseKPIs(campaign.kpiTarget);
  const actuals = parseKPIs(campaign.kpiActual);

  const calculateProgress = (target: number, actual: number): number => {
    if (!target || target === 0) return 0;
    return Math.min((actual / target) * 100, 100);
  };

  if (Object.keys(targets).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>KPI Tracking</CardTitle>
          <CardDescription>No KPIs defined for this campaign</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>KPI Tracking</CardTitle>
        <CardDescription>Monitor campaign performance metrics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(targets).map(([key, target]) => {
          const actual = typeof actuals[key] === 'number' ? actuals[key] : 0;
          const progress = calculateProgress(target, actual);
          return (
            <div key={key} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{key}</span>
                <span className="text-muted-foreground">
                  {actual.toLocaleString()} / {(target || 0).toLocaleString()}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {progress.toFixed(1)}% complete
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

