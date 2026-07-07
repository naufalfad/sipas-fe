import { Scale, Globe, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LahanKompensasi } from '@/app/store/useGisUIStore';

// ─── MOCK DATA LAHAN KOMPENSASI DAERAH ───
const mockKompensasiList: LahanKompensasi[] = [
  {
    idKompensasi: 'komp-101',
    idPermohonan: 'sub-1', // Terkait permohonan PT Maju Jaya Sentosa
    tipeKompensasi: 'LAHAN_MAKAM_FISIK',
    luasKompensasiM2: 500,
    statusPemenuhan: 'PROSES_VERIFIKASI',
    polygon: [
      [-6.5940, 106.8155],
      [-6.5940, 106.8160],
      [-6.5945, 106.8160],
      [-6.5945, 106.8155],
      [-6.5940, 106.8155]
    ],
    buktiLegalitasUrl: '#',
  },
  {
    idKompensasi: 'komp-102',
    idPermohonan: 'sub-5', // Terkait permohonan Batu Tulis Residence (Ditolak)
    tipeKompensasi: 'LAHAN_SAWAH',
    luasKompensasiM2: 12000,
    statusPemenuhan: 'BELUM_TERPENUHI',
    polygon: [
      [-6.6010, 106.8055],
      [-6.6010, 106.8065],
      [-6.6025, 106.8065],
      [-6.6025, 106.8055],
      [-6.6010, 106.8055]
    ],
    buktiLegalitasUrl: '#',
  },
  {
    idKompensasi: 'komp-103',
    idPermohonan: 'sub-3',
    tipeKompensasi: 'LAHAN_SAWAH',
    luasKompensasiM2: 12000,
    statusPemenuhan: 'BELUM_TERPENUHI',
    polygon: [
      [-6.6210, 106.8110],
      [-6.6210, 106.8120],
      [-6.6220, 106.8120],
      [-6.6220, 106.8110],
      [-6.6210, 106.8110]
    ],
    buktiLegalitasUrl: undefined,
  }
];

interface CompensationTabProps {
  sub: any;
  onShowOnMap: (komp: LahanKompensasi) => void;
}

export const CompensationTab = ({ sub, onShowOnMap }: CompensationTabProps) => {
  const associatedKompensasi = mockKompensasiList.find(k => k.idPermohonan === sub.id) || null;

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-left">
      <div className="border-b border-border pb-2 flex justify-between items-center">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
          <Scale className="h-4.5 w-4.5 text-primary" />
          Kewajiban Mitigasi & Kompensasi Lahan
        </h3>
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Aturan Perbup Bogor</span>
      </div>

      {associatedKompensasi ? (
        <div className="space-y-5">
          <div className="bg-slate-50 border border-border p-4 space-y-4 text-left">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Tipe Kompensasi</span>
                <span className="text-xs font-bold text-slate-800 block mt-1">
                  {associatedKompensasi.tipeKompensasi === 'LAHAN_MAKAM_FISIK' && 'Penyediaan Lahan Pemakaman (TPU 2%)'}
                  {associatedKompensasi.tipeKompensasi === 'LAHAN_SAWAH' && 'Penggantian Lahan Pertanian Basah (KP2B 1:1)'}
                  {associatedKompensasi.tipeKompensasi === 'LAHAN_MAKAM_UANG' && 'Uang Pengganti Lahan Pemakaman'}
                  {associatedKompensasi.tipeKompensasi === 'PSU_FISIK_TAMBAHAN' && 'Penyediaan PSU Tambahan Luar Kompleks'}
                </span>
              </div>
              <span className={cn(
                "px-2 py-0.5 text-[8px] font-black uppercase tracking-wider border leading-none rounded-none shadow-none",
                associatedKompensasi.statusPemenuhan === 'TERPENUHI' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  associatedKompensasi.statusPemenuhan === 'PROSES_VERIFIKASI' ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' :
                    'bg-rose-50 text-rose-700 border-rose-200'
              )}>
                {associatedKompensasi.statusPemenuhan.replace('_', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs pt-1 border-t border-slate-200/50">
              <div>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Luas Kewajiban</span>
                <span className="text-xs font-bold text-slate-700 block mt-1">{associatedKompensasi.luasKompensasiM2.toLocaleString('id-ID')} m²</span>
              </div>
              <div>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Nilai Nominal Pengganti</span>
                <span className="text-xs font-bold text-slate-700 block mt-1">
                  {associatedKompensasi.nilaiNominal ? `Rp ${associatedKompensasi.nilaiNominal.toLocaleString('id-ID')}` : 'N/A (Fisik Lahan)'}
                </span>
              </div>
            </div>

            {/* Tombol Terapkan to Map GIS */}
            {associatedKompensasi.polygon && associatedKompensasi.polygon.length >= 3 && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onShowOnMap(associatedKompensasi)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 font-black text-[9px] uppercase tracking-widest border border-teal-200 transition-colors cursor-pointer outline-none rounded-none"
                >
                  <Globe size={11} />
                  Plotting Lahan Pengganti Di Peta
                </button>
              </div>
            )}
          </div>

          <div className="p-4 bg-amber-50/40 border border-amber-200 text-left flex items-start gap-2.5">
            <AlertTriangle className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h5 className="text-[10px] font-bold text-amber-800 uppercase tracking-wide">Aturan Pemenuhan Jaminan</h5>
              <p className="text-[10px] text-amber-700 leading-relaxed text-justify">
                Berdasarkan keputusan rapat komite tim teknis, izin site plan baru hanya dapat disahkan apabila status kompensasi fisik telah dinyatakan 'TERPENUHI' atau memiliki jaminan bank yang sah.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-xs text-slate-400 select-none">
          Permohonan ini bebas dari kewajiban kompensasi khusus lahan makam atau sawah produktif.
        </div>
      )}
    </div>
  );
};
