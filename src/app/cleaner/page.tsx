"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-store";
import { CleanerApp } from "@/components/cleaner/cleaner-app";

export default function CleanerPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace("/");
    } else if (user.role !== "CLEANER") {
      router.replace(`/${user.role.toLowerCase()}`);
    }
  }, [user, router]);

  if (!user || user.role !== "CLEANER") {
    return null;
  }

  return <CleanerApp />;
}
