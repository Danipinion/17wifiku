// app/page.tsx
import Contact from "@/components/landing/Contact";
// import Dokumentasi from "@/components/landing/Dokumentasi";
import FAQ from "@/components/landing/FAQ";
import HeroSection from "@/components/landing/HeroSection";
import Pricing from "@/components/landing/Pricing";
import VisiMisi from "@/components/landing/VisiMisi";
import WhyUs from "@/components/landing/WhyUs";
import Promotions from "@/components/landing/Promotions";

export default function Home() {
  return (
    <>
      <HeroSection />
      {/* Wrapper ini penting agar konten di bawah hero section 
        memiliki background solid dan muncul di atas elemen parallax
      */}
      <div className="relative z-[1] bg-slate-900">
        <Promotions />
        <VisiMisi />
        <WhyUs />
        <Pricing />
        {/* <Dokumentasi /> */}
        <FAQ />
        <Contact />
      </div>
    </>
  );
}
