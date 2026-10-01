// components/landing/WhyUs.tsx

// Anda bisa menggunakan library ikon seperti lucide-react
// npm install lucide-react
import { Wifi, Zap, ShieldCheck, LifeBuoy } from "lucide-react";

const features = [
  {
    icon: <Zap size={40} className="text-blue-400" />,
    title: "Kecepatan Tinggi & Stabil",
    description:
      "Nikmati streaming video 4K dan gaming online tanpa lag dengan infrastruktur fiber optik kami.",
  },
  {
    icon: <ShieldCheck size={40} className="text-blue-400" />,
    title: "Jaringan Aman & Handal",
    description:
      "Kami memprioritaskan keamanan jaringan untuk melindungi data dan privasi Anda saat berselancar.",
  },
  {
    icon: <LifeBuoy size={40} className="text-blue-400" />,
    title: "Dukungan Teknis Cepat",
    description:
      "Tim teknisi lokal kami siap membantu mengatasi kendala koneksi Anda dengan responsif.",
  },
  {
    icon: <Wifi size={40} className="text-blue-400" />,
    title: "Tanpa Batas Kuota (FUP)",
    description:
      "Gunakan internet sepuasnya tanpa perlu khawatir kehabisan kuota atau penurunan kecepatan.",
  },
];

const WhyUs = () => {
  return (
    <section id="why-us" className="py-20 bg-gray-800">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-4xl font-bold mb-4">Kenapa Memilih Kami?</h2>
        <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
          Kami bukan hanya penyedia internet, tapi tetangga Anda yang peduli
          dengan kualitas koneksi Anda.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-gray-900 p-8 rounded-xl shadow-lg transform hover:-translate-y-2 transition-transform duration-300"
            >
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-900/50 mx-auto mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyUs;
