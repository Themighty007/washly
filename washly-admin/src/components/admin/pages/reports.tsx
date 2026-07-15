"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileBarChart, FileText, Calendar, Users, CreditCard, AlertTriangle, Clock, IndianRupee, CheckCircle2 } from "lucide-react";
import { exportUrl } from "@/lib/auth-store";

const EXPORT_OPTIONS = [
  { type: "customers", label: "Customers", desc: "All customer profiles, plans, and cars", icon: Users, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30" },
  { type: "cleaners", label: "Cleaners", desc: "Cleaner profiles, ratings, performance", icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30" },
  { type: "revenue", label: "Revenue Report", desc: "All paid payments and transactions", icon: IndianRupee, color: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30" },
  { type: "payments", label: "Payments", desc: "All payment records with status", icon: CreditCard, color: "text-purple-600 bg-purple-50 dark:bg-purple-950/30" },
  { type: "wash-history", label: "Wash History", desc: "All bookings with status and details", icon: FileBarChart, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30" },
  { type: "pending", label: "Pending Washes", desc: "Missed and pending washes", icon: AlertTriangle, color: "text-red-600 bg-red-50 dark:bg-red-950/30" },
  { type: "attendance", label: "Attendance", desc: "Cleaner attendance records", icon: Clock, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30" },
  { type: "monthly-report", label: "Monthly Report", desc: "Comprehensive monthly summary", icon: Calendar, color: "text-brand bg-brand-muted/30" },
  { type: "yearly-report", label: "Yearly Report", desc: "Comprehensive yearly summary", icon: FileText, color: "text-gold bg-amber-50 dark:bg-amber-950/30" },
];

export function AdminReportsPage() {
  function exportData(type: string, format: "csv" | "json") {
    window.open(exportUrl(type, format), "_blank");
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-xl brand-gradient flex items-center justify-center">
              <FileBarChart className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold">Export Center</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Download any dataset as CSV (Excel-compatible) or JSON. Files include all relevant records from your system.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {EXPORT_OPTIONS.map((opt) => (
          <Card key={opt.type} className="hover:shadow-premium transition-all">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${opt.color}`}>
                  <opt.icon className="h-5 w-5" />
                </div>
              </div>
              <h3 className="font-semibold text-sm">{opt.label}</h3>
              <p className="text-xs text-muted-foreground mt-1 mb-4">{opt.desc}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => exportData(opt.type, "csv")}>
                  <Download className="h-3 w-3 mr-1" /> CSV
                </Button>
                <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => exportData(opt.type, "json")}>
                  <FileText className="h-3 w-3 mr-1" /> JSON
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
