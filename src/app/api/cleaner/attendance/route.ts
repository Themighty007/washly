import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole, pushNotification } from "@/lib/auth-server";

// POST /api/cleaner/attendance?action=check-in|check-out
export async function POST(req: NextRequest) {
  const user = await requireRole(req, "CLEANER");
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  const cleaner = await db.cleaner.findFirst({ where: { userId: user.id } });
  if (!cleaner) return NextResponse.json({ error: "Cleaner not found" }, { status: 404 });

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  // Find or create today's attendance record
  let attendance = await db.attendance.findFirst({
    where: {
      cleanerId: cleaner.id,
      date: { gte: startOfToday, lte: endOfToday },
    },
  });

  if (action === "check-in") {
    if (attendance?.checkInTime) {
      return NextResponse.json({ error: "Already checked in today" }, { status: 400 });
    }
    const now = new Date();
    if (!attendance) {
      attendance = await db.attendance.create({
        data: {
          cleanerId: cleaner.id,
          date: startOfToday,
          checkInTime: now,
          status: "PRESENT",
        },
      });
    } else {
      attendance = await db.attendance.update({
        where: { id: attendance.id },
        data: { checkInTime: now, status: "PRESENT" },
      });
    }

    await pushNotification({
      userId: user.id,
      type: "CHECK_IN",
      title: "Checked In",
      message: `You checked in at ${now.toLocaleTimeString()}. Have a great day!`,
    });

    return NextResponse.json({ attendance });
  }

  if (action === "check-out") {
    if (!attendance?.checkInTime) {
      return NextResponse.json({ error: "Must check in first" }, { status: 400 });
    }
    if (attendance.checkOutTime) {
      return NextResponse.json({ error: "Already checked out today" }, { status: 400 });
    }
    const now = new Date();
    const hours = (now.getTime() - attendance.checkInTime.getTime()) / (1000 * 60 * 60);

    attendance = await db.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOutTime: now,
        totalHours: Math.round(hours * 10) / 10,
      },
    });

    await pushNotification({
      userId: user.id,
      type: "CHECK_OUT",
      title: "Checked Out",
      message: `You checked out at ${now.toLocaleTimeString()}. Total hours: ${Math.round(hours * 10) / 10}h`,
    });

    return NextResponse.json({ attendance });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
