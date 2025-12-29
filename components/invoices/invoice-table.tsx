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
import { Invoice } from '@/hooks/useInvoices';
import Link from 'next/link';
import { format } from 'date-fns';

const statusColors = {
  draft: 'outline',
  sent: 'default',
  paid: 'default',
  overdue: 'destructive',
  cancelled: 'secondary',
} as const;

const paymentStatusColors = {
  pending: 'outline',
  paid: 'default',
  partial: 'secondary',
  overdue: 'destructive',
  refunded: 'secondary',
} as const;

export function createInvoiceColumns(
  onDelete?: (id: string) => void
): ColumnDef<Invoice>[] {
  return [
    {
      accessorKey: 'invoiceNumber',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Invoice #
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const invoice = row.original;
        return (
          <Link
            href={`/invoices/${invoice.id}`}
            className="font-medium text-blue-600 hover:underline"
          >
            {invoice.invoiceNumber}
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
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as Invoice['status'];
        return (
          <Badge variant={statusColors[status] || 'default'}>
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'paymentStatus',
      header: 'Payment',
      cell: ({ row }) => {
        const paymentStatus = row.getValue('paymentStatus') as Invoice['paymentStatus'];
        return (
          <Badge variant={paymentStatusColors[paymentStatus] || 'default'}>
            {paymentStatus}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'totalAmount',
      header: 'Amount',
      cell: ({ row }) => {
        const amount = row.getValue('totalAmount') as number;
        return `$${amount.toLocaleString()}`;
      },
    },
    {
      accessorKey: 'dueDate',
      header: 'Due Date',
      cell: ({ row }) => {
        const dueDate = row.getValue('dueDate') as string;
        const isOverdue = new Date(dueDate) < new Date() && row.original.paymentStatus !== 'paid';
        return (
          <span className={isOverdue ? 'text-destructive font-semibold' : ''}>
            {format(new Date(dueDate), 'MMM d, yyyy')}
          </span>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const invoice = row.original;

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
                <Link href={`/invoices/${invoice.id}`} className="cursor-pointer">
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/invoices/${invoice.id}?edit=true`} className="cursor-pointer">
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(invoice.id)}
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

interface InvoiceTableProps {
  data: Invoice[];
  isLoading?: boolean;
  onDelete?: (id: string) => void;
}

export function InvoiceTable({ data, isLoading, onDelete }: InvoiceTableProps) {
  const columns = createInvoiceColumns(onDelete);

  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      searchKey="invoiceNumber"
      searchPlaceholder="Search invoices..."
    />
  );
}

