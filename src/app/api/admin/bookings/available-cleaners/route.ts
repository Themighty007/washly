import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-server";

// GET /api/admin/bookings/available-cleaners?date=...&timeSlot=...
// Returns cleaners who are NOT booked at the given date + timeSlot
export async function GET(req: NextRequest) {
  const user = await requireRole(req, "ADMIN");
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const dateStr = url.searchParams.get("date");
  const timeSlot = url.searchParams.get("timeSlot");

  if (!dateStr || !timeSlot) {
    return NextResponse.json({ error: "date and timeSlot required" }, { status: 400 });
  }

  const bookingDate = new Date(dateStr);
  const startOfDay = new Date(bookingDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(bookingDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Find all cleaners
  const allCleaners = await db.cleaner.findMany({
    where: { status: "ACTIVE" },
    include: { user: true },
  });

  // Find cleaners who have conflicting bookings
  const conflictingBookings = await db.booking.findMany({
    where: {
      date: { gte: startOfDay, lte: endOfDay },
      timeSlot,
      status: { in: ["PENDING", "ASSIGNED", "IN_PROGRESS"] },
    },
    select: { cleanerId: true },
  });
  const busyCleanerIds = new Set(conflictingBookings.map((b) => b.cleanerId).filter(Boolean) as string[]);

  // Available = active cleaners not in busy set
  const available = allCleaners.filter((c) => !busyCleanerIds.has(c.id));

  return NextResponse.json({
    available,
    busy: allCleaners.filter((c) => busyCleanerIds.has(c.id)),
  });
}
