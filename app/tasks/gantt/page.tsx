'use client';

import Link from 'next/link';
import { GanttChart } from '@/components/tasks/gantt-chart';
import { useGanttData } from '@/hooks/useTasks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/loading';
import { ArrowLeft } from 'lucide-react';

export default function GanttPage() {
  const { data: tasks, isLoading } = useGanttData();

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gantt Chart</h1>
          <p className="text-muted-foreground mt-1">
            Visualize task timelines and dependencies
          </p>
        </div>
        <Link href="/tasks">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tasks
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Task Timeline</CardTitle>
          <CardDescription>
            Click on tasks to view details. Use the controls to zoom and navigate the timeline.
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

