"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-store";
import { CustomerApp } from "@/components/customer/customer-app";

export default function CustomerPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace("/");
    } else if (user.role !== "CUSTOMER") {
      router.replace(`/${user.role.toLowerCase()}`);
    }
  }, [user, router]);

  if (!user || user.role !== "CUSTOMER") {
    return null; // Or a loading spinner
  }

  return <CustomerApp />;
}
