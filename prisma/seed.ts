// Seed script: creates demo users, plans, cars, bookings, payments
// Run with: bun run prisma/seed.ts

import { PrismaClient } from "@prisma/client";
import { promises as fs } from "fs";
import path from "path";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await db.photo.deleteMany();
  await db.notification.deleteMany();
  await db.attendance.deleteMany();
  await db.payment.deleteMany();
  await db.subscriptionRequest.deleteMany();
  await db.booking.deleteMany();
  await db.car.deleteMany();
  await db.customer.deleteMany();
  await db.cleaner.deleteMany();
  await db.plan.deleteMany();
  await db.user.deleteMany();

  // ============= 1. CREATE PLANS =============
  const basicPlan = await db.plan.create({
    data: {
      name: "Basic",
      monthlyPrice: 999,
      totalWashes: 8,
      description: "Perfect for single-car households with weekly wash needs",
      features: JSON.stringify([
        "8 washes per month",
        "1 car coverage",
        "Standard exterior wash",
        "Weekday slots only",
        "Email support",
      ]),
      popular: false,
    },
  });

  const premiumPlan = await db.plan.create({
    data: {
      name: "Premium",
      monthlyPrice: 1799,
      totalWashes: 12,
      description: "Most popular plan for daily commuters with full coverage",
      features: JSON.stringify([
        "12 washes per month",
        "2 cars coverage",
        "Exterior + interior detail",
        "All slots available",
        "Priority booking",
        "24/7 phone support",
      ]),
      popular: true,
    },
  });

  const luxuryPlan = await db.plan.create({
    data: {
      name: "Luxury",
      monthlyPrice: 2999,
      totalWashes: 20,
      description: "Ultimate plan for premium cars with full detailing",
      features: JSON.stringify([
        "20 washes per month",
        "3 cars coverage",
        "Premium detailing + wax",
        "Priority slots",
        "Dedicated cleaner",
        "Weekend premium slots",
        "Concierge support",
      ]),
      popular: false,
    },
  });

  console.log("✓ Created 3 plans");

  // ============= 2. CREATE ADMIN USER =============
  const adminUser = await db.user.create({
    data: {
      email: "admin@theidrott.com",
      password: "admin123",
      name: "Admin User",
      phone: "+919999999999",
      role: "ADMIN",
      address: "THE IDROTT HQ, Mumbai",
    },
  });

  // ============= 3. CREATE CLEANERS =============
  const cleanerUsers = [
    {
      email: "rajesh@theidrott.com",
      password: "cleaner123",
      name: "Rajesh Kumar",
      phone: "+919876543210",
      address: "Andheri East, Mumbai",
      zone: "Andheri",
      vehicleNumber: "MH02AB1234",
    },
    {
      email: "suresh@theidrott.com",
      password: "cleaner123",
      name: "Suresh Patel",
      phone: "+919876543211",
      address: "Bandra West, Mumbai",
      zone: "Bandra",
      vehicleNumber: "MH02CD5678",
    },
    {
      email: "amit@theidrott.com",
      password: "cleaner123",
      name: "Amit Sharma",
      phone: "+919876543212",
      address: "Juhu, Mumbai",
      zone: "Juhu",
      vehicleNumber: "MH02EF9012",
    },
  ];

  const cleaners: any[] = [];
  for (const cu of cleanerUsers) {
    const user = await db.user.create({
      data: {
        email: cu.email,
        password: cu.password,
        name: cu.name,
        phone: cu.phone,
        role: "CLEANER",
        address: cu.address,
      },
    });
    const cleaner = await db.cleaner.create({
      data: {
        userId: user.id,
        status: "ACTIVE",
        rating: 4.5 + Math.random() * 0.5,
        totalCompleted: Math.floor(Math.random() * 80) + 20,
        totalAssigned: Math.floor(Math.random() * 100) + 30,
        vehicleNumber: cu.vehicleNumber,
        zone: cu.zone,
      },
    });
    cleaners.push(cleaner);
  }
  console.log("✓ Created 3 cleaners");

  // ============= 4. CREATE CUSTOMERS =============
  const customerData = [
    {
      email: "priya@gmail.com",
      password: "customer123",
      name: "Priya Sharma",
      phone: "+919811100001",
      address: "Flat 401, Sea View Apartments, Bandra West, Mumbai 400050",
      planId: premiumPlan.id,
      planName: "Premium",
      cars: [
        { make: "Honda", model: "City", year: 2022, licensePlate: "MH01AB1111", color: "Pearl White" },
      ],
      remainingWashes: 8,
    },
    {
      email: "rohan@gmail.com",
      password: "customer123",
      name: "Rohan Mehta",
      phone: "+919811100002",
      address: "Bungalow 12, Pali Hill, Bandra West, Mumbai 400050",
      planId: luxuryPlan.id,
      planName: "Luxury",
      cars: [
        { make: "BMW", model: "5 Series", year: 2023, licensePlate: "MH01CD2222", color: "Black Sapphire" },
        { make: "Mercedes", model: "GLE", year: 2023, licensePlate: "MH01EF3333", color: "Obsidian Black" },
      ],
      remainingWashes: 14,
    },
    {
      email: "anita@gmail.com",
      password: "customer123",
      name: "Anita Desai",
      phone: "+919811100003",
      address: "Flat 902, Hiranandani Gardens, Powai, Mumbai 400076",
      planId: basicPlan.id,
      planName: "Basic",
      cars: [
        { make: "Maruti", model: "Swift", year: 2021, licensePlate: "MH04GH4444", color: "Metallic Red" },
      ],
      remainingWashes: 5,
    },
    {
      email: "vikram@gmail.com",
      password: "customer123",
      name: "Vikram Singh",
      phone: "+919811100004",
      address: "Flat 15, Oberoi Splendor, Andheri East, Mumbai 400053",
      planId: premiumPlan.id,
      planName: "Premium",
      cars: [
        { make: "Hyundai", model: "Creta", year: 2022, licensePlate: "MH02IJ5555", color: "Polar White" },
        { make: "Toyota", model: "Innova", year: 2021, licensePlate: "MH02KL6666", color: "Silver" },
      ],
      remainingWashes: 10,
    },
    {
      email: "neha@gmail.com",
      password: "customer123",
      name: "Neha Kapoor",
      phone: "+919811100005",
      address: "Penthouse 2, Lodha Belmondo, Pune 411045",
      planId: luxuryPlan.id,
      planName: "Luxury",
      cars: [
        { make: "Audi", model: "Q7", year: 2023, licensePlate: "MH14MN7777", color: "Mythos Black" },
      ],
      remainingWashes: 18,
    },
  ];

  const customers: any[] = [];
  for (const cd of customerData) {
    const user = await db.user.create({
      data: {
        email: cd.email,
        password: cd.password,
        name: cd.name,
        phone: cd.phone,
        role: "CUSTOMER",
        address: cd.address,
      },
    });

    const customer = await db.customer.create({
      data: {
        userId: user.id,
        activePlanId: cd.planId,
        subscriptionStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        subscriptionEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
        remainingWashes: cd.remainingWashes,
        status: "ACTIVE",
      },
    });

    // Create cars
    for (const car of cd.cars) {
      await db.car.create({
        data: {
          customerId: customer.id,
          make: car.make,
          model: car.model,
          year: car.year,
          licensePlate: car.licensePlate,
          color: car.color,
          details: `${car.color} ${car.make} ${car.model}`,
        },
      });
    }

    customers.push({ ...customer, planName: cd.planName, planId: cd.planId });
  }
  console.log("✓ Created 5 customers with cars");

  // ============= 5. CREATE BOOKINGS =============
  // Helper: build date at given offset from today
  const dateAt = (dayOffset: number, hour = 9, minute = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hour, minute, 0, 0);
    return d;
  };

  const timeSlots = [
    "08:00 - 09:00",
    "09:00 - 10:00",
    "10:00 - 11:00",
    "11:00 - 12:00",
    "13:00 - 14:00",
    "14:00 - 15:00",
    "15:00 - 16:00",
    "16:00 - 17:00",
  ];

  // Upcoming + in-progress + pending bookings for each customer
  const bookingSpecs = [
    // Priya (customer 0) — upcoming today + tomorrow
    { customerIdx: 0, carIdx: 0, cleanerIdx: 0, dayOffset: 0, slot: 1, status: "ASSIGNED" },
    { customerIdx: 0, carIdx: 0, cleanerIdx: 1, dayOffset: 2, slot: 2, status: "ASSIGNED" },
    { customerIdx: 0, carIdx: 0, cleanerIdx: 2, dayOffset: 5, slot: 3, status: "ASSIGNED" },
    // Rohan (1) — has 2 cars
    { customerIdx: 1, carIdx: 0, cleanerIdx: 1, dayOffset: 1, slot: 4, status: "ASSIGNED" },
    { customerIdx: 1, carIdx: 1, cleanerIdx: 2, dayOffset: 3, slot: 5, status: "ASSIGNED" },
    { customerIdx: 1, carIdx: 0, cleanerIdx: 0, dayOffset: 6, slot: 6, status: "ASSIGNED" },
    // Anita (2)
    { customerIdx: 2, carIdx: 0, cleanerIdx: 2, dayOffset: 1, slot: 7, status: "ASSIGNED" },
    { customerIdx: 2, carIdx: 0, cleanerIdx: 0, dayOffset: 4, slot: 0, status: "ASSIGNED" },
    // Vikram (3)
    { customerIdx: 3, carIdx: 0, cleanerIdx: 0, dayOffset: 0, slot: 5, status: "IN_PROGRESS" },
    { customerIdx: 3, carIdx: 1, cleanerIdx: 1, dayOffset: 2, slot: 6, status: "ASSIGNED" },
    { customerIdx: 3, carIdx: 0, cleanerIdx: 2, dayOffset: 7, slot: 7, status: "ASSIGNED" },
    // Neha (4)
    { customerIdx: 4, carIdx: 0, cleanerIdx: 2, dayOffset: 1, slot: 4, status: "ASSIGNED" },
    { customerIdx: 4, carIdx: 0, cleanerIdx: 0, dayOffset: 4, slot: 5, status: "ASSIGNED" },
  ];

  // Past completed bookings (negative day offsets)
  const pastBookingSpecs = [
    { customerIdx: 0, carIdx: 0, cleanerIdx: 0, dayOffset: -2, slot: 1, status: "COMPLETED" },
    { customerIdx: 0, carIdx: 0, cleanerIdx: 1, dayOffset: -7, slot: 2, status: "COMPLETED" },
    { customerIdx: 1, carIdx: 0, cleanerIdx: 1, dayOffset: -3, slot: 4, status: "COMPLETED" },
    { customerIdx: 1, carIdx: 1, cleanerIdx: 2, dayOffset: -9, slot: 5, status: "COMPLETED" },
    { customerIdx: 2, carIdx: 0, cleanerIdx: 2, dayOffset: -4, slot: 6, status: "COMPLETED" },
    { customerIdx: 3, carIdx: 0, cleanerIdx: 0, dayOffset: -2, slot: 3, status: "COMPLETED" },
    { customerIdx: 3, carIdx: 1, cleanerIdx: 1, dayOffset: -8, slot: 4, status: "COMPLETED" },
    { customerIdx: 4, carIdx: 0, cleanerIdx: 2, dayOffset: -5, slot: 4, status: "COMPLETED" },
    // A missed wash
    { customerIdx: 1, carIdx: 0, cleanerIdx: 0, dayOffset: -1, slot: 1, status: "MISSED", reason: "Car not available at location" },
  ];

  const allBookings = [...bookingSpecs, ...pastBookingSpecs];

  // Generate a small placeholder image (1x1 transparent PNG base64) so photos are not empty
  const PLACEHOLDER_IMG =
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgMzAwIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzFjMWMxYyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzljOWM5YyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+V2FzaCBQaG90bzwvdGV4dD48L3N2Zz4=";

  for (const spec of allBookings) {
    const customer = customers[spec.customerIdx];
    const customerCars = await db.car.findMany({ where: { customerId: customer.id } });
    const car = customerCars[spec.carIdx];
    const cleaner = cleaners[spec.cleanerIdx];
    const date = dateAt(spec.dayOffset, parseInt(timeSlots[spec.slot].split(":")[0]), 0);

    const booking = await db.booking.create({
      data: {
        customerId: customer.id,
        carId: car.id,
        cleanerId: cleaner.id,
        date,
        timeSlot: timeSlots[spec.slot],
        duration: 60,
        address: (await db.user.findUnique({ where: { id: customer.userId } }))!.address || "",
        status: spec.status,
        missReason: (spec as { reason?: string }).reason || null,
        startedAt: spec.status === "IN_PROGRESS" || spec.status === "COMPLETED" ? new Date(date.getTime()) : null,
        completedAt: spec.status === "COMPLETED" ? new Date(date.getTime() + 45 * 60 * 1000) : null,
      },
    });

    // For completed bookings, add 4 placeholder photos
    if (spec.status === "COMPLETED") {
      for (let p = 1; p <= 4; p++) {
        await db.photo.create({
          data: {
            bookingId: booking.id,
            position: p,
            type: "AFTER",
            imageData: PLACEHOLDER_IMG,
            fileName: `wash-photo-${p}.svg`,
            fileSize: 1024,
          },
        });
      }
    }
  }
  console.log(`✓ Created ${allBookings.length} bookings`);

  // ============= 6. CREATE PAYMENTS =============
  const now = new Date();
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastPeriod = `${now.getFullYear()}-${String(now.getMonth()).padStart(2, "0")}`;

  for (const customer of customers) {
    const plan = await db.plan.findUnique({ where: { id: customer.planId } });
    if (!plan) continue;

    // Last month - paid
    await db.payment.create({
      data: {
        customerId: customer.id,
        planName: customer.planName,
        amount: plan.monthlyPrice,
        period: lastPeriod,
        status: "PAID",
        method: "UPI",
        paidAt: new Date(now.getFullYear(), now.getMonth() - 1, 5),
        dueDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      },
    });

    // Current month - pending (with random overdue chance)
    const isOverdue = Math.random() > 0.6;
    await db.payment.create({
      data: {
        customerId: customer.id,
        planName: customer.planName,
        amount: plan.monthlyPrice,
        period: currentPeriod,
        status: isOverdue ? "OVERDUE" : "PENDING",
        dueDate: new Date(now.getFullYear(), now.getMonth(), 10),
      },
    });
  }
  console.log("✓ Created payments");

  // ============= 7. CREATE ATTENDANCE =============
  for (const cleaner of cleaners) {
    // Past 7 days attendance
    for (let i = 7; i >= 1; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const checkIn = new Date(date);
      checkIn.setHours(9, Math.floor(Math.random() * 30), 0, 0);
      const checkOut = new Date(date);
      checkOut.setHours(18, Math.floor(Math.random() * 30), 0, 0);
      const hours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);

      await db.attendance.create({
        data: {
          cleanerId: cleaner.id,
          date,
          checkInTime: checkIn,
          checkOutTime: checkOut,
          totalHours: Math.round(hours * 10) / 10,
          status: "PRESENT",
        },
      });
    }
  }
  console.log("✓ Created attendance records");

  // ============= 8. CREATE SAMPLE NOTIFICATIONS =============
  const allUsers = await db.user.findMany();
  for (const u of allUsers) {
    if (u.role === "CUSTOMER") {
      await db.notification.create({
        data: {
          userId: u.id,
          type: "NEW_BOOKING",
          title: "Booking Confirmed",
          message: "Your car wash booking has been confirmed by our team.",
          isRead: false,
        },
      });
    } else if (u.role === "CLEANER") {
      await db.notification.create({
        data: {
          userId: u.id,
          type: "CLEANER_ASSIGNED",
          title: "New Wash Assigned",
          message: "A new wash has been assigned to you. Check your task list.",
          isRead: false,
        },
      });
    } else {
      await db.notification.create({
        data: {
          userId: u.id,
          type: "PAYMENT_REMINDER",
          title: "Pending Payments",
          message: "There are pending payments awaiting your review.",
          isRead: false,
        },
      });
    }
  }
  console.log("✓ Created notifications");

  console.log("\n🎉 Seeding complete!");
  console.log("\n📋 Demo accounts:");
  console.log("  Admin:    admin@theidrott.com / admin123");
  console.log("  Cleaner:  rajesh@theidrott.com / cleaner123");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
