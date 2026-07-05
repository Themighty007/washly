import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole, pushNotification, notifyAdmins } from "@/lib/auth-server";

// POST /api/customer/plan-change - Request plan change
export async function POST(req: NextRequest) {
  const user = await requireRole(req, "CUSTOMER");
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { requestedPlanId, notes } = await req.json();
  if (!requestedPlanId) {
    return NextResponse.json({ error: "requestedPlanId required" }, { status: 400 });
  }

  const customer = await db.customer.findFirst({
    where: { userId: user.id },
    include: { activePlan: true },
  });
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  const requestedPlan = await db.plan.findUnique({ where: { id: requestedPlanId } });
  if (!requestedPlan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

  const request = await db.subscriptionRequest.create({
    data: {
      customerId: customer.id,
      requestedPlanId,
      currentPlanId: customer.activePlanId,
      notes: notes || null,
      status: "PENDING",
    },
    include: { requestedPlan: true },
  });

  await pushNotification({
    userId: user.id,
    type: "PLAN_CHANGE_REQUESTED",
    title: "Plan Change Requested",
    message: `Your request to switch to ${requestedPlan.name} plan has been submitted. Our team will review it shortly.`,
    relatedId: request.id,
  });

  await notifyAdmins({
    type: "PLAN_CHANGE_REQUESTED",
    title: "Plan Change Request",
    message: `${user.name} requested to switch to the ${requestedPlan.name} plan.`,
    relatedId: request.id,
  });

  return NextResponse.json({ request });
}

// GET /api/customer/plans - List all available plans
export async function GET(req: NextRequest) {
  const user = await requireRole(req, "CUSTOMER");
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plans = await db.plan.findMany({ orderBy: { monthlyPrice: "asc" } });
  const customer = await db.customer.findFirst({
    where: { userId: user.id },
    include: { subscriptionRequests: { orderBy: { createdAt: "desc" }, take: 5 } },
  });

  return NextResponse.json({
    plans,
    activePlanId: customer?.activePlanId,
    pendingRequests: customer?.subscriptionRequests || [],
  });
}
