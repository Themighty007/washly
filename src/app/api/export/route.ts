import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-server";

// Generic CSV helper
function toCSV(rows: Record<string, unknown>[], headers?: string[]): string {
  if (rows.length === 0) return "";
  const cols = headers || Object.keys(rows[0]);
  const escape = (val: unknown) => {
    const s = val === null || val === undefined ? "" : String(val);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const headerLine = cols.join(",");
  const dataLines = rows.map((r) => cols.map((c) => escape(r[c])).join(","));
  return [headerLine, ...dataLines].join("\n");
}

// Helper: send CSV as response
function csvResponse(csv: string, filename: string) {
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

// Helper: send JSON as response (for Excel-like data)
function jsonResponse(data: unknown, filename: string) {
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

export async function GET(req: NextRequest) {
  const user = await requireRole(req, "ADMIN");
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const type = url.searchParams.get("type"); // customers, cleaners, revenue, payments, wash-history, pending, attendance
  const format = url.searchParams.get("format") || "csv"; // csv | json

  let rows: Record<string, unknown>[] = [];
  let filename = `${type}-${new Date().toISOString().split("T")[0]}`;

  switch (type) {
    case "customers": {
      const customers = await db.customer.findMany({
        include: { user: true, activePlan: true, cars: true, _count: { select: { bookings: true } } },
      });
      rows = customers.map((c) => ({
        id: c.id,
        name: c.user.name,
        email: c.user.email,
        phone: c.user.phone,
        address: c.user.address || "",
        plan: c.activePlan?.name || "None",
        monthlyPrice: c.activePlan?.monthlyPrice || 0,
        remainingWashes: c.remainingWashes,
        status: c.status,
        totalBookings: c._count.bookings,
        cars: c.cars.map((car) => `${car.make} ${car.model} (${car.licensePlate})`).join("; "),
        subscriptionStart: c.subscriptionStart?.toISOString().split("T")[0] || "",
        subscriptionEnd: c.subscriptionEnd?.toISOString().split("T")[0] || "",
        createdAt: c.createdAt.toISOString().split("T")[0],
      }));
      break;
    }

    case "cleaners": {
      const cleaners = await db.cleaner.findMany({
        include: { user: true, _count: { select: { bookings: true, attendance: true } } },
      });
      rows = cleaners.map((c) => ({
        id: c.id,
        name: c.user.name,
        email: c.user.email,
        phone: c.user.phone,
        zone: c.zone || "",
        vehicleNumber: c.vehicleNumber || "",
        status: c.status,
        rating: c.rating,
        totalCompleted: c.totalCompleted,
        totalAssigned: c.totalAssigned,
        totalBookings: c._count.bookings,
        attendanceRecords: c._count.attendance,
        createdAt: c.createdAt.toISOString().split("T")[0],
      }));
      break;
    }

    case "revenue": {
      const payments = await db.payment.findMany({
        where: { status: "PAID" },
        include: { customer: { include: { user: true } } },
        orderBy: { paidAt: "desc" },
      });
      rows = payments.map((p) => ({
        id: p.id,
        customer: p.customer.user.name,
        email: p.customer.user.email,
        plan: p.planName,
        amount: p.amount,
        period: p.period,
        status: p.status,
        method: p.method || "",
        paidAt: p.paidAt?.toISOString().split("T")[0] || "",
        dueDate: p.dueDate.toISOString().split("T")[0],
      }));
      break;
    }

    case "payments": {
      const payments = await db.payment.findMany({
        include: { customer: { include: { user: true } } },
        orderBy: { createdAt: "desc" },
      });
      rows = payments.map((p) => ({
        id: p.id,
        customer: p.customer.user.name,
        email: p.customer.user.email,
        plan: p.planName,
        amount: p.amount,
        period: p.period,
        status: p.status,
        method: p.method || "",
        paidAt: p.paidAt?.toISOString().split("T")[0] || "",
        dueDate: p.dueDate.toISOString().split("T")[0],
        createdAt: p.createdAt.toISOString().split("T")[0],
      }));
      break;
    }

    case "wash-history": {
      const bookings = await db.booking.findMany({
        include: {
          customer: { include: { user: true } },
          cleaner: { include: { user: true } },
          car: true,
        },
        orderBy: { date: "desc" },
      });
      rows = bookings.map((b) => ({
        id: b.id,
        customer: b.customer.user.name,
        cleaner: b.cleaner?.user.name || "Unassigned",
        car: `${b.car.make} ${b.car.model} (${b.car.licensePlate})`,
        date: b.date.toISOString().split("T")[0],
        timeSlot: b.timeSlot,
        address: b.address,
        status: b.status,
        missReason: b.missReason || "",
        completedAt: b.completedAt?.toISOString().split("T")[0] || "",
        createdAt: b.createdAt.toISOString().split("T")[0],
      }));
      break;
    }

    case "pending": {
      const pending = await db.booking.findMany({
        where: { status: { in: ["MISSED", "PENDING"] } },
        include: {
          customer: { include: { user: true } },
          cleaner: { include: { user: true } },
          car: true,
        },
        orderBy: { updatedAt: "desc" },
      });
      rows = pending.map((b) => ({
        id: b.id,
        customer: b.customer.user.name,
        cleaner: b.cleaner?.user.name || "Unassigned",
        car: `${b.car.make} ${b.car.model}`,
        date: b.date.toISOString().split("T")[0],
        timeSlot: b.timeSlot,
        status: b.status,
        missReason: b.missReason || "",
        address: b.address,
      }));
      break;
    }

    case "attendance": {
      const attendance = await db.attendance.findMany({
        include: { cleaner: { include: { user: true } } },
        orderBy: { date: "desc" },
      });
      rows = attendance.map((a) => ({
        id: a.id,
        cleaner: a.cleaner.user.name,
        date: a.date.toISOString().split("T")[0],
        checkInTime: a.checkInTime?.toISOString().split("T")[1]?.split(".")[0] || "",
        checkOutTime: a.checkOutTime?.toISOString().split("T")[1]?.split(".")[0] || "",
        totalHours: a.totalHours || 0,
        status: a.status,
      }));
      break;
    }

    case "monthly-report":
    case "yearly-report": {
      const isYearly = type === "yearly-report";
      const startDate = isYearly
        ? new Date(new Date().getFullYear(), 0, 1)
        : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const endDate = new Date();

      const [customers, cleaners, completedBookings, missedBookings, payments] = await Promise.all([
        db.customer.count(),
        db.cleaner.count(),
        db.booking.count({ where: { status: "COMPLETED", completedAt: { gte: startDate, lte: endDate } } }),
        db.booking.count({ where: { status: "MISSED", updatedAt: { gte: startDate, lte: endDate } } }),
        db.payment.findMany({ where: { status: "PAID", paidAt: { gte: startDate, lte: endDate } } }),
      ]);

      const totalRevenue = payments.reduce((s, p) => s + p.amount, 0);
      rows = [
        {
          reportType: isYearly ? "Yearly" : "Monthly",
          period: isYearly ? `${new Date().getFullYear()}` : `${new Date().toLocaleString("default", { month: "long" })} ${new Date().getFullYear()}`,
          totalCustomers: customers,
          totalCleaners: cleaners,
          completedWashes: completedBookings,
          missedWashes: missedBookings,
          totalRevenue,
          averageRevenuePerWash: completedBookings > 0 ? Math.round(totalRevenue / completedBookings) : 0,
          generatedAt: new Date().toISOString(),
        },
      ];
      filename = `${type}-${new Date().toISOString().split("T")[0]}`;
      break;
    }

    default:
      return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
  }

  if (format === "json") {
    return jsonResponse(rows, `${filename}.json`);
  }

  return csvResponse(toCSV(rows), `${filename}.csv`);
}
