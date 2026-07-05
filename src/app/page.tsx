"use client";

import { useAuth } from "@/lib/auth-store";
import { LoginScreen } from "@/components/shared/login-screen";
import { CustomerApp } from "@/components/customer/customer-app";
import { CleanerApp } from "@/components/cleaner/cleaner-app";
import { AdminApp } from "@/components/admin/admin-app";

export default function Home() {
  const { user } = useAuth();

  if (!user) {
    return <LoginScreen />;
  }

  if (user.role === "CUSTOMER") {
    return <CustomerApp />;
  }

  if (user.role === "CLEANER") {
    return <CleanerApp />;
  }

  if (user.role === "ADMIN") {
    return <AdminApp />;
  }

  // Unknown role — log out
  return <LoginScreen />;
}
