import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole, pushNotification, notifyAdmins } from "@/lib/auth-server";

// PATCH /api/cleaner/task/[id]?action=complete|car-not-available|start
// body for complete: { photos: [{ position, imageData, fileName }] }
// body for car-not-available: { reason }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireRole(req, "CLEANER");
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  const cleaner = await db.cleaner.findFirst({ where: { userId: user.id } });
  if (!cleaner) return NextResponse.json({ error: "Cleaner not found" }, { status: 404 });

  const booking = await db.booking.findUnique({
    where: { id },
    include: { customer: { include: { user: true } }, car: true },
  });
  if (!booking || booking.cleanerId !== cleaner.id) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (action === "start") {
    const updated = await db.booking.update({
      where: { id },
      data: { status: "IN_PROGRESS", startedAt: new Date() },
    });
    return NextResponse.json({ booking: updated });
  }

  if (action === "complete") {
    const body = await req.json();
    const photos = body.photos || [];

    // Validate: at least 4 photos required
    if (photos.length < 4) {
      return NextResponse.json(
        { error: "At least 4 photos are required to complete the wash" },
        { status: 400 }
      );
    }

    // Validate each photo has required fields
    for (const p of photos) {
      if (!p.position || !p.imageData) {
        return NextResponse.json(
          { error: `Photo ${p.position || ""} missing required fields` },
          { status: 400 }
        );
      }
    }

    // Use transaction to update booking + create photos + increment cleaner stats
    const [updatedBooking] = await db.$transaction([
      db.booking.update({
        where: { id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      }),
      db.cleaner.update({
        where: { id: cleaner.id },
        data: {
          totalCompleted: { increment: 1 },
        },
      }),
      db.customer.update({
        where: { id: booking.customerId },
        data: {
          remainingWashes: { decrement: 1 },
        },
      }),
    ]);

    // Insert photos
    for (const p of photos) {
      await db.photo.create({
        data: {
          bookingId: booking.id,
          position: p.position,
          type: "AFTER",
          imageData: p.imageData,
          fileName: p.fileName || `photo-${p.position}.jpg`,
          fileSize: p.imageData.length,
        },
      });
    }

    // Notify customer
    await pushNotification({
      userId: booking.customer.userId,
      type: "WASH_COMPLETED",
      title: "Car Wash Completed",
      message: `Your ${booking.car.make} ${booking.car.model} wash has been completed by ${user.name}. View photos in history.`,
      relatedId: booking.id,
    });

    // Notify admins
    await notifyAdmins({
      type: "WASH_COMPLETED",
      title: "Wash Completed",
      message: `Cleaner ${user.name} completed the wash for ${booking.customer.user.name}.`,
      relatedId: booking.id,
    });

    return NextResponse.json({ booking: updatedBooking });
  }

  if (action === "car-not-available") {
    const body = await req.json();
    const reason = body.reason || "Car not available at location";

    const updated = await db.booking.update({
      where: { id },
      data: { status: "MISSED", missReason: reason },
    });

    // Notify admins (pushes into Pending Washes section)
    await notifyAdmins({
      type: "CAR_UNAVAILABLE",
      title: "Car Not Available",
      message: `Cleaner ${user.name} reported car unavailable for ${booking.customer.user.name}'s ${booking.car.make} ${booking.car.model}. Reason: ${reason}`,
      relatedId: booking.id,
    });

    // Notify customer
    await pushNotification({
      userId: booking.customer.userId,
      type: "CAR_UNAVAILABLE",
      title: "Wash Missed",
      message: `Our cleaner couldn't find your car at the scheduled time. Our team will reach out to reschedule.`,
      relatedId: booking.id,
    });

    return NextResponse.json({ booking: updated });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

// GET /api/cleaner/task/[id] - Get single task details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireRole(req, "CLEANER");
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const cleaner = await db.cleaner.findFirst({ where: { userId: user.id } });

  const booking = await db.booking.findUnique({
    where: { id },
    include: {
      customer: { include: { user: true } },
      car: true,
      photos: true,
    },
  });

  if (!booking || (booking.cleanerId !== cleaner?.id)) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  return NextResponse.json({ booking });
}
