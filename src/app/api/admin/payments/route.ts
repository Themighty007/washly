import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole, pushNotification } from "@/lib/auth-server";

// GET /api/admin/payments?status=...&period=...
export async function GET(req: NextRequest) {
  const user = await requireRole(req, "ADMIN");
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const period = url.searchParams.get("period");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (period) where.period = period;

  const payments = await db.payment.findMany({
    where,
    include: { customer: { include: { user: true, activePlan: true } } },
    orderBy: { createdAt: "desc" },
  });

  // Summary
  const totalDue = payments.filter((p) => p.status === "PENDING" || p.status === "OVERDUE").reduce((s, p) => s + p.amount, 0);
  const totalCollected = payments.filter((p) => p.status === "PAID").reduce((s, p) => s + p.amount, 0);
  const overdueCount = payments.filter((p) => p.status === "OVERDUE").length;

  return NextResponse.json({
    payments,
    summary: {
      total: payments.length,
      totalDue,
      totalCollected,
      overdueCount,
    },
  });
}

// PATCH /api/admin/payments - Mark payment as paid
export async function PATCH(req: NextRequest) {
  const admin = await requireRole(req, "ADMIN");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, status, method, notes } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const payment = await db.payment.findUnique({
    where: { id },
    include: { customer: { include: { user: true } } },
  });
  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

  const updated = await db.payment.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(status === "PAID" && { paidAt: new Date() }),
      ...(method && { method }),
      ...(notes !== undefined && { notes }),
    },
  });

  // Notify customer if marked paid
  if (status === "PAID") {
    await pushNotification({
      userId: payment.customer.userId,
      type: "PAYMENT_REMINDER",
      title: "Payment Received",
      message: `We received your payment of ₹${payment.amount} for ${payment.planName} plan (${payment.period}). Thank you!`,
    });
  }

  return NextResponse.json({ payment: updated });
}
