import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-server";

// GET /api/admin/pending-washes - Missed washes + car not available + failed washes
export async function GET(req: NextRequest) {
  const user = await requireRole(req, "ADMIN");
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pendingBookings = await db.booking.findMany({
    where: { status: { in: ["MISSED", "PENDING"] } },
    include: {
      customer: { include: { user: true } },
      car: true,
      cleaner: { include: { user: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  const res = NextResponse.json({ pendingWashes: pendingBookings });
  res.headers.set("Cache-Control", "private, max-age=15, stale-while-revalidate=30");
  return res;
}
