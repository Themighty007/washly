import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-server";

// GET /api/admin/plans - List all plans
export async function GET(req: NextRequest) {
  const user = await requireRole(req, "ADMIN");
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plans = await db.plan.findMany({
    orderBy: { monthlyPrice: "asc" },
    include: { _count: { select: { customersWithPlan: true, subscriptionRequests: true } } },
  });

  return NextResponse.json({ plans });
}

// POST /api/admin/plans - Create new plan
export async function POST(req: NextRequest) {
  const admin = await requireRole(req, "ADMIN");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, monthlyPrice, totalWashes, description, features, popular } = await req.json();
  if (!name || !monthlyPrice || !totalWashes) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const plan = await db.plan.create({
    data: {
      name,
      monthlyPrice: parseFloat(monthlyPrice),
      totalWashes: parseInt(totalWashes),
      description: description || "",
      features: JSON.stringify(features || []),
      popular: popular || false,
    },
  });

  return NextResponse.json({ plan });
}

// PATCH /api/admin/plans - Update plan
export async function PATCH(req: NextRequest) {
  const admin = await requireRole(req, "ADMIN");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, ...updates } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (updates.name) data.name = updates.name;
  if (updates.monthlyPrice) data.monthlyPrice = parseFloat(updates.monthlyPrice);
  if (updates.totalWashes) data.totalWashes = parseInt(updates.totalWashes);
  if (updates.description !== undefined) data.description = updates.description;
  if (updates.features) data.features = JSON.stringify(updates.features);
  if (updates.popular !== undefined) data.popular = updates.popular;

  const plan = await db.plan.update({ where: { id }, data });
  return NextResponse.json({ plan });
}

// DELETE /api/admin/plans
export async function DELETE(req: NextRequest) {
  const admin = await requireRole(req, "ADMIN");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await db.plan.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
