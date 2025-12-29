'use client';

import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { useApproveExpense, useRejectExpense } from '@/hooks/useExpenses';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface ApprovalActionsProps {
  expenseId: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
}

export function ApprovalActions({ expenseId, status }: ApprovalActionsProps) {
  const approveExpense = useApproveExpense();
  const rejectExpense = useRejectExpense();
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleApprove = async () => {
    if (confirm('Approve this expense?')) {
      await approveExpense.mutateAsync(expenseId);
    }
  };

  const handleReject = async () => {
    if (rejectReason.trim()) {
      await rejectExpense.mutateAsync({ id: expenseId, reason: rejectReason });
      setIsRejectDialogOpen(false);
      setRejectReason('');
    }
  };

  if (status !== 'pending') {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="default"
          size="sm"
          onClick={handleApprove}
          disabled={approveExpense.isPending}
        >
          <Check className="mr-2 h-4 w-4" />
          Approve
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setIsRejectDialogOpen(true)}
          disabled={rejectExpense.isPending}
        >
          <X className="mr-2 h-4 w-4" />
          Reject
        </Button>
      </div>

      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Expense</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this expense
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRejectDialogOpen(false);
                setRejectReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason.trim() || rejectExpense.isPending}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

