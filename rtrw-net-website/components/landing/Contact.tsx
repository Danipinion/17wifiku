// components/landing/Contact.tsx
import { MapPin, Phone } from "lucide-react";

const Contact = () => {
  return (
    <section id="contact" className="py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold">Hubungi Kami</h2>
          <p className="text-lg text-gray-400 mt-4 max-w-2xl mx-auto">
            Punya pertanyaan atau siap untuk berlangganan? Jangan ragu untuk
            menghubungi kami.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center max-w-3xl mx-auto">
          {/* Phone */}
          <div className="bg-slate-800/50 p-8 rounded-lg border border-slate-700">
            <Phone size={40} className="mx-auto text-blue-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Telepon & WhatsApp</h3>
            <a
              href="https://wa.me/62898808475151"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-blue-400 text-lg"
            >
              +62 898-8084-75151
            </a>
          </div>
          {/* Address */}
          <div className="bg-slate-800/50 p-8 rounded-lg border border-slate-700">
            <MapPin size={40} className="mx-auto text-blue-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Lokasi</h3>
            <p className="text-gray-300 text-lg">
              Jl. Raya Dungus, RT.31/RW.12, Beketok, Banjarsari Kulon, Kec.
              Dagangan, Kabupaten Madiun
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
