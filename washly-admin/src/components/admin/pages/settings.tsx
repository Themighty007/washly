"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-store";
import { Bell, Building, Globe, Moon, Shield, Mail, MessageSquare, Crown } from "lucide-react";
import { toast } from "sonner";

export function AdminSettingsPage() {
  const { user, logout } = useAuth();

  return (
    <div className="space-y-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building className="h-4 w-4" />
            Organization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Company Name</p>
              <p className="text-xs text-muted-foreground">THE IDROTT Premium Car Care</p>
            </div>
            <Button variant="outline" size="sm">Edit</Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Timezone</p>
              <p className="text-xs text-muted-foreground">Asia/Kolkata (IST)</p>
            </div>
            <Button variant="outline" size="sm">Change</Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Currency</p>
              <p className="text-xs text-muted-foreground">INR (₹)</p>
            </div>
            <Badge variant="secondary">Locked</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">New Booking Alerts</p>
              <p className="text-xs text-muted-foreground">Get notified when a new booking is created</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Missed Wash Alerts</p>
              <p className="text-xs text-muted-foreground">Get notified when a cleaner reports car unavailable</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Payment Reminders</p>
              <p className="text-xs text-muted-foreground">Auto-send monthly payment reminders to customers</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Plan Change Requests</p>
              <p className="text-xs text-muted-foreground">Notify when customers request plan changes</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <Badge variant="secondary">Admin</Badge>
          </div>
          <Separator />
          <Button variant="outline" size="sm" onClick={() => toast.info("Password reset link sent to your email")}>
            <Mail className="h-3.5 w-3.5 mr-1.5" />
            Reset Password
          </Button>
          <Separator />
          <Button variant="outline" size="sm" className="text-red-600" onClick={logout}>
            Sign Out
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-muted/30">
        <CardContent className="p-5 flex items-center gap-3">
          <Crown className="h-5 w-5" style={{ color: "var(--gold)" }} />
          <div className="flex-1">
            <p className="text-sm font-medium">THE IDROTT Premium Plan</p>
            <p className="text-xs text-muted-foreground">Unlimited customers, cleaners, and washes. Premium support included.</p>
          </div>
          <Badge style={{ background: "var(--gold)", color: "white" }} className="border-0">Active</Badge>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        THE IDROTT v1.0 · © 2026 · Built for premium car care operations
      </p>
    </div>
  );
}
