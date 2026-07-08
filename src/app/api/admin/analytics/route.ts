import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-server";

// GET /api/admin/analytics?range=today|month|year|custom&from=...&to=...
export async function GET(req: NextRequest) {
  const user = await requireRole(req, "ADMIN");
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const range = url.searchParams.get("range") || "month";
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  let startDate: Date;
  let endDate: Date = new Date();

  switch (range) {
    case "today":
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      break;
    case "year":
      startDate = new Date(new Date().getFullYear(), 0, 1);
      break;
    case "custom":
      startDate = from ? new Date(from) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      endDate = to ? new Date(to) : new Date();
      break;
    case "month":
    default:
      startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      break;
  }

  const yearStart = new Date(new Date().getFullYear(), 0, 1);

  // ─── Run ALL top-level queries in PARALLEL (was 10+ sequential) ───
  const [
    totalCustomers,
    activeCustomers,
    totalCleaners,
    activeCleaners,
    completedWashes,
    pendingWashes,
    missedWashes,
    activePlans,
    paidPayments,
    yearlyPayments,
    recentActivity,
    plans,
    allBookings,
  ] = await Promise.all([
    db.customer.count(),
    db.customer.count({ where: { status: "ACTIVE" } }),
    db.cleaner.count(),
    db.cleaner.count({ where: { status: "ACTIVE" } }),
    db.booking.count({ where: { status: "COMPLETED", completedAt: { gte: startDate, lte: endDate } } }),
    db.booking.count({ where: { status: { in: ["PENDING", "ASSIGNED", "IN_PROGRESS"] } } }),
    db.booking.count({ where: { status: "MISSED", updatedAt: { gte: startDate, lte: endDate } } }),
    db.customer.count({ where: { status: "ACTIVE", activePlanId: { not: null } } }),
    db.payment.findMany({ where: { status: "PAID", paidAt: { gte: startDate, lte: endDate } }, select: { amount: true } }),
    db.payment.findMany({ where: { status: "PAID", paidAt: { gte: yearStart } }, select: { amount: true } }),
    db.notification.findMany({ orderBy: { createdAt: "desc" }, take: 10, include: { user: true } }),
    db.plan.findMany({ select: { id: true, name: true } }),
    // Fetch all bookings and payments in range needed for charts in ONE query each
    db.booking.findMany({
      where: { date: { gte: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1) } },
      select: { status: true, completedAt: true, updatedAt: true, date: true },
    }),
  ]);

  const revenue = paidPayments.reduce((sum, p) => sum + p.amount, 0);
  const yearlyRevenue = yearlyPayments.reduce((sum, p) => sum + p.amount, 0);

  // ─── Run remaining chart queries in PARALLEL ───
  const [allChartPayments, allCustomerCounts, planCustomerCounts] = await Promise.all([
    db.payment.findMany({
      where: {
        status: "PAID",
        paidAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1) },
      },
      select: { amount: true, paidAt: true },
    }),
    // Get customer created dates for growth chart
    db.customer.findMany({
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    // Plan distribution counts in parallel
    Promise.all(
      plans.map((plan) =>
        db.customer.count({ where: { activePlanId: plan.id } }).then((count) => ({ name: plan.name, customers: count }))
      )
    ),
  ]);

  // ─── Build chart data from fetched data (no more per-month DB queries) ───
  const revenueChart: { month: string; revenue: number }[] = [];
  const customerGrowth: { month: string; customers: number }[] = [];
  const washCompletion: { month: string; completed: number; missed: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth() - i, 1);
    const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() - i + 1, 0, 23, 59, 59, 999);
    const label = monthStart.toLocaleString("default", { month: "short" });

    // Revenue from pre-fetched payments
    const monthRevenue = allChartPayments
      .filter((p) => p.paidAt && p.paidAt >= monthStart && p.paidAt <= monthEnd)
      .reduce((s, p) => s + p.amount, 0);
    revenueChart.push({ month: label, revenue: monthRevenue });

    // Customer growth from pre-fetched customers
    const custCount = allCustomerCounts.filter((c) => c.createdAt <= monthEnd).length;
    customerGrowth.push({ month: label, customers: custCount });

    // Wash completion from pre-fetched bookings
    const monthCompleted = allBookings.filter(
      (b) => b.status === "COMPLETED" && b.completedAt && b.completedAt >= monthStart && b.completedAt <= monthEnd
    ).length;
    const monthMissed = allBookings.filter(
      (b) => b.status === "MISSED" && b.updatedAt >= monthStart && b.updatedAt <= monthEnd
    ).length;
    washCompletion.push({ month: label, completed: monthCompleted, missed: monthMissed });
  }

  const response = NextResponse.json({
    range,
    startDate,
    endDate,
    cards: {
      totalCustomers,
      activeCustomers,
      totalCleaners,
      activeCleaners,
      completedWashes,
      pendingWashes,
      missedWashes,
      revenue,
      yearlyRevenue,
      activePlans,
    },
    charts: {
      revenueChart,
      customerGrowth,
      washCompletion,
      planDistribution: planCustomerCounts,
    },
    recentActivity,
  });

  // Cache analytics for 30 seconds in the browser — private so it's per-user
  response.headers.set("Cache-Control", "private, max-age=30, stale-while-revalidate=60");
  return response;
}
