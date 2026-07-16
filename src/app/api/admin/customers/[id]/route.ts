import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole, pushNotification } from "@/lib/auth-server";

// GET /api/admin/customers/[id] - Customer detail view for admin
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireRole(req, "ADMIN");
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const customer = await db.customer.findUnique({
    where: { id },
    include: {
      user: true,
      activePlan: true,
      cars: true,
      payments: { orderBy: { createdAt: "desc" } },
      bookings: {
        include: { car: true, cleaner: { include: { user: true } } },
        orderBy: { date: "desc" },
      },
      subscriptionRequests: {
        include: { requestedPlan: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  const upcomingBookings = customer.bookings.filter(
    (b) => ["PENDING", "ASSIGNED", "IN_PROGRESS"].includes(b.status) && new Date(b.date) >= new Date()
  );
  const pastBookings = customer.bookings.filter((b) => !upcomingBookings.includes(b));

  return NextResponse.json({
    customer: {
      id: customer.id,
      user: customer.user,
      activePlan: customer.activePlan,
      subscriptionStart: customer.subscriptionStart,
      subscriptionEnd: customer.subscriptionEnd,
      remainingWashes: customer.remainingWashes,
      status: customer.status,
      cars: customer.cars,
      payments: customer.payments,
      upcomingBookings,
      pastBookings,
      subscriptionRequests: customer.subscriptionRequests,
    },
  });
}

// PATCH /api/admin/customers/[id] - Update customer (change plan, add washes, status)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireRole(req, "ADMIN");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { action, planId, addWashes, name, phone, address, status } = body;

  const customer = await db.customer.findUnique({ where: { id }, include: { user: true, activePlan: true } });
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  if (action === "change-plan" && planId) {
    const plan = await db.plan.findUnique({ where: { id: planId } });
    if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 400 });

    const updated = await db.customer.update({
      where: { id },
      data: {
        activePlanId: planId,
        subscriptionStart: new Date(),
        subscriptionEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
        remainingWashes: plan.totalWashes,
      },
      include: { activePlan: true },
    });

    // Create payment for new plan
    const now = new Date();
    await db.payment.create({
      data: {
        customerId: customer.id,
        planName: plan.name,
        amount: plan.monthlyPrice,
        period: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
        status: "PENDING",
        dueDate: new Date(now.getFullYear(), now.getMonth(), 10),
      },
    });

    // Notify customer
    await pushNotification({
      userId: customer.userId,
      type: "PLAN_CHANGED",
      title: "Plan Updated",
      message: `Your subscription plan has been updated to ${plan.name}. You now have ${plan.totalWashes} washes per month.`,
    });

    return NextResponse.json({ customer: updated });
  }

  if (action === "add-washes" && typeof addWashes === "number") {
    const updated = await db.customer.update({
      where: { id },
      data: { remainingWashes: { increment: addWashes } },
    });
    return NextResponse.json({ customer: updated });
  }

  // Generic profile update
  const userUpdate: Record<string, unknown> = {};
  if (name) userUpdate.name = name;
  if (phone) userUpdate.phone = phone;
  if (address) userUpdate.address = address;

  if (Object.keys(userUpdate).length > 0) {
    await db.user.update({ where: { id: customer.userId }, data: userUpdate });
  }

  const customerUpdate: Record<string, unknown> = {};
  if (status) customerUpdate.status = status;

  const updated = await db.customer.update({
    where: { id },
    data: customerUpdate,
    include: { user: true, activePlan: true },
  });

  return NextResponse.json({ customer: updated });
}

// DELETE /api/admin/customers/[id] - Delete customer
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireRole(req, "ADMIN");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const customer = await db.customer.findUnique({ where: { id } });
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  await db.customer.delete({ where: { id } });
  await db.user.delete({ where: { id: customer.userId } });

  return NextResponse.json({ success: true });
}
