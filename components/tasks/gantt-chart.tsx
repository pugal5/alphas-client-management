'use client';

import { useEffect, useRef } from 'react';
import Gantt from 'frappe-gantt';
import 'frappe-gantt/dist/frappe-gantt.css';
import { Task } from '@/hooks/useTasks';
import { format } from 'date-fns';

interface GanttChartProps {
  tasks: Task[];
}

export function GanttChart({ tasks }: GanttChartProps) {
  const ganttRef = useRef<HTMLDivElement>(null);
  const ganttInstanceRef = useRef<Gantt | null>(null);

  useEffect(() => {
    if (!ganttRef.current || tasks.length === 0) return;

    // Convert tasks to Gantt format
    const ganttTasks = tasks.map((task) => {
      const startDate = task.startDate ? new Date(task.startDate) : new Date();
      const dueDate = task.dueDate ? new Date(task.dueDate) : new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      return {
        id: task.id,
        name: task.title || task.name || 'Untitled Task',
        start: format(startDate, 'yyyy-MM-dd'),
        end: format(dueDate, 'yyyy-MM-dd'),
        progress: task.status === 'completed' ? 100 : task.status === 'in_progress' ? 50 : 0,
        dependencies: task.dependencies?.map(dep => dep.dependsOnId).join(',') || '',
        custom_class: task.priority === 'urgent' ? 'urgent' : task.priority === 'high' ? 'high' : '',
      };
    });

    // Destroy existing instance if any
    if (ganttInstanceRef.current) {
      ganttRef.current.innerHTML = '';
    }

    // Create new Gantt instance
    try {
      ganttInstanceRef.current = new Gantt(ganttRef.current, ganttTasks, {
        view_mode: 'Month',
        language: 'en',
        header_height: 50,
        column_width: 30,
        step: 24,
        bar_height: 20,
        bar_corner_radius: 3,
        arrow_curve: 5,
        padding: 18,
        date_format: 'YYYY-MM-DD',
        on_click: (task: any) => {
          window.location.href = `/tasks/${task.id}`;
        },
        on_date_change: (task: any, start: Date, end: Date) => {
          // Handle date changes if needed
          console.log('Task date changed:', task, start, end);
        },
        on_progress_change: (task: any, progress: number) => {
          // Handle progress changes if needed
          console.log('Task progress changed:', task, progress);
        },
        on_view_change: (mode: string) => {
          // Handle view mode changes if needed
          console.log('View mode changed:', mode);
        },
      });
    } catch (error) {
      console.error('Error creating Gantt chart:', error);
    }

    return () => {
      if (ganttInstanceRef.current && ganttRef.current) {
        ganttRef.current.innerHTML = '';
        ganttInstanceRef.current = null;
      }
    };
  }, [tasks]);

  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border rounded-lg">
        <p className="text-muted-foreground">No tasks available for Gantt chart</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <div ref={ganttRef} className="gantt-container" />
      <style jsx global>{`
        .gantt-container {
          font-family: inherit;
        }
        .gantt-container .grid-background {
          fill: transparent;
        }
        .gantt-container .row {
          fill: transparent;
        }
        .gantt-container .row-line {
          stroke: hsl(var(--border));
          stroke-width: 1;
        }
        .gantt-container .today-highlight {
          fill: hsl(var(--accent));
          opacity: 0.2;
        }
        .gantt-container .arrow {
          stroke: hsl(var(--muted-foreground));
        }
        .gantt-container .bar-wrapper .bar {
          fill: hsl(var(--primary));
        }
        .gantt-container .bar-wrapper .bar-progress {
          fill: hsl(var(--primary));
          opacity: 0.6;
        }
        .gantt-container .bar-wrapper .bar-label {
          fill: hsl(var(--foreground));
        }
        .gantt-container .bar-wrapper .bar.urgent {
          fill: #ef4444;
        }
        .gantt-container .bar-wrapper .bar.high {
          fill: #f59e0b;
        }
        .gantt-container .lower-text,
        .gantt-container .upper-text {
          fill: hsl(var(--muted-foreground));
        }
        .gantt-container .header-text {
          fill: hsl(var(--foreground));
        }
      `}</style>
    </div>
  );
}

