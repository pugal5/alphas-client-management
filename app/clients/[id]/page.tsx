'use client';

import { useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useClient, useDeleteClient, useAddContact, useUpdateContact, useDeleteContact } from '@/hooks/useClients';
import { ClientForm } from '@/components/clients/client-form';
import { ContactForm } from '@/components/clients/contact-form';
import { Pencil, Trash2, Plus, Mail, Phone, Globe, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { Loading } from '@/components/loading';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editMode = searchParams.get('edit') === 'true';
  const clientId = params.id as string;

  const { data: client, isLoading } = useClient(clientId);
  const deleteClient = useDeleteClient();
  const addContact = useAddContact();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="p-8">
        <Loading text="Loading client..." />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6">
            <p>Client not found</p>
            <Button onClick={() => router.push('/clients')} className="mt-4">
              Back to Clients
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      await deleteClient.mutateAsync(clientId);
      router.push('/clients');
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      await deleteContact.mutateAsync({ clientId, contactId });
    }
  };

  const statusColors = {
    active: 'default',
    inactive: 'secondary',
    prospect: 'outline',
    archived: 'secondary',
  } as const;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{client.name}</h1>
            <Badge variant={statusColors[client.status] || 'default'}>
              {client.status}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            {client.industry || 'No industry specified'}
          </p>
        </div>
        <div className="flex items-center gap-2">
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

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {client.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${client.email}`} className="text-primary hover:underline">
                      {client.email}
                    </a>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${client.phone}`} className="text-primary hover:underline">
                      {client.phone}
                    </a>
                  </div>
                )}
                {client.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={client.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {client.website}
                    </a>
                  </div>
                )}
                {(client.address || client.city || client.state) && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      {client.address && <div>{client.address}</div>}
                      {(client.city || client.state || client.zipCode) && (
                        <div>
                          {[client.city, client.state, client.zipCode].filter(Boolean).join(', ')}
                        </div>
                      )}
                      {client.country && <div>{client.country}</div>}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contract Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {client.contractValue !== undefined && client.contractValue !== null && (
                  <div>
                    <div className="text-sm text-muted-foreground">Contract Value</div>
                    <div className="text-lg font-semibold">
                      ${client.contractValue.toLocaleString()}
                    </div>
                  </div>
                )}
                {client.contractStart && (() => {
                  const date = new Date(client.contractStart);
                  return !isNaN(date.getTime()) && (
                    <div>
                      <div className="text-sm text-muted-foreground">Start Date</div>
                      <div>{format(date, 'PPP')}</div>
                    </div>
                  );
                })()}
                {client.contractEnd && (() => {
                  const date = new Date(client.contractEnd);
                  return !isNaN(date.getTime()) && (
                    <div>
                      <div className="text-sm text-muted-foreground">End Date</div>
                      <div>{format(date, 'PPP')}</div>
                    </div>
                  );
                })()}
                {client.owner && (
                  <div>
                    <div className="text-sm text-muted-foreground">Owner</div>
                    <div>
                      {client.owner.firstName} {client.owner.lastName}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {client.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{client.notes}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Campaigns</div>
                  <div className="text-2xl font-bold">{client._count?.campaigns || 0}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Invoices</div>
                  <div className="text-2xl font-bold">{client._count?.invoices || 0}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Contacts</CardTitle>
                  <CardDescription>
                    Manage client contacts
                  </CardDescription>
                </div>
                <Button onClick={() => setIsContactFormOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Contact
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {client.contacts && client.contacts.length > 0 ? (
                <div className="space-y-4">
                  {client.contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="font-semibold">
                            {contact.firstName} {contact.lastName}
                          </div>
                          {contact.isPrimary && (
                            <Badge variant="outline">Primary</Badge>
                          )}
                        </div>
                        {contact.title && (
                          <div className="text-sm text-muted-foreground">{contact.title}</div>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          {contact.email && (
                            <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                              {contact.email}
                            </a>
                          )}
                          {contact.phone && (
                            <a href={`tel:${contact.phone}`} className="text-primary hover:underline">
                              {contact.phone}
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingContact(contact.id);
                            setIsContactFormOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteContact(contact.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No contacts yet. Add your first contact.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>Campaigns</CardTitle>
              <CardDescription>
                Campaigns associated with this client
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Campaigns will be displayed here. This feature will be implemented in the campaigns module.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>
                Invoices for this client
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Invoices will be displayed here. This feature will be implemented in the invoices module.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ClientForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        client={client}
      />
      <ContactForm
        open={isContactFormOpen}
        onOpenChange={(open) => {
          setIsContactFormOpen(open);
          if (!open) setEditingContact(null);
        }}
        clientId={clientId}
        contact={editingContact ? client.contacts?.find(c => c.id === editingContact) : undefined}
      />
    </div>
  );
}

