'use client';

import { Notification } from '@/hooks/useNotifications';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import Link from 'next/link';
import { useMarkAsRead } from '@/hooks/useNotifications';

interface NotificationItemProps {
  notification: Notification;
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const markAsRead = useMarkAsRead();

  const handleClick = () => {
    if (!notification.read) {
      markAsRead.mutate(notification.id);
    }
    if (notification.link) {
      window.location.href = notification.link;
    }
  };

  return (
    <Card
      className={`cursor-pointer transition-colors ${
        !notification.read ? 'bg-muted/50 border-primary/20' : ''
      }`}
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold">{notification.title}</h4>
              {!notification.read && (
                <Badge variant="default" className="h-2 w-2 p-0 rounded-full" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">{notification.message}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {format(new Date(notification.createdAt), 'PPp')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

