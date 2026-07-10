export interface AspectDefinition {
  code: string;
  label: string;
  helpText: string;
}

export const VERIFICATION_ASPECTS: AspectDefinition[] = [
  { code: 'REQ_ZONING', label: 'Kesesuaian dengan RTRW / RDTR', helpText: 'Memastikan posisi koordinat bidang tanah berada pada peruntukan zona ruang yang tepat (RDTR DKI Jakarta Buku 2 Hal 6).' },
  { code: 'REQ_LEGAL', label: 'Status & Legalitas Kepemilikan Lahan', helpText: 'Validasi dokumen sertifikat tanah (SHM/HGB) asli terdaftar resmi BPN tanpa adanya catatan sengketa.' },
  { code: 'REQ_ACCESS', label: 'Aksesibilitas & Lebar Jalan Utama (ROW)', helpText: 'Uji kesesuaian sirkulasi masuk-keluar kendaraan, lebar jalan, serta pekarangan trotoar pejalan kaki.' },
  { code: 'REQ_DRAINAGE', label: 'Sistem Drainase & Pengendalian Banjir', helpText: 'Audit kelayakan jaringan saluran air hujan internal tapak guna mencegah potensi genangan/banjir.' },
  { code: 'REQ_KDB', label: 'Koefisien Dasar Bangunan (KDB)', helpText: 'Uji rasio tutupan lantai dasar bangunan terhadap luas lahan efektif (Buku 2 Hal 7).' },
  { code: 'REQ_KLB', label: 'Koefisien Lantai Bangunan (KLB)', helpText: 'Uji batas total luas seluruh lantai gedung yang diizinkan (Buku 2 Hal 8).' },
  { code: 'REQ_KDH', label: 'Koefisien Dasar Hijau (KDH)', helpText: 'Uji persentase area pekarangan terbuka penyerapan air alami (Buku 2 Hal 11).' },
  { code: 'REQ_RTH', label: 'Ruang Terbuka Hijau (RTH) Minimum', helpText: 'Kewajiban pemenuhan luasan RTH minimal 20% bagi kawasan perumahan daerah (Buku 2 Hal 11).' },
  { code: 'REQ_GSB', label: 'Garis Sempadan Bangunan (GSB)', helpText: 'Uji jarak mundur fisik dinding bangunan terluar dari as rencana jalan kota (Buku 2 Hal 13).' },
  { code: 'REQ_UTILITY', label: 'Prasarana & Utilitas Kota', helpText: 'Ketersediaan jaringan listrik PLN, gardu penunjang, pembuangan sampah mandiri, dan suplai air minum.' },
  { code: 'REQ_ENV_IMPACT', label: 'Dampak Lingkungan (AMDAL / UKL-UPL)', helpText: 'Penyertaan dokumen kelayakan lingkungan AMDAL resmi untuk kawasan industri/skala besar.' },
  { code: 'REQ_TRAFFIC', label: 'Dampak Lalu Lintas (Andalalin)', helpText: 'Penyertaan surat persetujuan andalalin dari Dishub guna mencegah kemacetan sirkulasi jalan.' },
  { code: 'tech_cemetery', label: 'Penyediaan Lahan TPU / Makam', helpText: 'Kewajiban penyediaan Tempat Pemakaman Umum (TPU) minimal 2% dari luas perumahan atau denda kompensasi.' },
  { code: 'REQ_PSU', label: 'Sarana Utilitas Umum / Fasum / Fasos', helpText: 'Penyediaan sarana ibadah, olahraga, kesehatan, dan penyerahan PSU untuk perumahan.' },
];
