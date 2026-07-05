import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-server";

// GET /api/customer/dashboard - Customer dashboard data
export async function GET(req: NextRequest) {
  const user = await requireRole(req, "CUSTOMER");
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const customer = await db.customer.findFirst({
    where: { userId: user.id },
    include: { user: true, activePlan: true, cars: true },
  });

  if (!customer) {
    return NextResponse.json({ error: "Customer profile not found" }, { status: 404 });
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const upcomingBookings = await db.booking.findMany({
    where: {
      customerId: customer.id,
      date: { gte: startOfToday },
      status: { in: ["PENDING", "ASSIGNED", "IN_PROGRESS"] },
    },
    include: { car: true, cleaner: { include: { user: true } } },
    orderBy: { date: "asc" },
  });

  const pastBookings = await db.booking.findMany({
    where: {
      customerId: customer.id,
      status: { in: ["COMPLETED", "MISSED", "CANCELLED"] },
    },
    include: { car: true, cleaner: { include: { user: true } }, photos: true },
    orderBy: { date: "desc" },
    take: 20,
  });

  const unreadNotifications = await db.notification.count({
    where: { userId: user.id, isRead: false },
  });

  const totalWashes = customer.activePlan?.totalWashes || 0;

  return NextResponse.json({
    customer: {
      id: customer.id,
      user: {
        id: customer.user.id,
        name: customer.user.name,
        email: customer.user.email,
        phone: customer.user.phone,
        address: customer.user.address,
        avatar: customer.user.avatar,
      },
      activePlan: customer.activePlan,
      subscriptionStart: customer.subscriptionStart,
      subscriptionEnd: customer.subscriptionEnd,
      remainingWashes: customer.remainingWashes,
      status: customer.status,
      cars: customer.cars,
    },
    upcomingBookings,
    pastBookings,
    totalWashes,
    unreadNotifications,
  });
}
