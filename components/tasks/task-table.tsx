'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/data-table';
import { Task } from '@/hooks/useTasks';
import Link from 'next/link';
import { format } from 'date-fns';

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

export function createTaskColumns(
  onDelete?: (id: string) => void
): ColumnDef<Task>[] {
  return [
    {
      accessorKey: 'title',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const task = row.original;
        return (
          <Link
            href={`/tasks/${task.id}`}
            className="font-medium text-blue-600 hover:underline"
          >
            {task.title || task.name}
          </Link>
        );
      },
    },
    {
      accessorKey: 'campaign',
      header: 'Campaign',
      cell: ({ row }) => {
        const campaign = row.original.campaign;
        return campaign ? (
          <Link
            href={`/campaigns/${campaign.id}`}
            className="text-blue-600 hover:underline"
          >
            {campaign.name}
          </Link>
        ) : '-';
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as Task['status'];
        return (
          <Badge variant={statusColors[status] || 'default'}>
            {status.replace('_', ' ')}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => {
        const priority = row.getValue('priority') as Task['priority'];
        return (
          <Badge variant={priorityColors[priority] || 'default'}>
            {priority}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'assignedTo',
      header: 'Assigned To',
      cell: ({ row }) => {
        const assignedTo = row.original.assignedTo;
        return assignedTo ? `${assignedTo.firstName} ${assignedTo.lastName}` : 'Unassigned';
      },
    },
    {
      accessorKey: 'dueDate',
      header: 'Due Date',
      cell: ({ row }) => {
        const dueDate = row.getValue('dueDate') as string | undefined;
        return dueDate ? format(new Date(dueDate), 'MMM d, yyyy') : '-';
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const task = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/tasks/${task.id}`} className="cursor-pointer">
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/tasks/${task.id}?edit=true`} className="cursor-pointer">
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(task.id)}
                  className="text-destructive cursor-pointer"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}

interface TaskTableProps {
  data: Task[];
  isLoading?: boolean;
  onDelete?: (id: string) => void;
}

export function TaskTable({ data, isLoading, onDelete }: TaskTableProps) {
  const columns = createTaskColumns(onDelete);

  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      searchKey="title"
      searchPlaceholder="Search tasks..."
    />
  );
}

