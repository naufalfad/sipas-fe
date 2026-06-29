import { useState } from 'react';
import { useForm, FormProvider, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Save, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { SubmissionService } from '@/features/submission/services/submission.service';
import { fullSubmissionSchema, type FullSubmissionFormValues } from '../schemas/submissionFormSchema';
import {
  ApplicantSection, SubmissionSection, LocationSection, CoordinateSection,
  SpatialSection, TechnicalSection, ConsultantSection, DocumentSection,
  PhotoSection, StatementSection
} from '../components/FormSections';

const steps = [
  { id: 1, title: 'Data Pemohon' },
  { id: 2, title: 'Data Pengajuan' },
  { id: 3, title: 'Data Lokasi' },
  { id: 4, title: 'Data Koordinat' },
  { id: 5, title: 'Info Tata Ruang' },
  { id: 6, title: 'Data Teknis' },
  { id: 7, title: 'Konsultan' },
  { id: 8, title: 'Dokumen' },
  { id: 9, title: 'Foto Lokasi' },
  { id: 10, title: 'Pernyataan' },
];

export default function SubmissionCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);

  const methods = useForm<FullSubmissionFormValues>({
    resolver: zodResolver(fullSubmissionSchema) as Resolver<FullSubmissionFormValues>,
    defaultValues: {
      applicant: { type: 'PERORANGAN' },
      submission: { submissionType: 'BARU', category: 'PERUMAHAN' },
      location: { ownershipStatus: 'SHM' },
    },
    mode: 'onTouched',
  });

  const { handleSubmit, trigger } = methods;

  const mutation = useMutation({
    mutationFn: async (data: FullSubmissionFormValues) => {
      return SubmissionService.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      navigate('/pengajuan/daftar');
    }
  });

  const onSubmit = (data: FullSubmissionFormValues) => {
    mutation.mutate(data);
  };

  // Validasi dinamis per tahapan sebelum diperbolehkan melangkah ke tab berikutnya
  const nextStep = async () => {
    let fieldsToValidate: any = [];
    switch (currentStep) {
      case 1: fieldsToValidate = 'applicant'; break;
      case 2: fieldsToValidate = 'submission'; break;
      case 3: fieldsToValidate = 'location'; break;
      case 4: fieldsToValidate = 'coordinate'; break;
      case 5: fieldsToValidate = 'spatial'; break;
      case 6: fieldsToValidate = 'technical'; break;
      case 7: fieldsToValidate = 'consultant'; break;
      case 8: fieldsToValidate = 'document'; break;
      case 9: fieldsToValidate = 'photo'; break;
      case 10: fieldsToValidate = 'statement'; break;
    }

    const isStepValid = await trigger(fieldsToValidate);
    if (isStepValid && currentStep < steps.length) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans">

      {/* ─── SEKSI 1: HEADER HALAMAN ─── */}
      <div className="flex items-center gap-4 select-none">
        <Link
          to="/pengajuan/daftar"
          className="p-2 hover:bg-slate-100 rounded-none text-slate-500 transition-colors cursor-pointer"
          title="Kembali ke Daftar Pengajuan"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="text-left">
          <h1 className="text-2xl font-bold text-[#111D13] leading-none">
            Buat Pengajuan Baru
          </h1>
          <p className="text-xs text-slate-500 mt-2">
            Lengkapi 10 tahapan formulir di bawah ini dengan mengunggah berkas yang valid.
          </p>
        </div>
      </div>

      {/* ─── SEKSI 2: GRID WORKSPACE (STEPPER VS FORM CONTENT) ─── */}
      <div className="flex flex-col lg:flex-row gap-8">

        {/* Kolom Kiri: Sidebar Stepper (Penyelarasan Desain dengan Sidebar Utama) */}
        <div className="lg:w-1/4 shrink-0 select-none">
          <div className="sticky top-6 border border-border bg-white p-3 shadow-[1px_1px_3px_rgba(0,0,0,0.015)]">
            <nav className="space-y-1">
              {steps.map((step) => {
                const isActive = step.id === currentStep;
                const isCompleted = step.id < currentStep;

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => {
                      if (step.id < currentStep) setCurrentStep(step.id);
                    }}
                    disabled={step.id > currentStep}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-none text-xs font-semibold transition-all outline-none border-none cursor-pointer ${isActive
                      ? 'bg-secondary text-primary border-l-2 border-primary font-bold'
                      : isCompleted
                        ? 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-950'
                        : 'text-slate-400 cursor-not-allowed'
                      }`}
                  >
                    <span className="flex items-center gap-3">
                      {/* Avatar indikator nomor langkah (Pengecualian rounded-full di index.css) */}
                      <span className={`flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-bold shrink-0 ${isActive
                        ? 'bg-primary text-white'
                        : isCompleted
                          ? 'bg-accent text-primary'
                          : 'bg-slate-100 text-slate-400'
                        }`}>
                        {isCompleted ? <CheckCircle2 className="h-3.5 w-3.5" /> : step.id}
                      </span>
                      <span>{step.title}</span>
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Kolom Kanan: Main Form Area */}
        <div className="lg:w-3/4">
          <div className="bg-white border border-border p-6 md:p-8 min-h-[500px] flex flex-col shadow-[1px_1px_3px_rgba(0,0,0,0.015)]">
            <FormProvider {...methods}>
              <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col">

                {/* Form Sections Viewport */}
                <div className="flex-1 mb-8">
                  {currentStep === 1 && <ApplicantSection />}
                  {currentStep === 2 && <SubmissionSection />}
                  {currentStep === 3 && <LocationSection />}
                  {currentStep === 4 && <CoordinateSection />}
                  {currentStep === 5 && <SpatialSection />}
                  {currentStep === 6 && <TechnicalSection />}
                  {currentStep === 7 && <ConsultantSection />}
                  {currentStep === 8 && <DocumentSection />}
                  {currentStep === 9 && <PhotoSection />}
                  {currentStep === 10 && <StatementSection />}
                </div>

                {/* Tombol Navigasi Kaki Formulir (Ramping, Siku Kaku, Hunter Green) */}
                <div className="pt-6 border-t border-border flex justify-between items-center select-none">
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    className="inline-flex items-center px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 transition-all rounded-none outline-none border-none cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Sebelumnya
                  </button>

                  {currentStep < steps.length ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="inline-flex items-center justify-center px-5 py-2.5 bg-primary hover:opacity-90 text-white font-bold rounded-none transition-all gap-2 text-xs shadow-[4px_4px_0px_0px_rgba(65,93,67,0.15)] border border-primary cursor-pointer outline-none"
                    >
                      Selanjutnya
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={mutation.isPending}
                      className="inline-flex items-center justify-center px-5 py-2.5 bg-primary hover:opacity-90 disabled:opacity-50 text-white font-bold rounded-none transition-all gap-2 text-xs shadow-[4px_4px_0px_0px_rgba(65,93,67,0.15)] border border-primary cursor-pointer outline-none"
                    >
                      {mutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-white" />
                          <span>Mengirimkan...</span>
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          <span>Simpan Pengajuan Final</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

              </form>
            </FormProvider>
          </div>
        </div>

      </div>
    </div>
  );
}