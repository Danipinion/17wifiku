// components/shared/Footer.tsx
import Link from "next/link";
import { Facebook, Instagram, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 pt-12 pb-8">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-xl font-bold mb-4">
              Net<span className="text-blue-500">Own</span>
            </h3>
            <p className="text-gray-400 max-w-md">
              Menyediakan layanan internet yang andal dan terjangkau untuk
              memperkuat konektivitas di lingkungan Anda.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Navigasi</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#why-us"
                  className="text-gray-400 hover:text-blue-400"
                >
                  Keunggulan
                </Link>
              </li>
              <li>
                <Link
                  href="#dokumentasi"
                  className="text-gray-400 hover:text-blue-400"
                >
                  Dokumentasi
                </Link>
              </li>
              <li>
                <Link href="#faq" className="text-gray-400 hover:text-blue-400">
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-gray-400 hover:text-blue-400"
                >
                  Login Pelanggan
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Ikuti Kami</h4>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-blue-400">
                <Facebook size={24} />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400">
                <Instagram size={24} />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400">
                <Twitter size={24} />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-800 pt-6 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Netown. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
