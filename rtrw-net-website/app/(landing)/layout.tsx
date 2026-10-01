// app/(landing)/layout.tsx

import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { ArrowUp } from "lucide-react";
import Link from "next/link";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}
