'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useNotifications, useMarkAllAsRead, useNotificationPreferences, useUpdateNotificationPreferences } from '@/hooks/useNotifications';
import { NotificationItem } from '@/components/notifications/notification-item';
import { Loading } from '@/components/loading';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<'unread' | 'all'>('unread');
  const { data: notifications, isLoading } = useNotifications();
  const { data: preferences } = useNotificationPreferences();
  const markAllAsRead = useMarkAllAsRead();
  const updatePreferences = useUpdateNotificationPreferences();

  const unreadNotifications = notifications?.filter(n => !n.read) || [];
  const displayedNotifications = activeTab === 'unread' ? unreadNotifications : (notifications || []);

  const handleTogglePreference = (key: keyof typeof preferences) => {
    if (preferences) {
      updatePreferences.mutate({
        [key]: !preferences[key],
      });
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            Manage your notifications and preferences
          </p>
        </div>
        {unreadNotifications.length > 0 && (
          <Button onClick={() => markAllAsRead.mutate()}>
            Mark All as Read
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'unread' | 'all')} className="space-y-4">
        <TabsList>
          <TabsTrigger value="unread">
            Unread ({unreadNotifications.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All ({notifications?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === 'unread' ? 'Unread Notifications' : 'All Notifications'}
              </CardTitle>
              <CardDescription>
                {displayedNotifications.length} notification{displayedNotifications.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loading text="Loading notifications..." />
              ) : displayedNotifications.length > 0 ? (
                <div className="space-y-2">
                  {displayedNotifications.map((notification) => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No {activeTab === 'unread' ? 'unread ' : ''}notifications
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Choose what notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {preferences && (
            <>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="email"
                  checked={preferences.email}
                  onCheckedChange={() => handleTogglePreference('email')}
                />
                <Label htmlFor="email">Email notifications</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="inApp"
                  checked={preferences.inApp}
                  onCheckedChange={() => handleTogglePreference('inApp')}
                />
                <Label htmlFor="inApp">In-app notifications</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="taskAssigned"
                  checked={preferences.taskAssigned}
                  onCheckedChange={() => handleTogglePreference('taskAssigned')}
                />
                <Label htmlFor="taskAssigned">Task assigned</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="taskCompleted"
                  checked={preferences.taskCompleted}
                  onCheckedChange={() => handleTogglePreference('taskCompleted')}
                />
                <Label htmlFor="taskCompleted">Task completed</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="campaignUpdated"
                  checked={preferences.campaignUpdated}
                  onCheckedChange={() => handleTogglePreference('campaignUpdated')}
                />
                <Label htmlFor="campaignUpdated">Campaign updated</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="invoiceSent"
                  checked={preferences.invoiceSent}
                  onCheckedChange={() => handleTogglePreference('invoiceSent')}
                />
                <Label htmlFor="invoiceSent">Invoice sent</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="paymentReceived"
                  checked={preferences.paymentReceived}
                  onCheckedChange={() => handleTogglePreference('paymentReceived')}
                />
                <Label htmlFor="paymentReceived">Payment received</Label>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

