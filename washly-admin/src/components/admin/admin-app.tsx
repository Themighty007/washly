"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { authFetch, useAuth } from "@/lib/auth-store";
import { apiCache } from "@/lib/api-cache";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard, Users, UserCheck, CalendarClock, AlertTriangle,
  CreditCard, TrendingUp, Crown, FileBarChart, Settings, LogOut,
  Bell, Search, ChevronRight, Sparkles,
} from "lucide-react";
import { IdrottLogo } from "@/components/shared/idrott-logo";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { getInitials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AdminDashboardPage } from "@/components/admin/pages/dashboard";
import { AdminCustomersPage } from "@/components/admin/pages/customers";
import { AdminCleanersPage } from "@/components/admin/pages/cleaners";
import { AdminBookingsPage } from "@/components/admin/pages/bookings";
import { AdminPendingWashesPage } from "@/components/admin/pages/pending-washes";
import { AdminPaymentsPage } from "@/components/admin/pages/payments";
import { AdminRevenuePage } from "@/components/admin/pages/revenue";
import { AdminPlansPage } from "@/components/admin/pages/plans";
import { AdminReportsPage } from "@/components/admin/pages/reports";
import { AdminSettingsPage } from "@/components/admin/pages/settings";

type Page =
  | "dashboard" | "customers" | "cleaners" | "bookings" | "pending"
  | "payments" | "revenue" | "plans" | "reports" | "settings";

const NAV_ITEMS: { id: Page; label: string; icon: any }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "customers", label: "Customers", icon: Users },
  { id: "cleaners", label: "Cleaners", icon: UserCheck },
  { id: "bookings", label: "Bookings", icon: CalendarClock },
  { id: "pending", label: "Pending Washes", icon: AlertTriangle },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "revenue", label: "Revenue", icon: TrendingUp },
  { id: "plans", label: "Plans", icon: Crown },
  { id: "reports", label: "Reports", icon: FileBarChart },
  { id: "settings", label: "Settings", icon: Settings },
];

// Prefetch all critical admin pages in the background — fires immediately, runs in parallel
function usePrefetchAll() {
  useEffect(() => {
    const PREFETCH_URLS: [string, string][] = [
      ["/api/admin/analytics?range=month", "admin:analytics:month"],
      ["/api/admin/analytics?range=year", "admin:analytics:year"],
      ["/api/admin/customers", "admin:customers:"],
      ["/api/admin/cleaners", "admin:cleaners:"],
      ["/api/admin/bookings", "admin:bookings:all"],
      ["/api/admin/payments", "admin:payments:all"],
      ["/api/admin/plans", "admin:plans"],
    ];

    // Fire ALL prefetches immediately in parallel — no delay, no idle callback
    for (const [url, key] of PREFETCH_URLS) {
      if (!apiCache.getStale(key)) {
        authFetch(url)
          .then((r) => r.json())
          .then((data) => apiCache.set(key, data))
          .catch(() => {});
      }
    }
  }, []);
}

export function AdminApp() {
  const [page, setPage] = useState<Page>("dashboard");
  const { user, logout } = useAuth();

  usePrefetchAll();

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-sidebar text-sidebar-foreground fixed inset-y-0 left-0 z-40">
        <div className="p-5 border-b border-sidebar-border">
          <IdrottLogo size="sm" variant="light" />
        </div>

        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  page === item.id
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </ScrollArea>

        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent transition-colors">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground text-xs">
                {user ? getInitials(user.name) : "AD"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-sidebar-foreground">{user?.name}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">{user?.email}</p>
            </div>
            <button onClick={logout} className="text-sidebar-foreground/60 hover:text-sidebar-foreground">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar — bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-background border-t">
        <div className="grid grid-cols-5 gap-0.5 p-1">
          {NAV_ITEMS.slice(0, 5).map((item) => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-2 rounded-lg text-[10px] font-medium",
                page === item.id ? "text-brand bg-brand-muted/40" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label.split(" ")[0]}
            </button>
          ))}
        </div>
      </nav>

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-30 bg-background border-b px-4 py-3 flex items-center justify-between">
        <IdrottLogo size="sm" />
        <NotificationBell />
      </header>

      {/* Mobile page selector */}
      <div className="lg:hidden sticky top-[57px] z-20 bg-background/95 backdrop-blur border-b overflow-x-auto no-scrollbar">
        <div className="flex gap-1 px-3 py-2 min-w-max">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap",
                page === item.id ? "brand-gradient text-white" : "bg-muted text-muted-foreground"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 lg:ml-64 pb-16 lg:pb-0">
        {/* Desktop top bar */}
        <header className="hidden lg:flex sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b px-8 py-3 items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              {NAV_ITEMS.find((n) => n.id === page)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search…"
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <NotificationBell />
            <Avatar className="h-9 w-9">
              <AvatarFallback className="brand-gradient text-white text-xs">
                {user ? getInitials(user.name) : "AD"}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        <div className="p-4 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {page === "dashboard" && <AdminDashboardPage />}
              {page === "customers" && <AdminCustomersPage />}
              {page === "cleaners" && <AdminCleanersPage />}
              {page === "bookings" && <AdminBookingsPage />}
              {page === "pending" && <AdminPendingWashesPage />}
              {page === "payments" && <AdminPaymentsPage />}
              {page === "revenue" && <AdminRevenuePage />}
              {page === "plans" && <AdminPlansPage />}
              {page === "reports" && <AdminReportsPage />}
              {page === "settings" && <AdminSettingsPage />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
