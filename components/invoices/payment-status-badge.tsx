'use client';

import { Badge } from '@/components/ui/badge';
import { Invoice } from '@/hooks/useInvoices';

const paymentStatusColors = {
  pending: 'outline',
  paid: 'default',
  partial: 'secondary',
  overdue: 'destructive',
  refunded: 'secondary',
} as const;

interface PaymentStatusBadgeProps {
  status: Invoice['paymentStatus'];
}

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  return (
    <Badge variant={paymentStatusColors[status] || 'default'}>
      {status}
    </Badge>
  );
}

