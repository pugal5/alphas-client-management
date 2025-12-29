'use client';

import { useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useExpense, useDeleteExpense } from '@/hooks/useExpenses';
import { ExpenseForm } from '@/components/expenses/expense-form';
import { ApprovalActions } from '@/components/expenses/approval-actions';
import { Pencil, Trash2, DollarSign, Calendar, FileText } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { Loading } from '@/components/loading';
import { usePermission } from '@/hooks/usePermission';

export default function ExpenseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editMode = searchParams.get('edit') === 'true';
  const expenseId = params.id as string;

  const { data: expense, isLoading } = useExpense(expenseId);
  const deleteExpense = useDeleteExpense();
  const { checkPermission } = usePermission();

  const [isFormOpen, setIsFormOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="p-8">
        <Loading text="Loading expense..." />
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6">
            <p>Expense not found</p>
            <Button onClick={() => router.push('/expenses')} className="mt-4">
              Back to Expenses
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this expense? This action cannot be undone.')) {
      await deleteExpense.mutateAsync(expenseId);
      router.push('/expenses');
    }
  };

  const statusColors = {
    pending: 'outline',
    approved: 'default',
    rejected: 'destructive',
    paid: 'default',
  } as const;

  const canApprove = checkPermission('expenses', 'update');

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{expense.description}</h1>
            <Badge variant={statusColors[expense.status] || 'default'}>
              {expense.status}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            {expense.category}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canApprove && <ApprovalActions expenseId={expenseId} status={expense.status} />}
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
            <CardTitle>Expense Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">Amount</div>
              <div className="text-2xl font-bold">
                ${expense.amount !== undefined ? expense.amount.toLocaleString() : '0'}
              </div>
              </div>
            </div>
            {expense.expenseDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Expense Date</div>
                  <div>{format(new Date(expense.expenseDate), 'PPP')}</div>
                </div>
              </div>
            )}
            {expense.campaign && (
              <div>
                <div className="text-sm text-muted-foreground">Campaign</div>
                <Link
                  href={`/campaigns/${expense.campaign.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {expense.campaign.name}
                </Link>
              </div>
            )}
            {expense.client && (
              <div>
                <div className="text-sm text-muted-foreground">Client</div>
                <Link
                  href={`/clients/${expense.client.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {expense.client.name}
                </Link>
              </div>
            )}
            {expense.creator && (
              <div>
                <div className="text-sm text-muted-foreground">Created By</div>
                <div>
                  {expense.creator.firstName} {expense.creator.lastName}
                </div>
              </div>
            )}
            {expense.approver && (
              <div>
                <div className="text-sm text-muted-foreground">Approved By</div>
                <div>
                  {expense.approver.firstName} {expense.approver.lastName}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {expense.receiptUrl && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Receipt</div>
                  <a
                    href={expense.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View Receipt
                  </a>
                </div>
              </div>
            )}
            {expense.notes && (
              <div>
                <div className="text-sm text-muted-foreground">Notes</div>
                <p className="mt-1 whitespace-pre-wrap">{expense.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ExpenseForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        expense={expense}
      />
    </div>
  );
}

