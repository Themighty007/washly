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

  // Today's task count per cleaner
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const cleanersWithTasks = await Promise.all(
    cleaners.map(async (c) => {
      const todaysTasks = await db.booking.count({
        where: {
          cleanerId: c.id,
          date: { gte: startOfToday, lte: endOfToday },
        },
      });
      return { ...c, todaysTasks };
    })
  );

  return NextResponse.json({ cleaners: cleanersWithTasks });
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
