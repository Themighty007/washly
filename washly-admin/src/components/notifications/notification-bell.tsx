"use client";

import { useEffect, useState } from "react";
import { Bell, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { authFetch } from "@/lib/auth-store";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  relatedId: string | null;
  createdAt: string;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  async function loadNotifications() {
    try {
      const res = await authFetch("/api/notifications");
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadNotifications();
    // Poll every 30s
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  async function markAsRead(id: string) {
    await authFetch("/api/notifications", {
      method: "PATCH",
      body: JSON.stringify({ id }),
    });
    loadNotifications();
  }

  async function markAllRead() {
    setLoading(true);
    await authFetch("/api/notifications", {
      method: "PATCH",
      body: JSON.stringify({ markAll: true }),
    });
    setLoading(false);
    toast.success("All notifications marked as read");
    loadNotifications();
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full">
          <Bell className="h-4.5 w-4.5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold">Notifications</h4>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={markAllRead}
              disabled={loading}
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <Bell className="h-6 w-6 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => !n.isRead && markAsRead(n.id)}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex gap-3",
                    !n.isRead && "bg-brand-muted/30"
                  )}
                >
                  {!n.isRead && (
                    <div className="h-2 w-2 rounded-full bg-brand mt-1.5 shrink-0" />
                  )}
                  <div className={cn("flex-1 min-w-0", n.isRead && "pl-5")}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-tight">{n.title}</p>
                      <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                        {formatRelative(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.message}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
