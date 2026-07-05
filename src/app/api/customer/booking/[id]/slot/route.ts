import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole, pushNotification, notifyAdmins } from "@/lib/auth-server";

// PATCH /api/customer/booking/[id]/slot - Change slot for upcoming booking
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireRole(req, "CUSTOMER");
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { date, timeSlot } = await req.json();
  if (!date || !timeSlot) {
    return NextResponse.json({ error: "date and timeSlot required" }, { status: 400 });
  }

  const customer = await db.customer.findFirst({ where: { userId: user.id } });
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  const booking = await db.booking.findUnique({
    where: { id },
    include: { cleaner: { include: { user: true } } },
  });
  if (!booking || booking.customerId !== customer.id) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (["COMPLETED", "MISSED", "CANCELLED"].includes(booking.status)) {
    return NextResponse.json({ error: "Cannot modify completed/cancelled booking" }, { status: 400 });
  }

  const newDate = new Date(date);
  const updated = await db.booking.update({
    where: { id },
    data: { date: newDate, timeSlot },
    include: { car: true, cleaner: { include: { user: true } } },
  });

  await pushNotification({
    userId: user.id,
    type: "SLOT_CHANGED",
    title: "Slot Updated",
    message: `Your wash slot has been updated to ${newDate.toLocaleDateString()} ${timeSlot}.`,
    relatedId: booking.id,
  });

  if (booking.cleaner) {
    await pushNotification({
      userId: booking.cleaner.userId,
      type: "SLOT_CHANGED",
      title: "Wash Timing Changed",
      message: `Customer ${user.name} changed the wash timing to ${newDate.toLocaleDateString()} ${timeSlot}.`,
      relatedId: booking.id,
    });
  }

  await notifyAdmins({
    type: "SLOT_CHANGED",
    title: "Customer Modified Booking",
    message: `${user.name} modified booking #${booking.id.slice(-6)} to ${newDate.toLocaleDateString()} ${timeSlot}.`,
    relatedId: booking.id,
  });

  return NextResponse.json({ booking: updated });
}
