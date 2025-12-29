'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ClientTable } from '@/components/clients/client-table';
import { ClientForm } from '@/components/clients/client-form';
import { useClients, useDeleteClient } from '@/hooks/useClients';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ClientsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);

  const filters = {
    status: statusFilter !== 'all' ? statusFilter : undefined,
  };

  const { data, isLoading } = useClients(filters);
  const deleteClient = useDeleteClient();

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this client?')) {
      await deleteClient.mutateAsync(id);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground mt-1">
            Manage your client relationships
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="prospect">Prospect</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Client
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Clients</CardTitle>
          <CardDescription>
            {data?.total || 0} total clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClientTable
            data={data?.clients || []}
            isLoading={isLoading}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      <ClientForm open={isFormOpen} onOpenChange={setIsFormOpen} />
    </div>
  );
}

