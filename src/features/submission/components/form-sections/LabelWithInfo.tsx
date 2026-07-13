import { Info } from 'lucide-react';
import { labelClass } from './styles';

interface LabelWithInfoProps {
  label: React.ReactNode;
  subLabel?: React.ReactNode; // Properti baru untuk menampung unit/keterangan di baris kedua
  helpText?: string;
}

export const LabelWithInfo = ({ label, subLabel, helpText }: LabelWithInfoProps) => {
  return (
    <label className={labelClass}>
      {/* Baris Pertama: Judul Utama + Ikon Info (i) */}
      <span className="inline-flex items-center gap-1.5 align-middle select-none">
        <span>{label}</span>
        {helpText && (
          <span className="relative group inline-block align-middle select-none normal-case tracking-normal">
            <span className="cursor-pointer text-slate-400 hover:text-primary transition-colors flex items-center">
              <Info size={13} />
            </span>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 hidden group-hover:block w-[260px] bg-[#111D13] text-white text-[10px] font-semibold p-2.5 pointer-events-none z-50 rounded-none shadow-md border border-[#709775]/25 leading-normal text-left">
              {helpText}
              <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#111D13]" />
            </span>
          </span>
        )}
      </span>

      {/* Baris Kedua: Unit / Keterangan Tambahan */}
      {subLabel && (
        <span className="block text-[10px] font-medium text-slate-400 mt-0.5 normal-case tracking-normal">
          {subLabel}
        </span>
      )}
    </label>
  );
};