'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Users, Megaphone, CheckSquare, FileText, DollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { usePermission } from '@/hooks/usePermission';

export function QuickActions() {
  const router = useRouter();
  const { checkPermission } = usePermission();

  const actions = [
    {
      label: 'Create Client',
      icon: Users,
      href: '/clients',
      onClick: () => {
        // Open client form modal - handled by clients page
        router.push('/clients');
      },
      permission: { resource: 'clients' as const, action: 'create' as const },
    },
    {
      label: 'Create Campaign',
      icon: Megaphone,
      href: '/campaigns',
      onClick: () => router.push('/campaigns'),
      permission: { resource: 'campaigns' as const, action: 'create' as const },
    },
    {
      label: 'Create Task',
      icon: CheckSquare,
      href: '/tasks',
      onClick: () => router.push('/tasks'),
      permission: { resource: 'tasks' as const, action: 'create' as const },
    },
    {
      label: 'Create Invoice',
      icon: FileText,
      href: '/invoices',
      onClick: () => router.push('/invoices'),
      permission: { resource: 'invoices' as const, action: 'create' as const },
    },
    {
      label: 'Create Expense',
      icon: DollarSign,
      href: '/expenses',
      onClick: () => router.push('/expenses'),
      permission: { resource: 'expenses' as const, action: 'create' as const },
    },
  ].filter((action) => checkPermission(action.permission.resource, action.permission.action));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Create new items quickly</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.label}
                variant="outline"
                className="flex flex-col h-auto py-4"
                onClick={action.onClick}
              >
                <Icon className="h-5 w-5 mb-2" />
                <span className="text-xs">{action.label}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

