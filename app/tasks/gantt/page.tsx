'use client';

import { GanttChart } from '@/components/tasks/gantt-chart';
import { useGanttData } from '@/hooks/useTasks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loading } from '@/components/loading';

export default function GanttPage() {
  const { data: tasks, isLoading } = useGanttData();

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Gantt Chart</h1>
        <p className="text-muted-foreground mt-1">
          Visualize task timelines and dependencies
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Task Timeline</CardTitle>
          <CardDescription>
            Drag tasks to reschedule, click to view details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loading text="Loading Gantt chart..." />
          ) : (
            <GanttChart tasks={tasks || []} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

