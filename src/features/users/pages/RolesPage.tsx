import { useAuthStore } from '@/app/store/useAuthStore';
import { normalizeRole } from '@/components/auth/ProtectedRoute';
import {
  ShieldAlert,
  ShieldCheck,
  Check,
  Lock,
  HelpCircle,
  Shield
} from 'lucide-react';

export default function RolesPage() {
  const { user } = useAuthStore();
  const activeRole = user ? normalizeRole(user.role) : 'Super Admin';

  // Matriks Otoritas Tingkatan Hak Akses GEOSIPAS sesuai Perbup Bogor No. 4 Tahun 2025
  const rolesMatrix = [
    { role: 'Super Admin', desc: 'Pemegang kunci utama seluruh sistem. Berwenang penuh mengelola data referensi dan otorisasi peran.', scope: 'Semua Modul (Full Access)', status: 'Sistem Kunci' },
    { role: 'Kepala Bidang', desc: 'Pejabat penanggung jawab tertinggi pengesahan. Berwenang memberikan persetujuan akhir & menerbitkan SK.', scope: 'Modul Approval & Laporan', status: 'Aktif' },
    { role: 'Tim Teknis', desc: 'Pakar geospasial dinas. Berwenang menguji gambar CAD dan menganalisis benturan sempadan spasial.', scope: 'Modul GIS & Verifikasi Teknis', status: 'Aktif' },
    { role: 'Admin SIPAS', desc: 'Verifikator administratif dinas. Memeriksa validitas sertifikat tanah dan dokumen pendukung.', scope: 'Modul Verifikasi Admin & Laporan', status: 'Aktif' },
    { role: 'Pemohon', desc: 'Pihak pengembang (developer). Berwenang mengirim draf berkas dan meninjau peta tata ruang wilayah.', scope: 'Modul Pengajuan & GIS Viewer', status: 'Aktif' },
  ];

  return (
    <div className="space-y-6 font-sans">

      {/* ─── SEKSI 1: HEADER HALAMAN ─── */}
      <div className="text-left select-none">
        <h1 className="text-2xl font-bold text-[#111D13] leading-none flex items-center gap-2.5">
          <ShieldAlert className="h-6 w-6 text-primary" />
          Manajemen Hak Akses & Matriks Otoritas
        </h1>
        <p className="text-xs text-slate-500 mt-2">
          Konfigurasi pembagian tingkat wewenang pengguna dan cakupan akses fitur berdasarkan hak otorisasi dinas.
        </p>
      </div>

      {/* ─── SEKSI 2: WORKSPACE SPLIT (GRID DATA MATRIKS & PANDUAN OTORITAS) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Kolom Kiri (2/3): Tabel Matriks Otoritas Hak Akses */}
        <div className="lg:col-span-2 bg-white border border-border p-5 space-y-5 shadow-[1px_1px_3px_rgba(0,0,0,0.015)] rounded-none">
          <div className="flex justify-between items-center border-b border-border/60 pb-3">
            <div className="text-left">
              <h3 className="text-sm font-bold text-slate-800">Matriks Kebijakan Peran (Roles Matrix)</h3>
              <p className="text-[10px] text-slate-400 mt-1">Pemetaan pembagian tugas administratif dan teknis untuk mencegah tumpang tindih otorisasi.</p>
            </div>
            <ShieldCheck className="h-4.5 w-4.5 text-primary" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-border text-slate-500 text-[10px] font-bold uppercase tracking-normal">
                  <th className="px-4 py-3">Tingkat Peran</th>
                  <th className="px-4 py-3">Deskripsi Otoritas Modul</th>
                  <th className="px-4 py-3">Cakupan Modul</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {rolesMatrix.map((matrix, idx) => {
                  const isActiveRole = normalizeRole(matrix.role) === normalizeRole(activeRole);
                  return (
                    <tr
                      key={idx}
                      className={`transition-colors ${
                        isActiveRole 
                          ? 'bg-[#e8f2ea]/40 border-l-2 border-primary font-bold' 
                          : 'hover:bg-slate-50/40'
                      }`}
                    >
                    {/* Tingkat Peran */}
                    <td className="px-4 py-3.5 font-bold text-slate-800 text-left">
                      <div className="flex items-center space-x-1.5 text-slate-800">
                        <Shield className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{matrix.role}</span>
                      </div>
                    </td>

                    {/* Deskripsi Otoritas */}
                    <td className="px-4 py-3.5 text-left text-slate-500 leading-relaxed max-w-xs whitespace-normal break-words">
                      {matrix.desc}
                    </td>

                    {/* Cakupan Modul */}
                    <td className="px-4 py-3.5 text-left font-semibold text-slate-600">
                      {matrix.scope}
                    </td>

                    {/* Status Peran */}
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-none text-[9px] font-bold border leading-none ${matrix.status === 'Sistem Kunci'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-[#e8f2ea] text-[#415D43] border border-[#A1CCA5]/60'
                        }`}>
                        {matrix.status}
                      </span>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Kolom Kanan (1/3): Panduan Kebijakan Otoritas Pengguna */}
        <div className="space-y-6 text-left select-none">

          {/* Kebijakan Otoritas Resmi Card */}
          <div className="bg-white border border-border p-5 rounded-none shadow-[1px_1px_3px_rgba(0,0,0,0.015)] space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Kebijakan Hak Otorisasi</h3>
              <p className="text-[10px] text-slate-400 mt-1">Aturan standar keamanan penegakan kredensial peran.</p>
            </div>

            <div className="space-y-3.5 pt-1">
              <div className="border-l-2 border-[#709775] pl-3 py-0.5 space-y-1">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 leading-none">
                  <Lock className="h-3.5 w-3.5 text-primary shrink-0" />
                  Prinsip Least Privilege
                </h4>
                <p className="text-[10px] text-slate-500 leading-normal text-justify">
                  Setiap pengguna diberikan tingkat wewenang paling minimal yang diperlukan untuk menyelesaikan tugas administratif mereka guna meminimalkan celah kebocoran data.
                </p>
              </div>

              <div className="border-l-2 border-[#415D43] pl-3 py-0.5 space-y-1">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 leading-none">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                  Segregation of Duties (SoD)
                </h4>
                <p className="text-[10px] text-slate-500 leading-normal text-justify">
                  Seseorang yang memproses pemeriksaan berkas (Admin SIPAS) dilarang keras merangkap wewenang sebagai penandatangan pengesahan SK (Kepala Bidang) untuk menjamin akuntabilitas bebas korupsi.
                </p>
              </div>
            </div>
          </div>

          {/* Tanya Jawab Teknis Box */}
          <div className="p-4 bg-slate-50 border border-border flex items-start gap-2.5">
            <HelpCircle className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Butuh Perubahan Hak?</h5>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Penambahan tingkat peran baru atau penyesuaian fungsionalitas modul menu hanya dapat diubah oleh pemilik tingkat peran **Super Admin** melalui berkas konfigurasi internal pengembang.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}