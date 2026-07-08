import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-server";

// GET /api/admin/cleaners
export async function GET(req: NextRequest) {
  const user = await requireRole(req, "ADMIN");
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { user: { name: { contains: search } } },
      { user: { email: { contains: search } } },
      { user: { phone: { contains: search } } },
    ];
  }

  const cleaners = await db.cleaner.findMany({
    where,
    include: {
      user: true,
      _count: { select: { bookings: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Today's task count — ONE query with groupBy instead of N queries
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const todaysBookingCounts = await db.booking.groupBy({
    by: ["cleanerId"],
    where: { date: { gte: startOfToday, lte: endOfToday }, cleanerId: { not: null } },
    _count: { id: true },
  });

  const countMap = new Map(todaysBookingCounts.map((b) => [b.cleanerId, b._count.id]));

  // Completed/rating in single queries
  const completedCounts = await db.booking.groupBy({
    by: ["cleanerId"],
    where: { status: "COMPLETED", cleanerId: { not: null } },
    _count: { id: true },
  });
  const completedMap = new Map(completedCounts.map((b) => [b.cleanerId, b._count.id]));

  const cleanersWithTasks = cleaners.map((c) => ({
    ...c,
    todaysTasks: countMap.get(c.id) ?? 0,
    totalCompleted: completedMap.get(c.id) ?? 0,
    rating: c.rating ?? 0,
  }));

  const res = NextResponse.json({ cleaners: cleanersWithTasks });
  res.headers.set("Cache-Control", "private, max-age=30, stale-while-revalidate=60");
  return res;
}

// POST /api/admin/cleaners - Create new cleaner
export async function POST(req: NextRequest) {
  const admin = await requireRole(req, "ADMIN");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, email, phone, address, zone, vehicleNumber } = body;

  if (!name || !email || !phone) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: "Email already exists" }, { status: 400 });
  }

  const newUser = await db.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      phone,
      address: address || null,
      role: "CLEANER",
      password: "cleaner123",
    },
  });

  const cleaner = await db.cleaner.create({
    data: {
      userId: newUser.id,
      zone: zone || null,
      vehicleNumber: vehicleNumber || null,
      status: "ACTIVE",
    },
    include: { user: true },
  });

  return NextResponse.json({ cleaner });
}
