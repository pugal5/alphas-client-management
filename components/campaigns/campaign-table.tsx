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
import { Campaign } from '@/hooks/useCampaigns';
import Link from 'next/link';
import { format } from 'date-fns';

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

export function createCampaignColumns(
  onDelete?: (id: string) => void
): ColumnDef<Campaign>[] {
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
        const campaign = row.original;
        return (
          <Link
            href={`/campaigns/${campaign.id}`}
            className="font-medium text-blue-600 hover:underline"
          >
            {campaign.name}
          </Link>
        );
      },
    },
    {
      accessorKey: 'client',
      header: 'Client',
      cell: ({ row }) => {
        const client = row.original.client;
        return client ? (
          <Link
            href={`/clients/${client.id}`}
            className="text-blue-600 hover:underline"
          >
            {client.name}
          </Link>
        ) : '-';
      },
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const type = row.getValue('type') as Campaign['type'];
        return typeLabels[type] || type;
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as Campaign['status'];
        return (
          <Badge variant={statusColors[status] || 'default'}>
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'budget',
      header: 'Budget',
      cell: ({ row }) => {
        const budget = row.getValue('budget') as number | undefined;
        return budget ? `$${budget.toLocaleString()}` : '-';
      },
    },
    {
      accessorKey: 'actualSpend',
      header: 'Actual Spend',
      cell: ({ row }) => {
        const spend = row.getValue('actualSpend') as number | undefined;
        return spend ? `$${spend.toLocaleString()}` : '-';
      },
    },
    {
      accessorKey: 'assignedTo',
      header: 'Assigned To',
      cell: ({ row }) => {
        const assignedTo = row.original.assignedTo;
        return assignedTo ? `${assignedTo.firstName} ${assignedTo.lastName}` : '-';
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const campaign = row.original;

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
                <Link href={`/campaigns/${campaign.id}`} className="cursor-pointer">
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/campaigns/${campaign.id}?edit=true`} className="cursor-pointer">
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(campaign.id)}
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

interface CampaignTableProps {
  data: Campaign[];
  isLoading?: boolean;
  onDelete?: (id: string) => void;
}

export function CampaignTable({ data, isLoading, onDelete }: CampaignTableProps) {
  const columns = createCampaignColumns(onDelete);

  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      searchKey="name"
      searchPlaceholder="Search campaigns..."
    />
  );
}

