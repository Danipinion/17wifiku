// components/landing/HeroSection.tsx
"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";

// Daftarkan plugin ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

const HeroSection = () => {
  const heroRef = useRef(null);
  const textRef = useRef(null);
  const imageRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Animasi Parallax untuk teks (bergerak lebih lambat dari scroll)
      gsap.to(textRef.current, {
        y: 200, // Bergerak ke bawah 200px
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true, // Efek scrub mengikuti scroll
        },
      });

      // Animasi Parallax untuk gambar (bergerak sedikit ke atas)
      gsap.to(imageRef.current, {
        y: -100,
        scale: 1.1, // Sedikit membesar saat scroll
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }, heroRef);

    return () => ctx.revert(); // Cleanup GSAP
  }, []);

  return (
    <section
      ref={heroRef}
      id="hero"
      className="relative h-screen flex items-center justify-center overflow-hidden bg-blue-950"
    >
      {/* Background Image - Dummy from Unsplash */}
      <div
        ref={imageRef}
        className="absolute inset-0 bg-cover bg-center z-0 opacity-30"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2070&auto=format&fit=crop')",
        }}
      />

      {/* Konten Hero */}
      <div ref={textRef} className="z-10 text-center text-white p-4">
        <h1 className="text-5xl md:text-7xl font-extrabold mb-4 drop-shadow-lg">
          Internet Cepat, Stabil, dan Terjangkau
        </h1>
        <p className="text-lg md:text-2xl mb-8 max-w-3xl mx-auto drop-shadow-md">
          Nikmati koneksi internet tanpa batas untuk kebutuhan streaming,
          gaming, dan kerja dari rumah di lingkungan Anda.
        </p>
        <Link
          href="#why-us"
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-full text-lg transition-transform duration-300 hover:scale-105"
        >
          Lihat Keunggulan Kami
        </Link>
      </div>
    </section>
  );
};

export default HeroSection;
