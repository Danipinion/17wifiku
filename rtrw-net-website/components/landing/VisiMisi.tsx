// components/landing/VisiMisi.tsx
import { Target, Eye } from "lucide-react";

const VisiMisi = () => {
  return (
    <section id="visi-misi" className="py-20">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Visi */}
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
              <Eye className="text-blue-500" size={40} />
              <h2 className="text-3xl font-bold">Visi Kami</h2>
            </div>
            <p className="text-gray-400 text-lg">
              Menjadi pilar utama konektivitas digital di setiap lingkungan,
              memastikan setiap rumah tangga dapat mengakses internet yang
              cepat, stabil, dan terjangkau untuk mendukung pendidikan,
              pekerjaan, dan hiburan.
            </p>
          </div>
          {/* Misi */}
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
              <Target className="text-blue-500" size={40} />
              <h2 className="text-3xl font-bold">Misi Kami</h2>
            </div>
            <ul className="list-disc list-inside text-gray-400 text-lg space-y-2 text-left">
              <li>
                Membangun dan memelihara infrastruktur jaringan yang andal.
              </li>
              <li>Memberikan layanan pelanggan yang responsif dan solutif.</li>
              <li>
                Menawarkan paket internet dengan harga kompetitif tanpa
                mengurangi kualitas.
              </li>
              <li>
                Berkontribusi aktif dalam literasi digital masyarakat sekitar.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VisiMisi;
