import { Layers, Map } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SitePlanListPage() {
  return (
    <div className="space-y-6 font-sans">

      {/* ─── SEKSI 1: HEADER HALAMAN ─── */}
      <div className="text-left select-none">
        <h1 className="text-2xl font-bold text-[#111D13] leading-none">
          Daftar Site Plan Resmi
        </h1>
        <p className="text-xs text-slate-500 mt-2">
          Daftar seluruh dokumen Site Plan Kabupaten Bogor yang telah disetujui, direvisi, maupun sedang dalam proses verifikasi spasial.
        </p>
      </div>

      {/* ─── SEKSI 2: KARTU INTEGRASI GIS (CENTRAL ACTION CARD) ─── */}
      {/* Dibungkus ke dalam kontainer putih tegas untuk kedalaman visual yang kuat */}
      <div className="max-w-xl mx-auto bg-white border border-border p-8 shadow-[1px_1px_3px_rgba(0,0,0,0.015)] flex flex-col items-center text-center rounded-none mt-12">

        {/* Ikon Indikator dengan Soft Celadon Background */}
        <div className="p-4 bg-accent/30 text-primary border border-primary/20 mb-5 rounded-none">
          <Layers className="h-8 w-8 stroke-[2.2]" />
        </div>

        {/* Judul & Deskripsi dengan Kontras Terkalibrasi (Carbon Black) */}
        <h3 className="text-sm font-bold text-[#111D13] mb-1.5 uppercase tracking-wide">
          Data Spasial Site Plan
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mb-6 leading-relaxed">
          Sistem GEOSIPAS mengintegrasikan seluruh data site plan resmi Kabupaten Bogor secara spasial. Anda dapat melakukan filter pencarian berkas atau meninjau sebaran koordinat langsung di peta GIS.
        </p>

        {/* Baris Tombol Aksi Taktis (Ramping, Siku Kaku, Hunter Green) */}
        <div className="flex gap-3 select-none">
          <button
            onClick={() => window.alert('Membuka laci penyaringan lanjut…')}
            className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-[#111D13] text-xs font-bold border border-border transition-all rounded-none cursor-pointer outline-none"
          >
            Saring Site Plan
          </button>

          <Link
            to="/gis"
            className="px-4 py-2 bg-primary hover:opacity-90 text-white text-xs font-bold transition-all rounded-none flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(65,93,67,0.15)] border border-primary cursor-pointer outline-none"
          >
            <Map className="h-3.5 w-3.5" />
            Buka GIS Viewer
          </Link>
        </div>

      </div>
    </div>
  );
}