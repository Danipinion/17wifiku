/**
 * Utility untuk memproses data QRIS (EMVCo)
 * Referensi standar QRIS (Quick Response Code Indonesian Standard)
 */

/**
 * Fungsi untuk generate QRIS Dinamis dari QRIS Statis
 * Menyisipkan nominal ke dalam string QRIS sesuai standar EMVCo (Tag 54)
 */
export function generateDynamicQRIS(staticQRIS: string, amount: number): string {
  // 1. Bersihkan data dasar (buang CRC 4 digit terakhir)
  let baseQRIS = staticQRIS.slice(0, -4);
  
  // 2. Ubah Point of Initiation dari 11 (Static) menjadi 12 (Dynamic)
  // Tag 01 panjang 02 value 11 -> 12
  baseQRIS = baseQRIS.replace("010211", "010212");

  // 3. Siapkan data nominal (Tag 54)
  // Format: Tag(54) + PanjangValue(02) + Value(Jumlah Digit Nominal)
  const amountStr = Math.floor(amount).toString();
  const amountTag = "54" + amountStr.length.toString().padStart(2, '0') + amountStr;
  
  // 4. Penempatan Tag 54 (Nominal) 
  if (baseQRIS.includes("5802360")) {
    baseQRIS = baseQRIS.replace("5802360", amountTag + "5802360");
  } else {
    const index59 = baseQRIS.indexOf("59");
    if (index59 !== -1) {
       baseQRIS = baseQRIS.substring(0, index59) + amountTag + baseQRIS.substring(index59);
    } else {
       baseQRIS += amountTag;
    }
  }

  // 5. Tambahkan Pesan/Referensi (Tag 62) - Opsional
  // Kita sisipkan Invoice ID sebagai referensi agar muncul di mutasi (tergantung bank)
  // Tag 62 -> Subtag 05 (Reference Label)
  const reference = "INV" + Math.floor(amount).toString(); // Contoh referensi pendek
  const tag62Value = "05" + reference.length.toString().padStart(2, '0') + reference;
  const tag62 = "62" + tag62Value.length.toString().padStart(2, '0') + tag62Value;
  
  // Masukkan sebelum CRC (Tag 63)
  baseQRIS += tag62;

  // 6. Hitung ulang CRC16 (Tag 63 panjang 04)
  const fullDataToCrc = baseQRIS + "6304";
  const newCrc = crc16(fullDataToCrc);
  
  return fullDataToCrc + newCrc.toUpperCase();
}

/**
 * Fungsi penghitung CRC16 (ISO 13239)
 * Digunakan untuk validasi data QRIS
 */
function crc16(data: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  return (crc & 0xFFFF).toString(16).padStart(4, '0');
}
