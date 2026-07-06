import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-server";

// GET /api/admin/cleaners/[id] - Cleaner profile with analytics
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireRole(req, "ADMIN");
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const cleaner = await db.cleaner.findUnique({
    where: { id },
    include: {
      user: true,
      bookings: {
        include: { customer: { include: { user: true } }, car: true, photos: true },
        orderBy: { date: "desc" },
        take: 30,
      },
      attendance: { orderBy: { date: "desc" }, take: 14 },
    },
  });

  if (!cleaner) return NextResponse.json({ error: "Cleaner not found" }, { status: 404 });

  // Performance analytics: last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentBookings = cleaner.bookings.filter((b) => new Date(b.date) >= thirtyDaysAgo);
  const completed = recentBookings.filter((b) => b.status === "COMPLETED").length;
  const missed = recentBookings.filter((b) => b.status === "MISSED").length;
  const completionRate = recentBookings.length > 0 ? (completed / recentBookings.length) * 100 : 0;

  return NextResponse.json({
    cleaner: {
      ...cleaner,
      analytics: {
        last30Days: {
          total: recentBookings.length,
          completed,
          missed,
          completionRate: Math.round(completionRate * 10) / 10,
        },
      },
    },
  });
}

// PATCH /api/admin/cleaners/[id] - Edit cleaner (status, name, phone, etc.)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireRole(req, "ADMIN");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { name, phone, address, status, zone, vehicleNumber } = body;

  const cleaner = await db.cleaner.findUnique({ where: { id }, include: { user: true } });
  if (!cleaner) return NextResponse.json({ error: "Cleaner not found" }, { status: 404 });

  if (name || phone || address) {
    await db.user.update({
      where: { id: cleaner.userId },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(address && { address }),
      },
    });
  }

  const updated = await db.cleaner.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(zone !== undefined && { zone }),
      ...(vehicleNumber !== undefined && { vehicleNumber }),
    },
    include: { user: true },
  });

  return NextResponse.json({ cleaner: updated });
}

// DELETE /api/admin/cleaners/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireRole(req, "ADMIN");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const cleaner = await db.cleaner.findUnique({ where: { id } });
  if (!cleaner) return NextResponse.json({ error: "Cleaner not found" }, { status: 404 });

  await db.cleaner.delete({ where: { id } });
  await db.user.delete({ where: { id: cleaner.userId } });

  return NextResponse.json({ success: true });
}
