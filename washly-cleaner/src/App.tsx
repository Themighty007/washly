import { useAuth } from "@/lib/auth-store";
import { LoginScreen } from "@/components/shared/login-screen";
import { CleanerApp } from "@/components/cleaner/cleaner-app";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";

export default function App() {
  const { user } = useAuth();
  return (
    <>
      {user && user.role === "CLEANER" ? <CleanerApp /> : <LoginScreen />}
      <SonnerToaster position="top-right" richColors closeButton />
      <Toaster />
    </>
  );
}