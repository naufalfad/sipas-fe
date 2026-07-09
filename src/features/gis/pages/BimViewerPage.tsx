import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { SubmissionService } from '@/features/submission/services/submission.service';
import type { Submission } from '@/features/submission/types';

export default function BimViewerPage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    const { data: submission } = useQuery<Submission>({
        queryKey: ['submission', id],
        queryFn: () => id ? SubmissionService.getById(id) : Promise.reject(new Error('Invalid submission id')),
        enabled: !!id,
        retry: false,
    });

    const housingName = submission?.housingName || "Peninjau 3D CAD/BIM";

    return (
        <div className="fixed inset-0 bg-slate-950 text-slate-100 flex flex-col">
            <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/95 shadow-lg">
                <button
                    type="button"
                    onClick={() => navigate('/gis')}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider bg-slate-800 hover:bg-teal-600 text-slate-200 rounded-lg transition"
                >
                    <ArrowLeft size={16} />
                    Kembali ke Peta
                </button>
                <div className="text-right">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-teal-300">BIM Viewer</p>
                    <h1 className="text-lg font-black tracking-tight">{housingName}</h1>
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center p-8">
                <div className="max-w-2xl w-full rounded-3xl border border-slate-700/80 bg-slate-900/95 p-8 shadow-2xl">
                    <h2 className="text-2xl font-black text-white mb-4">3D Viewer Dinonaktifkan Sementara</h2>
                    <p className="text-sm text-slate-300 leading-relaxed mb-6">
                        Fitur BIM/3D saat ini sedang dalam pengembangan dan akan diaktifkan kembali setelah optimasi selesai. Untuk saat ini, Anda dapat menggunakan peta 2D ringan dan melihat data spasial tanpa mode 3D.
                    </p>
                    <div className="rounded-2xl border border-teal-500/20 bg-slate-800/80 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-teal-300 mb-2">Status</p>
                        <ul className="space-y-2 text-sm text-slate-300">
                            <li>• 3D rendering dimatikan</li>
                            <li>• Viewer heavy WebGL tidak dimuat</li>
                            <li>• Navigasi peta tetap tersedia di halaman GIS utama</li>
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    );
}
