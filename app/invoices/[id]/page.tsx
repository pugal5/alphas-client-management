'use client';

import { useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useInvoice, useDeleteInvoice, useUpdatePaymentStatus, useSendInvoice, Invoice } from '@/hooks/useInvoices';
import { InvoiceForm } from '@/components/invoices/invoice-form';
import { PaymentStatusBadge } from '@/components/invoices/payment-status-badge';
import { Pencil, Trash2, Send, DollarSign, Calendar } from 'lucide-react';
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

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editMode = searchParams.get('edit') === 'true';
  const invoiceId = params.id as string;

  const { data: invoice, isLoading } = useInvoice(invoiceId);
  const deleteInvoice = useDeleteInvoice();
  const updatePaymentStatus = useUpdatePaymentStatus();
  const sendInvoice = useSendInvoice();

  const [isFormOpen, setIsFormOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="p-8">
        <Loading text="Loading invoice..." />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6">
            <p>Invoice not found</p>
            <Button onClick={() => router.push('/invoices')} className="mt-4">
              Back to Invoices
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      await deleteInvoice.mutateAsync(invoiceId);
      router.push('/invoices');
    }
  };

  const handlePaymentStatusChange = async (paymentStatus: Invoice['paymentStatus']) => {
    await updatePaymentStatus.mutateAsync({ id: invoiceId, paymentStatus });
  };

  const handleSendInvoice = async () => {
    if (confirm('Send this invoice to the client?')) {
      await sendInvoice.mutateAsync(invoiceId);
    }
  };

  const statusColors = {
    draft: 'outline',
    sent: 'default',
    paid: 'default',
    overdue: 'destructive',
    cancelled: 'secondary',
  } as const;

  const isOverdue = new Date(invoice.dueDate) < new Date() && invoice.paymentStatus !== 'paid';

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{invoice.invoiceNumber}</h1>
            <Badge variant={statusColors[invoice.status] || 'default'}>
              {invoice.status}
            </Badge>
            <PaymentStatusBadge status={invoice.paymentStatus} />
            {isOverdue && (
              <Badge variant="destructive">Overdue</Badge>
            )}
          </div>
          {invoice.client && (
            <p className="text-muted-foreground mt-1">
              Client: <Link href={`/clients/${invoice.client.id}`} className="text-blue-600 hover:underline">{invoice.client.name}</Link>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {invoice.status === 'draft' && (
            <Button variant="outline" onClick={handleSendInvoice}>
              <Send className="mr-2 h-4 w-4" />
              Send Invoice
            </Button>
          )}
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

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Issue Date</div>
                <div>{format(new Date(invoice.issueDate), 'PPP')}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Due Date</div>
                <div className={isOverdue ? 'text-destructive font-semibold' : ''}>
                  {format(new Date(invoice.dueDate), 'PPP')}
                </div>
              </div>
            </div>
            {invoice.paidDate && (
              <div>
                <div className="text-sm text-muted-foreground">Paid Date</div>
                <div>{format(new Date(invoice.paidDate), 'PPP')}</div>
              </div>
            )}
            {invoice.creator && (
              <div>
                <div className="text-sm text-muted-foreground">Created By</div>
                <div>
                  {invoice.creator.firstName} {invoice.creator.lastName}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">Amount</div>
                <div className="text-lg font-semibold">
                  ${invoice.amount.toLocaleString()}
                </div>
              </div>
            </div>
            {invoice.taxAmount && invoice.taxAmount > 0 && (
              <div>
                <div className="text-sm text-muted-foreground">Tax</div>
                <div className="text-lg font-semibold">
                  ${invoice.taxAmount.toLocaleString()}
                </div>
              </div>
            )}
            <div>
              <div className="text-sm text-muted-foreground">Total Amount</div>
              <div className="text-2xl font-bold">
                ${invoice.totalAmount.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-2">Payment Status</div>
              <Select
                value={invoice.paymentStatus}
                onValueChange={(value) => handlePaymentStatusChange(value as Invoice['paymentStatus'])}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {invoice.notes && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}

      <InvoiceForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        invoice={invoice}
      />
    </div>
  );
}

