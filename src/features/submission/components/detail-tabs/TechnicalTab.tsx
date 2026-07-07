import { Award } from 'lucide-react';

interface TechnicalTabProps {
  sub: any;
}

export const TechnicalTab = ({ sub }: TechnicalTabProps) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-left">
      <h3 className="text-xs font-bold text-slate-800 border-b border-border pb-2 uppercase tracking-wide mb-4 flex items-center gap-1.5">
        <Award className="h-4.5 w-4.5 text-primary" />
        Parameter Teknis Kategori: {sub.submissionDetails?.category || 'PERUMAHAN'}
      </h3>

      {/* Sandingan Metrik Tiga Sisi (Read-Only) */}
      <div className="space-y-2 text-left mb-6">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
          Sandingan Metrik Tiga Sisi (Proposed vs Bylaws vs Verified)
        </span>
        <div className="overflow-x-auto border border-border">
          <table className="min-w-full divide-y divide-border text-[11px] font-sans">
            <thead className="bg-slate-50 font-bold text-slate-500 text-left">
              <tr>
                <th className="px-3 py-2 border-r border-border">Parameter</th>
                <th className="px-3 py-2 border-r border-border">Proposed (Pemohon)</th>
                <th className="px-3 py-2 border-r border-border">Bylaws (Aturan Perda)</th>
                <th className="px-3 py-2">Verified (Hasil Dinas)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white text-slate-700">
              <tr>
                <td className="px-3 py-2 border-r border-border font-semibold">KDB (Koefisien Dasar Bangunan)</td>
                <td className="px-3 py-2 border-r border-border font-mono">
                  {sub.technical?.applicantBuildingArea ? `${sub.technical.applicantBuildingArea.toLocaleString('id-ID')} m²` : '-'}
                  {sub.landArea && sub.technical?.applicantBuildingArea ? ` (${((sub.technical.applicantBuildingArea / sub.landArea) * 100).toFixed(1)}%)` : ''}
                </td>
                <td className="px-3 py-2 border-r border-border text-slate-500 font-medium">Maks {sub.bylawMaxKdb || 60}%</td>
                <td className="px-3 py-2 font-mono font-bold text-teal-700">{sub.verifiedKdb !== undefined && sub.verifiedKdb !== null ? `${sub.verifiedKdb}%` : '-'}</td>
              </tr>
              <tr>
                <td className="px-3 py-2 border-r border-border font-semibold">KLB (Koefisien Lantai Bangunan)</td>
                <td className="px-3 py-2 border-r border-border font-mono">{sub.technical?.klb || '-'}</td>
                <td className="px-3 py-2 border-r border-border text-slate-500 font-medium">Maks {sub.bylawMaxKlb || 3.5}</td>
                <td className="px-3 py-2 font-mono font-bold text-teal-700">{sub.verifiedKlb !== undefined && sub.verifiedKlb !== null ? sub.verifiedKlb : '-'}</td>
              </tr>
              <tr>
                <td className="px-3 py-2 border-r border-border font-semibold">KDH (Koefisien Dasar Hijau)</td>
                <td className="px-3 py-2 border-r border-border font-mono">{sub.technical?.kdh ? `${sub.technical.kdh}%` : '-'}</td>
                <td className="px-3 py-2 border-r border-border text-slate-500 font-medium">Min {sub.bylawMinKdh || 10}%</td>
                <td className="px-3 py-2 font-mono font-bold text-teal-700">{sub.verifiedKdh !== undefined && sub.verifiedKdh !== null ? `${sub.verifiedKdh}%` : '-'}</td>
              </tr>
              <tr>
                <td className="px-3 py-2 border-r border-border font-semibold">GSB (Garis Sempadan Bangunan)</td>
                <td className="px-3 py-2 border-r border-border font-mono">{sub.technical?.applicantGsb ? `${sub.technical.applicantGsb} m` : '-'}</td>
                <td className="px-3 py-2 border-r border-border text-slate-500 font-medium">Min {sub.bylawMinGsb || 5} m</td>
                <td className="px-3 py-2 font-mono font-bold text-teal-700">{sub.verifiedGsb !== undefined && sub.verifiedGsb !== null ? `${sub.verifiedGsb} m` : '-'}</td>
              </tr>
              <tr>
                <td className="px-3 py-2 border-r border-border font-semibold">RTH (Ruang Terbuka Hijau)</td>
                <td className="px-3 py-2 border-r border-border font-mono">
                  {sub.technical?.applicantRthArea ? `${sub.technical.applicantRthArea.toLocaleString('id-ID')} m²` : '-'}
                  {sub.landArea && sub.technical?.applicantRthArea ? ` (${((sub.technical.applicantRthArea / sub.landArea) * 100).toFixed(1)}%)` : ''}
                </td>
                <td className="px-3 py-2 border-r border-border text-slate-500 font-medium">Min {sub.bylawMinRthArea || 1400} m² (10%)</td>
                <td className="px-3 py-2 font-mono font-bold text-teal-700">{sub.verifiedRthArea !== undefined && sub.verifiedRthArea !== null ? `${sub.verifiedRthArea.toLocaleString('id-ID')} m²` : '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Rendering kondisional parameter berdasarkan kategori aktual permohonan */}
      {(!sub.submissionDetails?.category || sub.submissionDetails.category === 'PERUMAHAN') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Jumlah Unit Kaveling Rencana</span>
            <span className="text-xs font-bold text-slate-700 block">{sub.technical?.lotCount ? `${sub.technical.lotCount} unit` : '-'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Jenis Segmen Hunian</span>
            <span className="text-xs font-bold text-slate-700 block">{sub.technical?.housingType || '-'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Luas Pemakaman Wajib (m²)</span>
            <span className="text-xs font-bold text-slate-700 block">{sub.technical?.cemeteryArea ? `${sub.technical.cemeteryArea.toLocaleString('id-ID')} m²` : '-'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Sistem Air Bersih Tapak</span>
            <span className="text-xs font-bold text-slate-700 block">{sub.technical?.waterSystem || '-'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Lebar Ruas Jalan Utama (ROW)</span>
            <span className="text-xs font-bold text-slate-700 block">{sub.technical?.roadRowMain || '-'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Lebar Ruas Jalan Lingkungan (ROW)</span>
            <span className="text-xs font-bold text-slate-700 block">{sub.technical?.roadRowLocal || '-'}</span>
          </div>
        </div>
      )}

      {sub.submissionDetails?.category === 'NON_PERUMAHAN' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Jumlah Blok / Tower Gedung</span>
            <span className="text-xs font-bold text-slate-700 block">{sub.technical?.buildingBlocks ? `${sub.technical.buildingBlocks} blok` : '-'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Koefisien Dasar Bangunan (KDB)</span>
            <span className="text-xs font-bold text-slate-700 block">{sub.technical?.kdb ? `${sub.technical.kdb} %` : '-'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Koefisien Lantai Bangunan (KLB)</span>
            <span className="text-xs font-bold text-slate-700 block">{sub.technical?.klb || '-'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Koefisien Dasar Hijau (KDH)</span>
            <span className="text-xs font-bold text-slate-700 block">{sub.technical?.kdh ? `${sub.technical.kdh} %` : '-'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Kapasitas Tempat Parkir (SRP)</span>
            <span className="text-xs font-bold text-slate-700 block">{sub.technical?.parkingCapacity ? `${sub.technical.parkingCapacity} satuan` : '-'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Jumlah Lantai Maksimal Rencana</span>
            <span className="text-xs font-bold text-slate-700 block">{sub.technical?.maxFloors ? `${sub.technical.maxFloors} lantai` : '-'}</span>
          </div>
          <div className="md:col-span-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Total Luas Lantai Keseluruhan (GFA)</span>
            <span className="text-xs font-bold text-slate-700 block">{sub.technical?.totalFloorArea ? `${sub.technical.totalFloorArea.toLocaleString('id-ID')} m²` : '-'}</span>
          </div>
        </div>
      )}

      {sub.submissionDetails?.category === 'FASUM' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Jenis Layanan Fasilitas Umum</span>
            <span className="text-xs font-bold text-slate-700 block">{sub.technical?.facilityType || '-'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Kapasitas Daya Tampung Orang</span>
            <span className="text-xs font-bold text-slate-700 block">{sub.technical?.capacity ? `${sub.technical.capacity.toLocaleString('id-ID')} orang` : '-'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Sarana Proteksi Kebakaran</span>
            <span className="text-xs font-bold text-slate-700 block">{sub.technical?.fireProtection || '-'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Aksesibilitas Difabel</span>
            <span className="text-xs font-bold text-slate-700 block">{sub.technical?.disabledAccess || '-'}</span>
          </div>
          <div className="md:col-span-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Sarana Parkir Khusus (Ambulans / Bus Sekolah)</span>
            <span className="text-xs font-semibold text-slate-600 block">{sub.technical?.specialParking || '-'}</span>
          </div>
        </div>
      )}

      {sub.submissionDetails?.category === 'INDUSTRI' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Jumlah Unit Gudang Rencana</span>
            <span className="text-xs font-bold text-slate-700 block">{sub.technical?.warehouseCount ? `${sub.technical.warehouseCount} unit` : '-'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Muatan Sumbu Terberat Jalan (MST)</span>
            <span className="text-xs font-bold text-slate-700 block">{sub.technical?.roadLoadMst || '-'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Daya Listrik Terpasang (kVA)</span>
            <span className="text-xs font-bold text-slate-700 block">{sub.technical?.electricityPower || '-'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Kapasitas IPAL / WWTP Industri</span>
            <span className="text-xs font-bold text-slate-700 block">{sub.technical?.ipalCapacity || '-'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Luas Penyangga Hijau (Green Buffer)</span>
            <span className="text-xs font-bold text-slate-700 block">{sub.technical?.greenBufferArea ? `${sub.technical.greenBufferArea.toLocaleString('id-ID')} m²` : '-'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Penyediaan TPS LImbah B3</span>
            <span className="text-xs font-semibold text-slate-600 block">{sub.technical?.tpsB3Provision || '-'}</span>
          </div>
        </div>
      )}
    </div>
  );
};
