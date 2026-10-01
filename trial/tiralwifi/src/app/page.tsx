import { Suspense } from "react";

import { ClaimForm } from "./ClaimForm";

export default function ClaimPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const mac = searchParams?.mac || null;
  const ip = searchParams?.ip || null;

  const fallbackUI = (
    <main className="relative min-h-screen bg-black flex items-center justify-center p-4">
      <div className="relative z-10 text-white text-2xl font-semibold">
        Menyiapkan koneksi...
      </div>
    </main>
  );

  return (
    <Suspense fallback={fallbackUI}>
      <ClaimForm mac={mac} ip={ip} />
    </Suspense>
  );
}
