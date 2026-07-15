import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-store";
import { IdrottLogo } from "@/components/shared/idrott-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Car, Sparkles, Shield, Users, ArrowRight, Eye, EyeOff, Phone, Mail, Lock } from "lucide-react";

const DEMO_ACCOUNTS = [
  { role: "Customer", email: "priya@gmail.com", password: "customer123", name: "Priya Sharma", icon: Users, desc: "Premium plan subscriber" },
];

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const login = useAuth((s) => s.login);

  async function handleLogin(creds?: { email?: string; password?: string }) {
    const emailVal = creds?.email ?? email;
    const passwordVal = creds?.password ?? password;
    if (!emailVal || !passwordVal) {
      toast.error("Please enter email and password");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || "http://192.168.29.243:3000") + "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailVal, password: passwordVal }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Login failed");
        return;
      }
      toast.success(`Welcome back, ${data.user.name.split(" ")[0]}!`);
      login(data.user, data.token);
    } catch (err) {
      console.error(err);
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function quickLogin(acc: typeof DEMO_ACCOUNTS[number]) {
    setEmail(acc.email);
    setPassword(acc.password);
    handleLogin({ email: acc.email, password: acc.password });
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Left: Hero panel */}
      <div className="lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[oklch(0.18_0.02_240)] via-[oklch(0.22_0.04_165)] to-[oklch(0.18_0.02_240)] text-white p-8 lg:p-12 flex flex-col">
        {/* Decorative gradient blobs */}
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-[oklch(0.65_0.13_165)] opacity-20 blur-3xl" />
        <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-[oklch(0.78_0.15_75)] opacity-20 blur-3xl" />

        <div className="relative z-10 flex-1 flex flex-col">
          <IdrottLogo size="md" variant="light" />

          <div className="flex-1 flex flex-col justify-center max-w-md mt-12 lg:mt-0">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-3 py-1 text-xs font-medium mb-6 border border-white/10">
                <Sparkles className="h-3 w-3" />
                Premium car wash ecosystem
              </div>
              <h1 className="text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.1]">
                Wash smarter,
                <br />
                <span className="bg-gradient-to-r from-[oklch(0.78_0.15_75)] to-[oklch(0.65_0.13_165)] bg-clip-text text-transparent">
                  shine brighter.
                </span>
              </h1>
              <p className="mt-5 text-white/70 text-base lg:text-lg leading-relaxed">
                A complete management platform connecting customers, cleaners, and operations — built for subscription-first car wash companies.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-10 grid grid-cols-3 gap-3"
            >
              {[
                { icon: Users, label: "Customers" },
                { icon: Car, label: "Cleaners" },
                { icon: Shield, label: "Admins" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl bg-white/5 border border-white/10 p-3 backdrop-blur">
                  <item.icon className="h-5 w-5 text-white/80 mb-2" />
                  <div className="text-xs font-medium text-white/90">{item.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          <div className="relative z-10 mt-8 text-xs text-white/40">
            © 2026 THE IDROTT. Crafted for premium car care.
          </div>
        </div>
      </div>

      {/* Right: Login form */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-2xl font-semibold tracking-tight mb-1.5">Sign in to your account</h2>
            <p className="text-muted-foreground text-sm mb-8">
              Choose a role below for instant demo access, or enter credentials.
            </p>
          </motion.div>

          <Tabs defaultValue="quick" className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="quick">Quick Demo Access</TabsTrigger>
              <TabsTrigger value="manual">Manual Login</TabsTrigger>
            </TabsList>

            {/* Quick demo login */}
            <TabsContent value="quick" className="mt-5 space-y-3">
              {DEMO_ACCOUNTS.map((acc) => (
                <Card
                  key={acc.role}
                  className="cursor-pointer hover:border-foreground/20 hover:shadow-premium transition-all group"
                  onClick={() => quickLogin(acc)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-11 w-11 rounded-xl bg-muted flex items-center justify-center group-hover:brand-gradient group-hover:text-white transition-all">
                      <acc.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{acc.role}</p>
                        <span className="text-xs text-muted-foreground">·</span>
                        <p className="text-xs text-muted-foreground truncate">{acc.name}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{acc.desc}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-all group-hover:translate-x-0.5" />
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Manual login */}
            <TabsContent value="manual" className="mt-5">
              <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                    <button type="button" className="text-xs text-muted-foreground hover:text-foreground">
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-11"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 brand-gradient text-white hover:opacity-90"
                  size="lg"
                >
                  {loading ? "Signing in..." : "Sign in"}
                  {!loading && <ArrowRight className="ml-1.5 h-4 w-4" />}
                </Button>

                <p className="text-center text-xs text-muted-foreground pt-2">
                  Demo: admin@theidrott.com / admin123 · priya@gmail.com / customer123 · rajesh@theidrott.com / cleaner123
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
