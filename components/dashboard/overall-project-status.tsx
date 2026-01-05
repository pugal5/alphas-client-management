'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGanttData } from '@/hooks/useTasks';
import { Loading } from '@/components/loading';

interface StatusSummary {
  onTrack: number;
  atRisk: number;
  overdue: number;
  total: number;
}

export function OverallProjectStatus() {
  const { data: tasks, isLoading } = useGanttData();

  const summary: StatusSummary = useMemo(() => {
    const base: StatusSummary = {
      onTrack: 0,
      atRisk: 0,
      overdue: 0,
      total: 0,
    };

    if (!tasks || !Array.isArray(tasks)) {
      return base;
    }

    const now = new Date();

    for (const task of tasks as any[]) {
      if (!task) continue;

      const endRaw = (task as any).end;
      const progressRaw = (task as any).progress;

      const endDate = endRaw ? new Date(endRaw) : undefined;
      const progress =
        typeof progressRaw === 'number' && isFinite(progressRaw) ? progressRaw : 0;

      base.total += 1;

      // Overdue: end date in the past and not fully completed
      if (endDate && !isNaN(endDate.getTime()) && endDate < now && progress < 100) {
        base.overdue += 1;
        continue;
      }

      // On Track: at least half done or completed
      if (progress >= 50) {
        base.onTrack += 1;
      } else {
        // Remaining active work that is not yet half complete is considered at risk
        base.atRisk += 1;
      }
    }

    return base;
  }, [tasks]);

  const { onTrack, atRisk, overdue, total } = summary;

  const renderRow = (label: string, colorClass: string, value: number) => {
    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

    return (
      <div className="flex items-center gap-4">
        <div className="w-24 text-sm text-muted-foreground">{label}</div>
        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full ${colorClass}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="w-10 text-right text-sm text-muted-foreground">
          {value}
        </div>
      </div>
    );
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-4">
        <CardTitle className="text-sm font-medium">
          Overall Project Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="py-4">
            <Loading text="Calculating project status..." />
          </div>
        ) : total === 0 ? (
          <p className="text-sm text-muted-foreground">
            No tasks available yet. Create tasks to see overall project status.
          </p>
        ) : (
          <>
            {renderRow('On Track', 'bg-emerald-500', onTrack)}
            {renderRow('At Risk', 'bg-amber-400', atRisk)}
            {renderRow('Overdue', 'bg-red-500', overdue)}
          </>
        )}
      </CardContent>
    </Card>
  );
}


