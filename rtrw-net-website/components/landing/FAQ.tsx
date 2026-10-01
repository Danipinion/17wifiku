// components/landing/FAQ.tsx

const faqItems = [
  {
    question: "Apa saja paket yang tersedia?",
    answer:
      "Kami menyediakan berbagai paket yang bisa disesuaikan dengan kebutuhan Anda, mulai dari paket personal untuk penggunaan ringan hingga paket keluarga untuk streaming dan gaming berat. Silakan hubungi kami untuk info detail.",
  },
  {
    question: "Bagaimana cara mendaftar menjadi pelanggan?",
    answer:
      "Pendaftaran sangat mudah. Anda bisa menghubungi kami melalui WhatsApp atau telepon yang tertera di halaman kontak. Tim kami akan segera menjadwalkan survei dan instalasi di lokasi Anda.",
  },
  {
    question: "Apakah ada batas pemakaian kuota (FUP)?",
    answer:
      "Tidak. Semua paket kami bersifat unlimited tanpa FUP (Fair Usage Policy). Anda bisa menggunakan internet sepuasnya tanpa khawatir kecepatan menurun.",
  },
  {
    question: "Bagaimana jika terjadi gangguan koneksi?",
    answer:
      "Jika Anda mengalami gangguan, segera laporkan melalui dashboard pelanggan atau hubungi tim support kami. Karena tim kami berada di lingkungan yang sama, kami bisa memberikan penanganan yang lebih cepat.",
  },
];

const FAQ = () => {
  return (
    <section id="faq" className="py-20 bg-slate-950">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold">
            Frequently Asked Questions (FAQ)
          </h2>
          <p className="text-lg text-gray-400 mt-4 max-w-2xl mx-auto">
            Jawaban untuk beberapa pertanyaan yang paling sering diajukan.
          </p>
        </div>
        <div className="max-w-3xl mx-auto space-y-4">
          {faqItems.map((item, index) => (
            <details
              key={index}
              className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 group cursor-pointer"
              name="faq-accordion"
            >
              <summary className="flex justify-between items-center font-semibold text-lg list-none">
                {item.question}
                <span className="transform transition-transform duration-300 group-open:rotate-180">
                  +
                </span>
              </summary>
              <p className="text-gray-400 mt-4 leading-relaxed">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
