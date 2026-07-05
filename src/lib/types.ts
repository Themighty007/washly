// Shared types for the Car Wash Management Ecosystem

export type Role = "CUSTOMER" | "CLEANER" | "ADMIN";

export type BookingStatus =
  | "PENDING"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "MISSED"
  | "CANCELLED";

export type PaymentStatus = "PENDING" | "PAID" | "OVERDUE" | "REFUNDED";

export type CleanerStatus = "ACTIVE" | "INACTIVE" | "ON_LEAVE";

export type CustomerStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export type AttendanceStatus = "PRESENT" | "ABSENT" | "HALF_DAY";

export type NotificationType =
  | "SLOT_CHANGED"
  | "CLEANER_ASSIGNED"
  | "WASH_COMPLETED"
  | "CAR_UNAVAILABLE"
  | "PAYMENT_REMINDER"
  | "NEW_BOOKING"
  | "PLAN_CHANGED"
  | "PLAN_CHANGE_REQUESTED"
  | "CHECK_IN"
  | "CHECK_OUT";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: Role;
  avatar?: string | null;
  address?: string | null;
}

export interface CustomerWithRelations {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string | null;
    avatar: string | null;
  };
  activePlanId: string | null;
  activePlan: Plan | null;
  subscriptionStart: string | null;
  subscriptionEnd: string | null;
  remainingWashes: number;
  status: CustomerStatus;
  cars: Car[];
  _count?: {
    bookings: number;
    payments: number;
  };
}

export interface CleanerWithRelations {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string | null;
    avatar: string | null;
  };
  status: CleanerStatus;
  rating: number;
  totalCompleted: number;
  totalAssigned: number;
  vehicleNumber: string | null;
  zone: string | null;
  _count?: {
    bookings: number;
  };
}

export interface Plan {
  id: string;
  name: string;
  monthlyPrice: number;
  totalWashes: number;
  description: string;
  features: string;
  popular: boolean;
}

export interface Car {
  id: string;
  customerId: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  color: string;
  details: string | null;
}

export interface BookingWithRelations {
  id: string;
  customerId: string;
  carId: string;
  cleanerId: string | null;
  date: string;
  timeSlot: string;
  duration: number;
  address: string;
  status: BookingStatus;
  missReason: string | null;
  startedAt: string | null;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    user: { id: string; name: string; phone: string; address: string | null };
  };
  car: Car;
  cleaner: {
    id: string;
    user: { id: string; name: string; phone: string; avatar: string | null };
    rating: number;
  } | null;
  photos: Photo[];
}

export interface Photo {
  id: string;
  bookingId: string;
  position: number;
  type: string;
  imageData: string;
  fileName: string | null;
  uploadedAt: string;
}

export interface Payment {
  id: string;
  customerId: string;
  planName: string;
  amount: number;
  period: string;
  status: PaymentStatus;
  method: string | null;
  paidAt: string | null;
  dueDate: string;
  notes: string | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  relatedId: string | null;
  createdAt: string;
}

export interface Attendance {
  id: string;
  cleanerId: string;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  totalHours: number | null;
  status: AttendanceStatus;
}
