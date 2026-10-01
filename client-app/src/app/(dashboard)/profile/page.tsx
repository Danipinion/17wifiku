import { Suspense } from "react";
import { getReferralData } from "@/actions/referral";
import { ReferralDashboard } from "@/components/modules/referral/referral-dashboard";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Profile & Referrals - Nionify",
  description: "Manage your profile and invite friends.",
};

export default async function ProfilePage() {
  const data = await getReferralData();

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Refer & Earn</h1>
        <p className="text-muted-foreground">
          Invite friends and save on your internet bill.
        </p>
      </div>

      <Suspense fallback={<ReferralSkeleton />}>
        <ReferralDashboard data={data} />
      </Suspense>
    </div>
  );
}

function ReferralSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
