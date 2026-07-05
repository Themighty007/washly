import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-server";

// GET /api/cleaner/dashboard - Cleaner home with today's overview + tasks + attendance
export async function GET(req: NextRequest) {
  const user = await requireRole(req, "CLEANER");
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cleaner = await db.cleaner.findFirst({
    where: { userId: user.id },
    include: { user: true },
  });
  if (!cleaner) return NextResponse.json({ error: "Cleaner not found" }, { status: 404 });

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  // Today's tasks
  const todaysTasks = await db.booking.findMany({
    where: {
      cleanerId: cleaner.id,
      date: { gte: startOfToday, lte: endOfToday },
    },
    include: {
      customer: { include: { user: true } },
      car: true,
    },
    orderBy: { timeSlot: "asc" },
  });

  const completedToday = todaysTasks.filter((t) => t.status === "COMPLETED").length;
  const pendingToday = todaysTasks.filter(
    (t) => t.status === "PENDING" || t.status === "ASSIGNED" || t.status === "IN_PROGRESS"
  ).length;
  const missedToday = todaysTasks.filter((t) => t.status === "MISSED").length;

  // Today's attendance
  const todayAttendance = await db.attendance.findFirst({
    where: {
      cleanerId: cleaner.id,
      date: { gte: startOfToday, lte: endOfToday },
    },
  });

  const unreadNotifications = await db.notification.count({
    where: { userId: user.id, isRead: false },
  });

  return NextResponse.json({
    cleaner: {
      id: cleaner.id,
      user: {
        id: cleaner.user.id,
        name: cleaner.user.name,
        email: cleaner.user.email,
        phone: cleaner.user.phone,
        address: cleaner.user.address,
        avatar: cleaner.user.avatar,
      },
      status: cleaner.status,
      rating: cleaner.rating,
      totalCompleted: cleaner.totalCompleted,
      totalAssigned: cleaner.totalAssigned,
      vehicleNumber: cleaner.vehicleNumber,
      zone: cleaner.zone,
    },
    todaysTasks,
    overview: {
      total: todaysTasks.length,
      completed: completedToday,
      pending: pendingToday,
      missed: missedToday,
    },
    todayAttendance,
    unreadNotifications,
  });
}
