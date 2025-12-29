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
import { Expense } from '@/hooks/useExpenses';
import Link from 'next/link';
import { format } from 'date-fns';

const statusColors = {
  pending: 'outline',
  approved: 'default',
  rejected: 'destructive',
  paid: 'default',
} as const;

export function createExpenseColumns(
  onDelete?: (id: string) => void
): ColumnDef<Expense>[] {
  return [
    {
      accessorKey: 'description',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Description
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const expense = row.original;
        return (
          <Link
            href={`/expenses/${expense.id}`}
            className="font-medium text-blue-600 hover:underline"
          >
            {expense.description}
          </Link>
        );
      },
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => {
        const amount = row.getValue('amount') as number;
        return `$${amount.toLocaleString()}`;
      },
    },
    {
      accessorKey: 'category',
      header: 'Category',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as Expense['status'];
        return (
          <Badge variant={statusColors[status] || 'default'}>
            {status}
          </Badge>
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
      accessorKey: 'expenseDate',
      header: 'Date',
      cell: ({ row }) => {
        const date = row.getValue('expenseDate') as string;
        return format(new Date(date), 'MMM d, yyyy');
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const expense = row.original;

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
                <Link href={`/expenses/${expense.id}`} className="cursor-pointer">
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/expenses/${expense.id}?edit=true`} className="cursor-pointer">
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(expense.id)}
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

interface ExpenseTableProps {
  data: Expense[];
  isLoading?: boolean;
  onDelete?: (id: string) => void;
}

export function ExpenseTable({ data, isLoading, onDelete }: ExpenseTableProps) {
  const columns = createExpenseColumns(onDelete);

  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      searchKey="description"
      searchPlaceholder="Search expenses..."
    />
  );
}

