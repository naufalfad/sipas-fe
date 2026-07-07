import { Info } from 'lucide-react';
import { labelClass } from './styles';

export const LabelWithInfo = ({ label, helpText }: { label: string; helpText?: string }) => {
  return (
    <label className={labelClass}>
      {label}
      {helpText && (
        <span className="relative group inline-block ml-1.5 align-middle select-none normal-case tracking-normal">
          <span className="cursor-pointer text-slate-400 hover:text-primary transition-colors">
            <Info size={13} className="inline-block" />
          </span>
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 hidden group-hover:block w-[260px] bg-[#111D13] text-white text-[10px] font-semibold p-2.5 pointer-events-none z-50 rounded-none shadow-md border border-[#709775]/25 leading-normal text-left">
            {helpText}
            <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#111D13]" />
          </span>
        </span>
      )}
    </label>
  );
};
