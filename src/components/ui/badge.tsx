import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * ============================================================================
 * BADGE VARIANTS SPECIFICATION (PROTECTED VARIATIONS)
 * ============================================================================
 * Mengatur standardisasi warna penanda status (badge) secara konsisten.
 * Seluruh sudut diatur siku kaku (rounded-none). Warna diubah dari solid keras
 * menjadi pastel kontras lembut yang memadukan rona Celadon, Amber, dan Rose.
 * ============================================================================
 */
const badgeVariants = cva(
    'inline-flex items-center rounded-none px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border transition-colors focus:outline-none focus:ring-1 focus:ring-primary',
    {
        variants: {
            variant: {
                // Varian Primer: Tema Hijau Celadon Lembut (Cocok untuk status 'Disetujui' atau indikator aktif)
                default: 'bg-[#e8f2ea] text-[#415D43] border-[#A1CCA5]/60 hover:bg-[#e8f2ea]/80',

                // Varian Sekunder: Tema Abu-abu Sage Netral
                secondary: 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100',

                // Varian Peringatan: Tema Amber/Kuning Pastel (Cocok untuk status dalam proses verifikasi)
                warning: 'bg-amber-50 text-amber-800 border-amber-100 hover:bg-amber-100/70',

                // Varian Destruktif: Tema Rose/Merah Pastel (Cocok untuk status 'Ditolak' atau alarm bahaya)
                destructive: 'bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100/70',

                // Varian Outline: Murni garis tepi abu-abu kehijauan tipis
                outline: 'border-border text-[#111D13] bg-transparent hover:bg-slate-50',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
);

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    );
}

export { Badge, badgeVariants };