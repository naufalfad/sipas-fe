import { Scale, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompensationTabProps {
  sub: any;
  onShowOnMap?: (komp: any) => void;
}

export const CompensationTab = ({ sub }: CompensationTabProps) => {
  const hasCompensations = sub.compensations && sub.compensations.length > 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-left">
      <div className="border-b border-border pb-2 flex justify-between items-center">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
          <Scale className="h-4.5 w-4.5 text-primary" />
          Kewajiban Mitigasi & Kompensasi Lahan
        </h3>
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Aturan Perbup Bogor</span>
      </div>

      {hasCompensations ? (
        <div className="space-y-5">
          {sub.compensations.map((comp: any) => (
            <div key={comp.id} className="bg-slate-50 border border-border p-4 space-y-4 text-left">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Tipe Kompensasi</span>
                  <span className="text-xs font-bold text-slate-800 block mt-1">
                    {comp.type === 'LAHAN_MAKAM_FISIK' && 'Penyediaan Lahan Pemakaman (Off-Site)'}
                    {comp.type === 'LAHAN_SAWAH' && 'Penggantian Lahan Pertanian Basah (KP2B 1:1)'}
                    {comp.type === 'LAHAN_MAKAM_UANG' && 'Uang Pengganti Lahan Pemakaman'}
                    {comp.type === 'PSU_FISIK_TAMBAHAN' && 'Penyediaan PSU Tambahan Luar Kompleks'}
                  </span>
                </div>
                <span className={cn(
                  "px-2 py-0.5 text-[8px] font-black uppercase tracking-wider border leading-none rounded-none shadow-none",
                  comp.status === 'TERPENUHI' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    comp.status === 'PROSES_VERIFIKASI' ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' :
                      'bg-rose-50 text-rose-700 border-rose-200'
                )}>
                  {comp.status?.replace('_', ' ')}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-1 border-t border-slate-200/50">
                <div>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Luas Kewajiban</span>
                  <span className="text-xs font-bold text-slate-700 block mt-1">{(comp.requiredAreaM2 || 0).toLocaleString('id-ID')} m²</span>
                </div>
                <div>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Nilai Nominal / Denda</span>
                  <span className="text-xs font-bold text-slate-700 block mt-1">
                    {comp.nominalAmount ? `Rp ${comp.nominalAmount.toLocaleString('id-ID')}` : 'N/A (Fisik Lahan)'}
                  </span>
                </div>
                <div>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Metode Pemenuhan</span>
                  <span className="text-xs font-semibold text-slate-700 block mt-1 uppercase text-[10px]">
                    {(comp.fulfillmentMethod || '').replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              <div className="text-xs pt-1.5 border-t border-slate-200/50">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Lokasi Lahan Kompensasi</span>
                <span className="text-xs text-slate-600 block mt-0.5">{comp.locationAddress || '-'}</span>
              </div>

              {comp.documentUrl && (
                <div className="pt-2 flex justify-between items-center text-xs border-t border-slate-200/50">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Bukti Legalitas Dokumen</span>
                  <a
                    href={comp.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 hover:text-emerald-800 hover:underline font-bold flex items-center gap-1 text-[11px]"
                  >
                    Buka Berkas Legalitas
                  </a>
                </div>
              )}
            </div>
          ))}

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
