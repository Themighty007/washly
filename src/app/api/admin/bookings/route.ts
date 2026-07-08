import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole, pushNotification, notifyAdmins } from "@/lib/auth-server";

// GET /api/admin/bookings - List all bookings with filters
export async function GET(req: NextRequest) {
  const user = await requireRole(req, "ADMIN");
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (from || to) {
    where.date = {};
    if (from) (where.date as { gte?: Date }).gte = new Date(from);
    if (to) (where.date as { lte?: Date }).lte = new Date(to);
  }

  const bookings = await db.booking.findMany({
    where,
    include: {
      customer: { include: { user: true } },
      car: true,
      cleaner: { include: { user: true } },
    },
    orderBy: { date: "desc" },
    take: 100,
  });

  const res = NextResponse.json({ bookings });
  res.headers.set("Cache-Control", "private, max-age=30, stale-while-revalidate=60");
  return res;
}

// POST /api/admin/bookings - Create new booking (admin assigns cleaner)
export async function POST(req: NextRequest) {
  const admin = await requireRole(req, "ADMIN");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { customerId, carId, cleanerId, date, timeSlot, address, notes } = body;

  if (!customerId || !carId || !cleanerId || !date || !timeSlot) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Validate cleaner availability (no other booking at the same date + timeSlot)
  const bookingDate = new Date(date);
  const startOfDay = new Date(bookingDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(bookingDate);
  endOfDay.setHours(23, 59, 59, 999);

  const conflicting = await db.booking.findFirst({
    where: {
      cleanerId,
      date: { gte: startOfDay, lte: endOfDay },
      timeSlot,
      status: { in: ["PENDING", "ASSIGNED", "IN_PROGRESS"] },
    },
  });

  if (conflicting) {
    return NextResponse.json(
      { error: "Cleaner already has a booking at this time slot" },
      { status: 400 }
    );
  }

  const car = await db.car.findUnique({ where: { id: carId } });
  if (!car || car.customerId !== customerId) {
    return NextResponse.json({ error: "Car does not belong to customer" }, { status: 400 });
  }

  const booking = await db.booking.create({
    data: {
      customerId,
      carId,
      cleanerId,
      date: bookingDate,
      timeSlot,
      address: address || "",
      notes: notes || null,
      status: "ASSIGNED",
    },
    include: {
      customer: { include: { user: true } },
      car: true,
      cleaner: { include: { user: true } },
    },
  });

  // Notify customer
  await pushNotification({
    userId: booking.customer.userId,
    type: "CLEANER_ASSIGNED",
    title: "Cleaner Assigned",
    message: `${booking.cleaner!.user.name} has been assigned for your wash on ${bookingDate.toLocaleDateString()} at ${timeSlot}.`,
    relatedId: booking.id,
  });

  // Notify cleaner
  await pushNotification({
    userId: booking.cleaner!.userId,
    type: "CLEANER_ASSIGNED",
    title: "New Wash Assigned",
    message: `You have been assigned a wash for ${booking.customer.user.name} on ${bookingDate.toLocaleDateString()} at ${timeSlot}.`,
    relatedId: booking.id,
  });

  // Notify admins (for audit)
  await notifyAdmins({
    type: "NEW_BOOKING",
    title: "Booking Created",
    message: `Admin ${admin.name} created a booking for ${booking.customer.user.name} (cleaner: ${booking.cleaner!.user.name}).`,
    relatedId: booking.id,
  });

  return NextResponse.json({ booking });
}

// PATCH /api/admin/bookings - Update booking (e.g., reschedule, change cleaner)
export async function PATCH(req: NextRequest) {
  const admin = await requireRole(req, "ADMIN");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, action, cleanerId, date, timeSlot, status } = body;

  const booking = await db.booking.findUnique({
    where: { id },
    include: { customer: { include: { user: true } }, cleaner: { include: { user: true } } },
  });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const updateData: Record<string, unknown> = {};

  if (action === "reschedule") {
    if (date) updateData.date = new Date(date);
    if (timeSlot) updateData.timeSlot = timeSlot;
    updateData.status = status || "ASSIGNED";
    if (booking.status === "MISSED") updateData.missReason = null;
  } else if (action === "change-cleaner") {
    if (!cleanerId) return NextResponse.json({ error: "cleanerId required" }, { status: 400 });
    // Check new cleaner availability
    if (date || timeSlot) {
      const checkDate = date ? new Date(date) : booking.date;
      const startOfDay = new Date(checkDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(checkDate);
      endOfDay.setHours(23, 59, 59, 999);
      const slot = timeSlot || booking.timeSlot;

      const conflicting = await db.booking.findFirst({
        where: {
          cleanerId,
          date: { gte: startOfDay, lte: endOfDay },
          timeSlot: slot,
          status: { in: ["PENDING", "ASSIGNED", "IN_PROGRESS"] },
          id: { not: id },
        },
      });
      if (conflicting) {
        return NextResponse.json({ error: "New cleaner not available at this time" }, { status: 400 });
      }
    }
    updateData.cleanerId = cleanerId;
    if (date) updateData.date = new Date(date);
    if (timeSlot) updateData.timeSlot = timeSlot;
    if (booking.status === "MISSED") {
      updateData.status = "ASSIGNED";
      updateData.missReason = null;
    }
  } else if (status) {
    updateData.status = status;
  }

  const updated = await db.booking.update({
    where: { id },
    data: updateData,
    include: {
      customer: { include: { user: true } },
      car: true,
      cleaner: { include: { user: true } },
    },
  });

  // Send notifications
  await pushNotification({
    userId: booking.customer.userId,
    type: "SLOT_CHANGED",
    title: "Booking Updated",
    message: `Your wash booking has been updated. New schedule: ${new Date(updated.date).toLocaleDateString()} at ${updated.timeSlot}.`,
    relatedId: booking.id,
  });

  if (updated.cleanerId && updated.cleanerId !== booking.cleanerId) {
    await pushNotification({
      userId: updated.cleaner!.userId,
      type: "CLEANER_ASSIGNED",
      title: "New Wash Assigned",
      message: `You have been assigned a wash for ${booking.customer.user.name} on ${new Date(updated.date).toLocaleDateString()} at ${updated.timeSlot}.`,
      relatedId: booking.id,
    });
  }

  return NextResponse.json({ booking: updated });
}
