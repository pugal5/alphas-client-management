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
import { Client } from '@/hooks/useClients';
import Link from 'next/link';
import { format } from 'date-fns';

const statusColors = {
  active: 'default',
  inactive: 'secondary',
  prospect: 'outline',
  archived: 'secondary',
} as const;

export function createClientColumns(
  onDelete?: (id: string) => void
): ColumnDef<Client>[] {
  return [
    {
      accessorKey: 'name',
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
        const client = row.original;
        return (
          <Link
            href={`/clients/${client.id}`}
            className="font-medium text-blue-600 hover:underline"
          >
            {client.name}
          </Link>
        );
      },
    },
    {
      accessorKey: 'industry',
      header: 'Industry',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as Client['status'];
        return (
          <Badge variant={statusColors[status] || 'default'}>
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'owner',
      header: 'Owner',
      cell: ({ row }) => {
        const owner = row.original.owner;
        return owner ? `${owner.firstName} ${owner.lastName}` : '-';
      },
    },
    {
      accessorKey: 'contractValue',
      header: 'Contract Value',
      cell: ({ row }) => {
        const value = row.getValue('contractValue') as number | undefined;
        return value ? `$${value.toLocaleString()}` : '-';
      },
    },
    {
      accessorKey: '_count',
      header: 'Campaigns',
      cell: ({ row }) => {
        const count = row.original._count?.campaigns || 0;
        return count;
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const client = row.original;

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
                <Link href={`/clients/${client.id}`} className="cursor-pointer">
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/clients/${client.id}?edit=true`} className="cursor-pointer">
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(client.id)}
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

interface ClientTableProps {
  data: Client[];
  isLoading?: boolean;
  onDelete?: (id: string) => void;
}

export function ClientTable({ data, isLoading, onDelete }: ClientTableProps) {
  const columns = createClientColumns(onDelete);

  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      searchKey="name"
      searchPlaceholder="Search clients..."
    />
  );
}

