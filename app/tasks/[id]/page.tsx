'use client';

import { useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTask, useDeleteTask, useUpdateTaskStatus, useUpdateTimeTracking, Task } from '@/hooks/useTasks';
import { TaskForm } from '@/components/tasks/task-form';
import { Pencil, Trash2, Calendar, Clock, User } from 'lucide-react';
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

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editMode = searchParams.get('edit') === 'true';
  const taskId = params.id as string;

  const { data: task, isLoading } = useTask(taskId);
  const deleteTask = useDeleteTask();
  const updateStatus = useUpdateTaskStatus();
  const updateTimeTracking = useUpdateTimeTracking();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [actualHours, setActualHours] = useState('');

  if (isLoading) {
    return (
      <div className="p-8">
        <Loading text="Loading task..." />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6">
            <p>Task not found</p>
            <Button onClick={() => router.push('/tasks')} className="mt-4">
              Back to Tasks
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      await deleteTask.mutateAsync(taskId);
      router.push('/tasks');
    }
  };

  const handleStatusChange = async (status: Task['status']) => {
    await updateStatus.mutateAsync({ id: taskId, status });
  };

  const handleTimeUpdate = async () => {
    if (actualHours.trim()) {
      await updateTimeTracking.mutateAsync({ id: taskId, actualHours: parseFloat(actualHours) });
      setActualHours('');
    }
  };

  const statusColors = {
    not_started: 'outline',
    in_progress: 'default',
    under_review: 'secondary',
    completed: 'default',
    blocked: 'destructive',
    cancelled: 'secondary',
  } as const;

  const priorityColors = {
    low: 'outline',
    medium: 'default',
    high: 'destructive',
    urgent: 'destructive',
  } as const;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{task.title || task.name}</h1>
            <Badge variant={statusColors[task.status] || 'default'}>
              {task.status.replace('_', ' ')}
            </Badge>
            <Badge variant={priorityColors[task.priority] || 'default'}>
              {task.priority}
            </Badge>
          </div>
          {task.campaign && (
            <p className="text-muted-foreground mt-1">
              Campaign: <Link href={`/campaigns/${task.campaign.id}`} className="text-blue-600 hover:underline">{task.campaign.name}</Link>
            </p>
          )}
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
          <TabsTrigger value="time">Time Tracking</TabsTrigger>
          <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Task Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {task.description && (
                  <div>
                    <div className="text-sm text-muted-foreground">Description</div>
                    <div className="mt-1">{task.description}</div>
                  </div>
                )}
                {task.startDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Start Date</div>
                      <div>{format(new Date(task.startDate), 'PPP')}</div>
                    </div>
                  </div>
                )}
                {task.dueDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Due Date</div>
                      <div>{format(new Date(task.dueDate), 'PPP')}</div>
                    </div>
                  </div>
                )}
                {task.assignedTo && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Assigned To</div>
                      <div>
                        {task.assignedTo.firstName} {task.assignedTo.lastName}
                      </div>
                    </div>
                  </div>
                )}
                {task.creator && (
                  <div>
                    <div className="text-sm text-muted-foreground">Created By</div>
                    <div>
                      {task.creator.firstName} {task.creator.lastName}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Current Status</div>
                  <Select
                    value={task.status}
                    onValueChange={(value) => handleStatusChange(value as Task['status'])}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_started">Not Started</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {task.completedAt && (
                  <div>
                    <div className="text-sm text-muted-foreground">Completed At</div>
                    <div>{format(new Date(task.completedAt), 'PPP p')}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="time" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Time Tracking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Estimated Hours</div>
                  <div className="text-2xl font-bold">
                    {task.estimatedHours ? `${task.estimatedHours}h` : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Actual Hours</div>
                  <div className="text-2xl font-bold">
                    {task.actualHours ? `${task.actualHours}h` : '-'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Enter actual hours"
                  value={actualHours}
                  onChange={(e) => setActualHours(e.target.value)}
                  className="max-w-xs"
                />
                <Button onClick={handleTimeUpdate} disabled={!actualHours.trim()}>
                  Update
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dependencies">
          <Card>
            <CardHeader>
              <CardTitle>Dependencies</CardTitle>
              <CardDescription>
                Tasks that must be completed before this one
              </CardDescription>
            </CardHeader>
            <CardContent>
              {task.dependencies && task.dependencies.length > 0 ? (
                <div className="space-y-2">
                  {task.dependencies.map((dep) => (
                    <div key={dep.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <Link
                        href={`/tasks/${dep.dependsOn.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {dep.dependsOn.name}
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No dependencies</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <TaskForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        task={task}
      />
    </div>
  );
}

