import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole, pushNotification, notifyAdmins } from "@/lib/auth-server";

// GET /api/admin/customers?search=...&planId=...
export async function GET(req: NextRequest) {
  const user = await requireRole(req, "ADMIN");
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const planId = url.searchParams.get("planId");

  const where: Record<string, unknown> = {};
  if (planId) where.activePlanId = planId;
  if (search) {
    where.OR = [
      { user: { name: { contains: search } } },
      { user: { email: { contains: search } } },
      { user: { phone: { contains: search } } },
    ];
  }

  const customers = await db.customer.findMany({
    where,
    include: {
      user: true,
      activePlan: true,
      cars: true,
      _count: { select: { bookings: true, payments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const res = NextResponse.json({ customers });
  res.headers.set("Cache-Control", "private, max-age=30, stale-while-revalidate=60");
  return res;
}

// POST /api/admin/customers - Create new customer
export async function POST(req: NextRequest) {
  const user = await requireRole(req, "ADMIN");
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, email, phone, address, planId, cars, initialBooking } = body;

  if (!name || !email || !phone || !planId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Check email uniqueness
  const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: "Email already exists" }, { status: 400 });
  }

  const plan = await db.plan.findUnique({ where: { id: planId } });
  if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 400 });

  // Create user + customer + cars in transaction
  const newUser = await db.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      phone,
      address: address || null,
      role: "CUSTOMER",
      password: "customer123", // default password
    },
  });

  const customer = await db.customer.create({
    data: {
      userId: newUser.id,
      activePlanId: planId,
      subscriptionStart: new Date(),
      subscriptionEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
      remainingWashes: plan.totalWashes,
      status: "ACTIVE",
    },
  });

  // Create cars
  if (cars && Array.isArray(cars)) {
    for (const car of cars) {
      await db.car.create({
        data: {
          customerId: customer.id,
          make: car.make,
          model: car.model,
          year: parseInt(car.year) || new Date().getFullYear(),
          licensePlate: car.licensePlate,
          color: car.color || "Unknown",
          details: car.details || null,
        },
      });
    }
  }

  // Create initial payment for this month
  const now = new Date();
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  await db.payment.create({
    data: {
      customerId: customer.id,
      planName: plan.name,
      amount: plan.monthlyPrice,
      period,
      status: "PENDING",
      dueDate: new Date(now.getFullYear(), now.getMonth(), 10),
    },
  });

  // Create initial booking if provided
  if (initialBooking && initialBooking.date && initialBooking.timeSlot) {
    const carsList = await db.car.findMany({ where: { customerId: customer.id } });
    if (carsList.length > 0) {
      await db.booking.create({
        data: {
          customerId: customer.id,
          carId: carsList[0].id,
          date: new Date(initialBooking.date),
          timeSlot: initialBooking.timeSlot,
          address: address || "",
          status: "PENDING",
        },
      });
    }
  }

  // Notify admin
  await pushNotification({
    userId: user.id,
    type: "NEW_BOOKING",
    title: "Customer Created",
    message: `New customer ${name} has been added with ${plan.name} plan.`,
  });

  return NextResponse.json({ customer, user: newUser });
}
