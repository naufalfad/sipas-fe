import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { SubmissionService } from '@/features/submission/services/submission.service';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

const submissionSchema = z.object({
  housingName: z.string().min(3, 'Nama perumahan minimal 3 karakter'),
  developerName: z.string().min(3, 'Nama developer minimal 3 karakter'),
  landArea: z.number({ invalid_type_error: 'Luas lahan harus berupa angka' }).positive('Luas lahan harus bernilai positif'),
  address: z.string().min(5, 'Alamat minimal 5 karakter'),
});

type SubmissionFormValues = z.infer<typeof submissionSchema>;

export default function SubmissionCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors } } = useForm<SubmissionFormValues>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      housingName: '',
      developerName: '',
      landArea: 0,
      address: '',
    }
  });

  const mutation = useMutation({
    mutationFn: SubmissionService.create,
    onSuccess: () => {
      // Invalidate submissions cache to fetch fresh data
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      navigate('/pengajuan/daftar');
    }
  });

  const onSubmit = (data: SubmissionFormValues) => {
    mutation.mutate(data);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/pengajuan/daftar" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Buat Pengajuan Baru
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Silakan lengkapi formulir di bawah untuk mendaftarkan site plan perumahan baru.
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-6 md:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="housingName" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nama Perumahan / Kawasan
              </label>
              <input
                id="housingName"
                type="text"
                {...register('housingName')}
                placeholder="Contoh: Grand Pajajaran Residence"
                className={`w-full px-4 py-2 border rounded-lg dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                  errors.housingName ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-750'
                }`}
              />
              {errors.housingName && (
                <p className="text-xs text-rose-500 mt-1.5">{errors.housingName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="developerName" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nama Perumahan Developer
              </label>
              <input
                id="developerName"
                type="text"
                {...register('developerName')}
                placeholder="Contoh: PT Bangun Persada Mandiri"
                className={`w-full px-4 py-2 border rounded-lg dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                  errors.developerName ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-750'
                }`}
              />
              {errors.developerName && (
                <p className="text-xs text-rose-500 mt-1.5">{errors.developerName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="landArea" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Luas Lahan (m²)
              </label>
              <input
                id="landArea"
                type="number"
                {...register('landArea', { valueAsNumber: true })}
                placeholder="Contoh: 15000"
                className={`w-full px-4 py-2 border rounded-lg dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                  errors.landArea ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-750'
                }`}
              />
              {errors.landArea && (
                <p className="text-xs text-rose-500 mt-1.5">{errors.landArea.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Lokasi / Alamat Lengkap Kawasan
              </label>
              <input
                id="address"
                type="text"
                {...register('address')}
                placeholder="Contoh: Jl. Raya Tajur No. 12, Kec. Bogor Selatan"
                className={`w-full px-4 py-2 border rounded-lg dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                  errors.address ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-750'
                }`}
              />
              {errors.address && (
                <p className="text-xs text-rose-500 mt-1.5">{errors.address.message}</p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t dark:border-slate-700 flex justify-end space-x-3">
            <Link
              to="/pengajuan/daftar"
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 text-sm font-semibold transition-all"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="inline-flex items-center justify-center px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-semibold rounded-lg shadow-sm text-sm transition-all gap-2"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Mengirimkan...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Simpan Pengajuan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
