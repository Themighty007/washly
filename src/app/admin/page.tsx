"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-store";
import { AdminApp } from "@/components/admin/admin-app";

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace("/");
    } else if (user.role !== "ADMIN") {
      router.replace(`/${user.role.toLowerCase()}`);
    }
  }, [user, router]);

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return <AdminApp />;
}
