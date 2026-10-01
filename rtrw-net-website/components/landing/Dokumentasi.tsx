// components/landing/Dokumentasi.tsx
import Image from "next/image";

const images = [
  {
    src: "https://images.unsplash.com/photo-1587573089734-09cb69c0f2b4?q=80&w=2070&auto=format&fit=crop",
    alt: "Instalasi Jaringan",
  },
  {
    src: "https://images.unsplash.com/photo-1563884705074-7c8b15f16295?q=80&w=2070&auto=format&fit=crop",
    alt: "Tim Teknisi",
  },
  {
    src: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=2070&auto=format&fit=crop",
    alt: "Server Room",
  },
  {
    src: "https://images.unsplash.com/photo-1563884705074-7c8b15f16295?q=80&w=1939&auto=format&fit=crop",
    alt: "Pemasangan di Rumah Pelanggan",
  },
];

const Dokumentasi = () => {
  return (
    <section id="dokumentasi" className="py-20">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-4xl font-bold mb-4">Dokumentasi Kegiatan</h2>
        <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
          Beberapa momen dari proses instalasi hingga pemeliharaan jaringan
          kami.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-lg shadow-lg"
            >
              <Image
                src={image.src}
                alt={image.alt}
                width={500}
                height={500}
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500 ease-in-out"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-300"></div>
              <p className="absolute bottom-4 left-4 text-white text-lg font-semibold">
                {image.alt}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Dokumentasi;
