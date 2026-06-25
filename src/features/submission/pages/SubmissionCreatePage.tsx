import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
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
    resolver: zodResolver(fullSubmissionSchema),
    defaultValues: {
      applicant: { type: 'PERORANGAN' },
      submission: { submissionType: 'BARU' },
      location: { ownershipStatus: 'SHM' },
    },
    mode: 'onTouched',
  });

  const { handleSubmit, trigger } = methods;

  const mutation = useMutation({
    mutationFn: async (data: FullSubmissionFormValues) => {
      // Mock formatting for submission service
      return SubmissionService.create({
        housingName: data.submission.activityName,
        developerName: data.applicant.name,
        landArea: data.location.landArea,
        address: data.location.fullAddress,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      navigate('/pengajuan/daftar');
    }
  });

  const onSubmit = (data: FullSubmissionFormValues) => {
    mutation.mutate(data);
  };

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
    <div className="space-y-6 max-w-6xl mx-auto">
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
            Lengkapi 10 tahapan formulir di bawah ini.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Stepper */}
        <div className="lg:w-1/4 shrink-0">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sticky top-6 shadow-sm">
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
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400' :
                        isCompleted ? 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50' :
                          'text-slate-400 dark:text-slate-500 cursor-not-allowed'
                      }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className={`flex items-center justify-center h-6 w-6 rounded-full text-xs ${isActive ? 'bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-400' :
                          isCompleted ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300' :
                            'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        }`}>
                        {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : step.id}
                      </span>
                      {step.title}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Form Content */}
        <div className="lg:w-3/4">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 md:p-8 min-h-[500px] flex flex-col">
            <FormProvider {...methods}>
              <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col">
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

                {/* Footer Actions */}
                <div className="pt-6 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    className="inline-flex items-center px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-50 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Sebelumnya
                  </button>

                  {currentStep < steps.length ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="inline-flex items-center justify-center px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-semibold rounded-lg shadow-sm text-sm transition-all"
                    >
                      Selanjutnya
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={mutation.isPending}
                      className="inline-flex items-center justify-center px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-semibold rounded-lg shadow-sm text-sm transition-all gap-2"
                    >
                      {mutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
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
