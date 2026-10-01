import { Suspense } from "react";
import { fetchReferrals } from "../actions";
import ReferralClient from "./_components/ReferralClient";

export default async function ReferralPage({
  searchParams,
}: {
  searchParams: { query?: string; status?: string; page?: string };
}) {
  const query = searchParams?.query || "";
  const status = searchParams?.status || "";
  const page = Number(searchParams?.page) || 1;

  const { referrals, hasMore } = await fetchReferrals({ query, status, page });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Manajemen Referral</h2>
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <ReferralClient initialData={referrals} hasMore={hasMore} />
      </Suspense>
    </div>
  );
}
