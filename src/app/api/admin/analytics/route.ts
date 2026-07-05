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

  // Counts
  const totalCustomers = await db.customer.count();
  const activeCustomers = await db.customer.count({ where: { status: "ACTIVE" } });
  const totalCleaners = await db.cleaner.count();
  const activeCleaners = await db.cleaner.count({ where: { status: "ACTIVE" } });

  // Washes within range
  const completedWashes = await db.booking.count({
    where: { status: "COMPLETED", completedAt: { gte: startDate, lte: endDate } },
  });
  const pendingWashes = await db.booking.count({
    where: { status: { in: ["PENDING", "ASSIGNED", "IN_PROGRESS"] } },
  });
  const missedWashes = await db.booking.count({
    where: { status: "MISSED", updatedAt: { gte: startDate, lte: endDate } },
  });

  // Revenue within range (paid payments)
  const paidPayments = await db.payment.findMany({
    where: { status: "PAID", paidAt: { gte: startDate, lte: endDate } },
  });
  const revenue = paidPayments.reduce((sum, p) => sum + p.amount, 0);

  // Yearly revenue
  const yearStart = new Date(new Date().getFullYear(), 0, 1);
  const yearlyPayments = await db.payment.findMany({
    where: { status: "PAID", paidAt: { gte: yearStart } },
  });
  const yearlyRevenue = yearlyPayments.reduce((sum, p) => sum + p.amount, 0);

  // Active plans count (customers with active subscription)
  const activePlans = await db.customer.count({
    where: { status: "ACTIVE", activePlanId: { not: null } },
  });

  // ============= CHART DATA =============
  // 1. Revenue chart - last 6 months
  const revenueChart: { month: string; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth() - i, 1);
    const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() - i + 1, 0, 23, 59, 59, 999);
    const monthPayments = await db.payment.findMany({
      where: { status: "PAID", paidAt: { gte: monthStart, lte: monthEnd } },
    });
    revenueChart.push({
      month: monthStart.toLocaleString("default", { month: "short" }),
      revenue: monthPayments.reduce((s, p) => s + p.amount, 0),
    });
  }

  // 2. Customer growth chart - last 6 months
  const customerGrowth: { month: string; customers: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() - i + 1, 0, 23, 59, 59, 999);
    const count = await db.customer.count({
      where: { createdAt: { lte: monthEnd } },
    });
    customerGrowth.push({
      month: new Date(new Date().getFullYear(), new Date().getMonth() - i, 1).toLocaleString("default", { month: "short" }),
      customers: count,
    });
  }

  // 3. Wash completion chart - last 6 months
  const washCompletion: { month: string; completed: number; missed: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth() - i, 1);
    const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() - i + 1, 0, 23, 59, 59, 999);
    const [completed, missed] = await Promise.all([
      db.booking.count({ where: { status: "COMPLETED", completedAt: { gte: monthStart, lte: monthEnd } } }),
      db.booking.count({ where: { status: "MISSED", updatedAt: { gte: monthStart, lte: monthEnd } } }),
    ]);
    washCompletion.push({
      month: monthStart.toLocaleString("default", { month: "short" }),
      completed,
      missed,
    });
  }

  // 4. Plan distribution
  const plans = await db.plan.findMany();
  const planDistribution: { name: string; customers: number }[] = [];
  for (const plan of plans) {
    const count = await db.customer.count({ where: { activePlanId: plan.id } });
    planDistribution.push({ name: plan.name, customers: count });
  }

  // Recent activity (last 10 notifications)
  const recentActivity = await db.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { user: true },
  });

  return NextResponse.json({
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
      planDistribution,
    },
    recentActivity,
  });
}
