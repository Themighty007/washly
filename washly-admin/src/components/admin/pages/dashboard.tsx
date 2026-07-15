"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Users, UserCheck, CheckCircle2, Clock, AlertTriangle, IndianRupee,
  Calendar, Crown, TrendingUp, TrendingDown, Sparkles,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from "recharts";
import { authFetch } from "@/lib/auth-store";
import { apiCache } from "@/lib/api-cache";
import { formatCurrency, formatDate, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

const RANGES = [
  { id: "today", label: "Today" },
  { id: "month", label: "Month" },
  { id: "year", label: "Year" },
  { id: "custom", label: "Custom" },
];

const PIE_COLORS = ["var(--brand)", "var(--gold)", "#3b82f6", "#ef4444", "#a855f7"];

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-64 bg-muted rounded-xl" />
        <div className="h-64 bg-muted rounded-xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-48 bg-muted rounded-xl" />
        <div className="h-48 bg-muted rounded-xl" />
      </div>
    </div>
  );
}

export function AdminDashboardPage() {
  const [data, setData] = useState<any>(() => apiCache.getStale(`admin:analytics:month`));
  const [range, setRange] = useState("month");
  const [loading, setLoading] = useState(!apiCache.getStale(`admin:analytics:month`));

  const load = useCallback(async (showLoading = true) => {
    const cacheKey = `admin:analytics:${range}`;
    const cached = apiCache.getStale<any>(cacheKey);
    if (cached) {
      setData(cached);
      setLoading(false);
      // Revalidate in background if stale
      if (apiCache.isStale(cacheKey)) {
        authFetch(`/api/admin/analytics?range=${range}`)
          .then((r) => r.json())
          .then((json) => { apiCache.set(cacheKey, json); setData(json); })
          .catch(() => {});
      }
      return;
    }
    if (showLoading) setLoading(true);
    try {
      const res = await authFetch(`/api/admin/analytics?range=${range}`);
      const json = await res.json();
      apiCache.set(cacheKey, json);
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { load(); }, [load]);

  if (loading || !data) return <DashboardSkeleton />;

  const { cards, charts, recentActivity } = data;

  return (
    <div className="space-y-6">
      {/* Range selector */}
      <div className="flex items-center gap-2 flex-wrap">
        {RANGES.map((r) => (
          <Button
            key={r.id}
            variant={range === r.id ? "default" : "outline"}
            size="sm"
            className={cn(range === r.id && "brand-gradient text-white")}
            onClick={() => setRange(r.id)}
          >
            {r.label}
          </Button>
        ))}
      </div>

      {/* Top stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          label="Total Customers"
          value={cards.totalCustomers}
          subtitle={`${cards.activeCustomers} active`}
          icon={Users}
          color="text-blue-600"
          bg="bg-blue-50 dark:bg-blue-950/30"
        />
        <StatCard
          label="Total Cleaners"
          value={cards.totalCleaners}
          subtitle={`${cards.activeCleaners} active`}
          icon={UserCheck}
          color="text-emerald-600"
          bg="bg-emerald-50 dark:bg-emerald-950/30"
        />
        <StatCard
          label="Completed Washes"
          value={cards.completedWashes}
          subtitle={`${cards.missedWashes} missed`}
          icon={CheckCircle2}
          color="text-purple-600"
          bg="bg-purple-50 dark:bg-purple-950/30"
        />
        <StatCard
          label="Pending Washes"
          value={cards.pendingWashes}
          subtitle="Awaiting action"
          icon={Clock}
          color="text-amber-600"
          bg="bg-amber-50 dark:bg-amber-950/30"
        />
        <StatCard
          label="Monthly Revenue"
          value={formatCurrency(cards.revenue)}
          subtitle={`${formatCurrency(cards.yearlyRevenue)} YTD`}
          icon={IndianRupee}
          color="text-emerald-700"
          bg="bg-emerald-50 dark:bg-emerald-950/30"
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-brand" />
              Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={charts.revenueChart}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0 0)" vertical={false} />
                <XAxis dataKey="month" stroke="oklch(0.6 0 0)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.6 0 0)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip
                  formatter={(v: number) => [formatCurrency(v), "Revenue"]}
                  contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.92 0 0)" }}
                />
                <Area type="monotone" dataKey="revenue" stroke="var(--brand)" strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Crown className="h-4 w-4 text-gold" style={{ color: "var(--gold)" }} />
              Plan Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={charts.planDistribution}
                  dataKey="customers"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={4}
                >
                  {charts.planDistribution.map((_: any, i: number) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number, n: string) => [`${v} customers`, n]}
                  contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.92 0 0)" }}
                />
                <Legend
                  iconType="circle"
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-xs text-foreground">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              Customer Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={charts.customerGrowth}>
                <defs>
                  <linearGradient id="cust" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0 0)" vertical={false} />
                <XAxis dataKey="month" stroke="oklch(0.6 0 0)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.6 0 0)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.92 0 0)" }} />
                <Area type="monotone" dataKey="customers" stroke="#3b82f6" strokeWidth={2} fill="url(#cust)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Wash Completion vs Missed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={charts.washCompletion}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0 0)" vertical={false} />
                <XAxis dataKey="month" stroke="oklch(0.6 0 0)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.6 0 0)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.92 0 0)" }} />
                <Legend iconType="circle" formatter={(v) => <span className="text-xs">{v}</span>} />
                <Bar dataKey="completed" fill="var(--brand)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="missed" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Active plans + recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-brand-muted/40 flex items-center justify-center">
                <Crown className="h-5 w-5 text-brand" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active Subscriptions</p>
                <p className="text-2xl font-semibold mt-0.5">{cards.activePlans}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Missed Washes</p>
                <p className="text-2xl font-semibold mt-0.5">{cards.missedWashes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Yearly Revenue</p>
                <p className="text-2xl font-semibold mt-0.5">{formatCurrency(cards.yearlyRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-72">
            <div className="space-y-3">
              {recentActivity.map((n: any) => (
                <div key={n.id} className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatRelative(n.createdAt)}
                  </span>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, subtitle, icon: Icon, color, bg }: any) {
  return (
    <Card className="shadow-premium">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", bg)}>
            <Icon className={cn("h-4.5 w-4.5", color)} />
          </div>
        </div>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
        {subtitle && <p className="text-xs text-muted-foreground/70 mt-0.5">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
