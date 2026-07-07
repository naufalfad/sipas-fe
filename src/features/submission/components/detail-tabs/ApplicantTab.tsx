import { User, Phone, Mail, HardHat } from 'lucide-react';

interface ApplicantTabProps {
  sub: any;
}

export const ApplicantTab = ({ sub }: ApplicantTabProps) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h3 className="text-xs font-bold text-slate-800 border-b border-border pb-2 uppercase tracking-wide mb-4 flex items-center gap-1.5 text-left">
          <User className="h-4.5 w-4.5 text-primary" />
          Profil Pemohon / Pengaju
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-xs text-left">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Tipe Pemohon</span>
            <span className="text-xs font-bold text-slate-700 block">
              {sub.applicant?.type === 'BADAN_USAHA' ? 'Badan Usaha (PT / CV)' : 'Perorangan'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Nama Pemohon / Perusahaan</span>
            <span className="text-xs font-bold text-slate-700 block">{sub.applicant?.name || sub.developerName}</span>
          </div>
          {sub.applicant?.type === 'BADAN_USAHA' ? (
            <>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">NIB Perusahaan</span>
                <span className="text-xs font-mono font-bold text-slate-700 flex items-center gap-2">
                  <span>{sub.applicant?.nib || '-'}</span>
                  {sub.document?.nibDoc && (
                    <a
                      href={sub.document.nibDoc}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-bold text-primary hover:underline"
                    >
                      [Lihat Scan NIB]
                    </a>
                  )}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Nama Direktur / Penanggung Jawab</span>
                <span className="text-xs font-bold text-slate-700 block">{sub.applicant?.directorName || '-'}</span>
              </div>
            </>
          ) : (
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Nomor NIK Pemohon</span>
              <span className="text-xs font-mono font-bold text-slate-700 flex items-center gap-2">
                <span>{sub.applicant?.nik || '-'}</span>
                {sub.document?.ktpDoc && (
                  <a
                    href={sub.document.ktpDoc}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] font-bold text-primary hover:underline"
                  >
                    [Lihat Scan KTP]
                  </a>
                )}
              </span>
            </div>
          )}
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">NPWP Wajib Pajak</span>
            <span className="text-xs font-mono font-bold text-slate-700 block">{sub.applicant?.npwp || '-'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Nomor Telepon Kontak</span>
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1 mt-0.5">
              <Phone className="h-3.5 w-3.5 text-slate-400" />
              {sub.applicant?.phone || '-'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Email Resmi</span>
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1 mt-0.5">
              <Mail className="h-3.5 w-3.5 text-slate-400" />
              {sub.applicant?.email || '-'}
            </span>
          </div>
          <div className="md:col-span-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Alamat Korespondensi / Kantor</span>
            <span className="text-xs font-semibold text-slate-600 block">{sub.applicant?.address || '-'}</span>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100">
        <h3 className="text-xs font-bold text-slate-800 border-b border-border pb-2 uppercase tracking-wide mb-4 flex items-center gap-1.5 text-left">
          <HardHat className="h-4.5 w-4.5 text-primary" />
          Profil Konsultan Perencana
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-xs text-left">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Nama Ahli Spasial / Perencana</span>
            <span className="text-xs font-bold text-slate-700 block">{sub.consultant?.consultantName || '-'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Perusahaan / CV Konsultan</span>
            <span className="text-xs font-bold text-slate-700 block">{sub.consultant?.companyName || '-'}</span>
          </div>
          <div className="md:col-span-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Nama Penanggung Jawab Lapangan (PIC)</span>
            <span className="text-xs font-bold text-slate-700 block">{sub.consultant?.picName || '-'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
