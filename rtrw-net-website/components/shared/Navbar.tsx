// components/shared/Navbar.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ArrowUp } from "lucide-react";

const navLinks = [
  { href: "#visi-misi", label: "Visi Misi" },
  { href: "#why-us", label: "Keunggulan" },
  { href: "#faq", label: "FAQ" },
  { href: "#contact", label: "Kontak" },
];

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const navContainerClasses = `fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
    isScrolled ? "pt-2" : "pt-4"
  }`;

  const navClasses = `transition-all duration-300 ease-in-out container mx-auto flex items-center justify-between p-4 ${
    isScrolled
      ? "bg-slate-900/80 backdrop-blur-lg rounded-full shadow-lg max-w-6xl"
      : "bg-transparent"
  }`;

  return (
    <>
      <header className={navContainerClasses}>
        <nav className={navClasses}>
          <Link href="/" className="text-2xl font-bold text-white pl-2">
            Net<span className="text-blue-500">Own</span>
          </Link>

          {/* Desktop Menu */}
          <ul className="hidden md:flex space-x-8 items-center">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="hover:text-blue-400 transition-colors duration-200"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <Link
            href="/login"
            className="hidden md:block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-full transition-all duration-300"
          >
            Login
          </Link>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </nav>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden mt-2 mx-4 rounded-xl shadow-lg bg-slate-800 p-4">
            <ul className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="block py-2 text-center hover:text-blue-400 transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/login"
                  className="block text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-full transition-all duration-300 w-full mt-2"
                >
                  Login
                </Link>
              </li>
            </ul>
          </div>
        )}
      </header>

      {isScrolled && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-opacity duration-300 z-50"
          aria-label="Scroll to top"
        >
          <ArrowUp size={20} />
        </button>
      )}
    </>
  );
};

export default Navbar;
