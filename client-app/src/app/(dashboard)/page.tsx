import { db } from "@/db";
import { users, invoices, subscriptions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Wifi,
  AlertCircle,
  Zap,
  ArrowRight,
  TrendingUp,
  Calendar,
  Download,
  Activity,
  ShieldCheck,
  Router,
} from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";
import { getSession } from "@/lib/session";
import { formatCurrency, formatDate } from "@/lib/format";

async function DashboardData() {
  const session = await getSession();
  const userId = session.userId;

  if (!userId) return null;

  try {
    // Fetch user with relations
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: {
        tickets: {
          where: eq(subscriptions.status, "open"),
          limit: 1,
        },
        invoices: {
          where: eq(invoices.status, "unpaid"),
          limit: 1, // Just need to know if there's any
        },
      },
    });

    if (!user) return null;

    // Also fetch latest subscription even if isolated
    const latestSubscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, userId),
      orderBy: [desc(subscriptions.createdAt)],
      with: {
        package: true,
      },
    });

    return { user, latestSubscription };
  } catch (error) {
    console.error("Dashboard Data Error:", error);
    return null;
  }
}

export default async function DashboardPage() {
  const data = await DashboardData();

  if (!data || !data.user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const { user, latestSubscription } = data;

  const firstName = user.name.split(" ")[0];
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? "Good Morning"
      : currentHour < 18
      ? "Good Afternoon"
      : "Good Evening";

  const hasUnpaidInvoice = user.invoices.length > 0;
  // Connection status is based on subscription status.
  const connectionStatus =
    latestSubscription?.status === "isolated" ? "Isolated" : "Online";
  const isOnline = connectionStatus === "Online";

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {greeting}, {firstName}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Here's what's happening with your network today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="hidden md:flex gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20">
            <Download className="w-4 h-4 mr-2" /> Download Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-fade-in-up [animation-delay:100ms]">
        {/* Status Card */}
        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">
              Network Status
            </CardTitle>
            <Activity
              className={clsx(
                "h-4 w-4",
                isOnline ? "text-green-500" : "text-red-500"
              )}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {connectionStatus}
              <span
                className={clsx(
                  "flex h-3 w-3 rounded-full",
                  isOnline ? "bg-green-500" : "bg-red-500"
                )}
              >
                <span
                  className={clsx(
                    "animate-ping absolute inline-flex h-3 w-3 rounded-full opacity-75",
                    isOnline ? "bg-green-400" : "bg-red-400"
                  )}
                ></span>
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isOnline ? "Optimal performance" : "Action required"}
            </p>
          </CardContent>
        </Card>

        {/* Plan Card */}
        <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">
              Current Plan
            </CardTitle>
            <Router className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">
              {latestSubscription?.package.bandwidth || "0 Mbps"}
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {latestSubscription?.package.name || "No Plan"}
            </p>
          </CardContent>
        </Card>

        {/* Balance Card */}
        <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">
              Balance / Unpaid
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {user.balance ? formatCurrency(user.balance) : "Rp 0"}
            </div>
            {hasUnpaidInvoice && (
              <p className="text-xs text-red-500 font-medium mt-1 animate-pulse">
                1 Unpaid Invoice Pending
              </p>
            )}
            {!hasUnpaidInvoice && (
              <p className="text-xs text-muted-foreground mt-1">
                No pending bills
              </p>
            )}
          </CardContent>
        </Card>

        {/* Loyalty Card */}
        <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">
              Nionify Points
            </CardTitle>
            <Zap className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {user.points || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Redeem for discounts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-7 animate-fade-in-up [animation-delay:200ms]">
        {/* Network Detail / Action */}
        <Card className="md:col-span-4 border-none shadow-md overflow-hidden bg-white dark:bg-slate-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-500" />
              Your Network Health
            </CardTitle>
            <CardDescription>
              Real-time monitoring of your connection stability.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {/* Mock Chart Area */}
            <div className="h-[250px] w-full bg-gradient-to-b from-blue-50/50 to-transparent rounded-lg border border-dashed border-blue-200 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 flex items-end justify-between px-4 pb-0 opacity-30">
                {[40, 60, 55, 70, 65, 80, 75, 90, 85, 95].map((h, i) => (
                  <div
                    key={i}
                    className="w-4 bg-blue-500 rounded-t-sm transition-all duration-1000"
                    style={{ height: `${h}%` }}
                  ></div>
                ))}
              </div>
              <div className="z-10 text-center">
                <h4 className="text-3xl font-bold text-blue-600">99.9%</h4>
                <p className="text-sm text-blue-400">Uptime this month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions / Billing */}
        <Card className="md:col-span-3 border-none shadow-md bg-slate-50 dark:bg-slate-900/50">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your account efficiently.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasUnpaidInvoice ? (
              <div className="p-4 rounded-lg bg-red-50 border border-red-100 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-semibold">Attention Needed</span>
                </div>
                <p className="text-sm text-red-600">
                  You have an outstanding invoice that needs to be paid to avoid
                  service interruption.
                </p>
                <Button
                  className="w-full bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/20"
                  asChild
                >
                  <Link href="/bills">
                    Pay Invoice Now <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-green-50 border border-green-100 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-green-900">All caught up!</p>
                  <p className="text-xs text-green-700">No pending payments.</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2 hover:border-blue-500 hover:bg-blue-50 transition-all"
                asChild
              >
                <Link href="/support">
                  <LifeBuoy className="h-6 w-6 text-slate-500" />
                  <span className="text-xs font-medium">Get Support</span>
                </Link>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2 hover:border-blue-500 hover:bg-blue-50 transition-all"
                asChild
              >
                <Link href="/profile">
                  <Zap className="h-6 w-6 text-slate-500" />
                  <span className="text-xs font-medium">Refer Friend</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
