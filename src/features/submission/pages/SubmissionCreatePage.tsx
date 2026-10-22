import { useState, useEffect } from 'react';
import { useForm, FormProvider, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useNavigate, Link, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Loader2, Save, ChevronRight, ChevronLeft, CheckCircle2, ShieldCheck, FileCheck, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { SubmissionService } from '@/features/submission/services/submission.service';
import { pkkprApi } from '@/features/pkkpr/api/pkkprApi';
import type { PKKPRListItem } from '@/features/pkkpr/types/pkkpr.types';
import { PKKPRSelectionModal } from '../components/PKKPRSelectionModal';
import { fullSubmissionSchema, type FullSubmissionFormValues } from '../schemas/submissionFormSchema';
import {
  ApplicantSection, SubmissionSection, LocationSection, CoordinateSection,
  SpatialSection, TechnicalSection, ConsultantSection, DocumentSection,
  PhotoSection, StatementSection
} from '../components/FormSections';

const steps = [
  { id: 1, title: 'Data Pengajuan' },
  { id: 2, title: 'Data Pemohon' },
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
  const location = useLocation();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const [currentStep, setCurrentStep] = useState(1);

  const preselectedPkkprId = (location.state as any)?.preselected_pkkpr_id;
  const preselectedPkkprNo = (location.state as any)?.preselected_pkkpr_no;

  // STEP 0 PRE-FLIGHT MODAL: Muncul otomatis saat pengajuan baru (kecuali sudah ada preselected PKKPR atau sedang edit draf)
  const [isPKKPRModalOpen, setIsPKKPRModalOpen] = useState<boolean>(!id && !preselectedPkkprId);
  const [isAutoFilling, setIsAutoFilling] = useState<boolean>(false);

  const methods = useForm<FullSubmissionFormValues>({
    resolver: zodResolver(fullSubmissionSchema) as Resolver<FullSubmissionFormValues>,
    defaultValues: {
      applicant: { type: 'BADAN_USAHA' },
      submission: { submissionType: 'BARU', category: 'PERUMAHAN' },
      location: { ownershipStatus: 'HGB' },
      spatial: {
        pkkprId: preselectedPkkprId || undefined,
        pkkprOrigin: 'INTERNAL',
        kkprNumber: preselectedPkkprNo || '',
      }
    },
    mode: 'onTouched',
  });

  const connectedPkkprId = methods.watch('spatial.pkkprId');
  const connectedKkprNo = methods.watch('spatial.kkprNumber');

  // Ambil data kuota real-time jika SK PKKPR terpilih
  const { data: activePkkprQuota } = useQuery({
    queryKey: ['active-pkkpr-quota-summary', connectedPkkprId],
    queryFn: () => pkkprApi.getQuotaSummary(connectedPkkprId!),
    enabled: !!connectedPkkprId,
    staleTime: 10000,
  });

  // FUNGSI UTAMA AUTO-FILL DARI SK PKKPR SAH:
  // Mengisi identitas, lokasi, intensitas ruang, serta poligon tapak awal
  // Seluruh kolom TETAP 100% EDITABLE sehingga pemohon dapat menyesuaikan bila ada perbedaan riil
  const handleSelectPKKPR = async (pkkprItem: PKKPRListItem | { id: string }) => {
    try {
      setIsAutoFilling(true);
      const [detail, quota] = await Promise.all([
        pkkprApi.getDetail(pkkprItem.id),
        pkkprApi.getQuotaSummary(pkkprItem.id).catch(() => null)
      ]);

      if (detail) {
        // 1. Data Pemohon (Applicant) - 100% editable
        const isHousing = detail.kbli_code?.startsWith('68') || methods.getValues('submission.category') === 'PERUMAHAN';
        methods.setValue('applicant.type', isHousing ? 'BADAN_USAHA' : (detail.applicant_type || 'BADAN_USAHA'), { shouldDirty: true });
        if (detail.applicant_name) methods.setValue('applicant.name', detail.applicant_name, { shouldDirty: true });
        if (detail.applicant_nik) methods.setValue('applicant.nik', detail.applicant_nik, { shouldDirty: true });
        if (detail.applicant_nib) methods.setValue('applicant.nib', detail.applicant_nib, { shouldDirty: true });
        if (detail.applicant_npwp) methods.setValue('applicant.npwp', detail.applicant_npwp, { shouldDirty: true });
        if (detail.applicant_phone) methods.setValue('applicant.phone', detail.applicant_phone, { shouldDirty: true });
        if (detail.applicant_email) methods.setValue('applicant.email', detail.applicant_email, { shouldDirty: true });
        if (detail.location_address) methods.setValue('applicant.address', detail.location_address, { shouldDirty: true });

        // 2. Data Pengajuan (Submission) - 100% editable
        if (detail.activity_description) {
          methods.setValue('submission.activityName', detail.activity_description, { shouldDirty: true });
        }
        methods.setValue('submission.category', isHousing ? 'PERUMAHAN' : 'NON_PERUMAHAN', { shouldDirty: true });

        // 3. Data Lokasi Administrasi (Location) - 100% editable
        if (detail.activity_description) methods.setValue('location.locationName', detail.activity_description, { shouldDirty: true });
        if (detail.location_village) methods.setValue('location.village', detail.location_village, { shouldDirty: true });
        if (detail.location_district) methods.setValue('location.district', detail.location_district, { shouldDirty: true });
        methods.setValue('location.city', detail.location_city || 'Kabupaten Bogor');
        methods.setValue('location.province', 'Jawa Barat');
        if (detail.location_address) methods.setValue('location.fullAddress', detail.location_address, { shouldDirty: true });

        // Kuota Lahan / Luas Disetujui
        const remainingLand = quota?.remaining_area_m2 ?? detail.approved_land_area_m2 ?? detail.proposed_land_area_m2 ?? 0;
        if (remainingLand > 0) {
          methods.setValue('location.landArea', remainingLand, { shouldDirty: true, shouldValidate: true });
        }

        if (detail.land_ownership_status) {
          methods.setValue('location.ownershipStatus', (detail.land_ownership_status as any) || 'HGB', { shouldDirty: true });
        }
        if (detail.certificate_number) methods.setValue('location.certificateNumber', detail.certificate_number, { shouldDirty: true });
        if (detail.certificate_owner) methods.setValue('location.certificateOwner', detail.certificate_owner, { shouldDirty: true });

        // 4. Info Tata Ruang (Spatial)
        methods.setValue('spatial.pkkprId', detail.id, { shouldDirty: true });
        methods.setValue('spatial.pkkprOrigin', 'INTERNAL', { shouldDirty: true });
        methods.setValue('spatial.kkprNumber', detail.sk_number || detail.submission_no, { shouldDirty: true });
        if (detail.spatial_zone_name || quota?.envelope?.spatial_zone_name) {
          methods.setValue('spatial.landUse', detail.spatial_zone_name || quota?.envelope?.spatial_zone_name || '', { shouldDirty: true });
        }

        // 5. Data Teknis / Intensitas Ruang (Technical) - 100% editable
        const kdb = detail.approved_kdb_max ?? quota?.envelope?.approved_kdb_max;
        if (kdb != null) methods.setValue('technical.kdb', kdb, { shouldDirty: true });

        const klb = detail.approved_klb_max ?? quota?.envelope?.approved_klb_max;
        if (klb != null) methods.setValue('technical.klb', klb, { shouldDirty: true });

        const kdh = detail.approved_kdh_min ?? quota?.envelope?.approved_kdh_min;
        if (kdh != null) methods.setValue('technical.kdh', kdh, { shouldDirty: true });

        const gsb = detail.approved_gsb_min ?? quota?.envelope?.approved_gsb_min;
        if (gsb != null) methods.setValue('technical.applicantGsb', gsb, { shouldDirty: true });

        const maxFloors = detail.approved_max_floors ?? quota?.envelope?.approved_max_floors;
        if (maxFloors != null) methods.setValue('technical.maxFloors', maxFloors, { shouldDirty: true });

        // 6. Poligon Geometri Koordinat (Coordinate) - 100% editable
        const hasExistingPhases = (quota?.siteplans_count ?? 0) > 0 || (quota?.used_area_m2 ?? 0) > 0;
        if (!hasExistingPhases) {
          const polyCoords = quota?.pkkpr_geometry?.coordinates?.[0] || detail.geometry?.coordinates?.[0];
          if (polyCoords && Array.isArray(polyCoords) && polyCoords.length >= 3) {
            methods.setValue('coordinate.polygon', polyCoords, { shouldDirty: true, shouldValidate: true });
          }
        } else {
          // Bila sudah ada tahap site plan sebelumnya, biarkan area koordinat bersih agar pemohon dapat menggambar atau unggah CAD tahap lanjutan
          methods.setValue('coordinate.polygon', undefined);
        }

        toast.success(`Data berhasil di-autofill dari SK PKKPR: ${detail.sk_number || detail.submission_no}. Semua kolom dapat Anda edit secara bebas.`);
      }
    } catch (err: any) {
      console.error("Gagal auto-fill dari PKKPR:", err);
      toast.error("Gagal memuat rincian data dari SK PKKPR terpilih.");
    } finally {
      setIsAutoFilling(false);
    }
  };

  // Muat otomatis jika ada preselected PKKPR dari route navigation
  useEffect(() => {
    if (preselectedPkkprId && !connectedPkkprId) {
      handleSelectPKKPR({ id: preselectedPkkprId });
    }
  }, [preselectedPkkprId]);


  const { handleSubmit, trigger } = methods;

  // Fetch data permohonan jika sedang mengedit/melanjutkan draf
  const { data: existingSub, isLoading: isLoadingDraft } = useQuery({
    queryKey: ['submission', id],
    queryFn: () => SubmissionService.getById(id || ''),
    enabled: !!id,
  });

  const isLocked = existingSub ? (existingSub.status !== 'Draft' && existingSub.status !== 'Ditolak') : false;

  // Pre-load data draf ke form
  useEffect(() => {
    if (existingSub) {
      methods.reset({
        id_permohonan: existingSub.id,
        applicant: {
          type: existingSub.applicant?.type || 'PERORANGAN',
          name: existingSub.applicant?.name || '',
          nik: existingSub.applicant?.nik || undefined,
          nib: existingSub.applicant?.nib || undefined,
          npwp: existingSub.applicant?.npwp || '',
          directorName: existingSub.applicant?.directorName || undefined,
          phone: existingSub.applicant?.phone || '',
          email: existingSub.applicant?.email || '',
          address: existingSub.applicant?.address || '',
        },
        submission: {
          submissionType: existingSub.submissionDetails?.submissionType || 'BARU',
          activityName: existingSub.housingName || '',
          category: existingSub.submissionDetails?.category || 'PERUMAHAN',
        },
        location: {
          locationName: existingSub.locationDetails?.locationName || '',
          village: existingSub.locationDetails?.village || '',
          district: existingSub.locationDetails?.district || '',
          city: existingSub.locationDetails?.city || 'Kabupaten Bogor',
          province: existingSub.locationDetails?.province || 'Jawa Barat',
          fullAddress: existingSub.locationDetails?.fullAddress || '',
          landArea: existingSub.locationDetails?.landArea || 0,
          ownershipStatus: existingSub.locationDetails?.ownershipStatus || 'SHM',
          certificateNumber: existingSub.locationDetails?.certificateNumber || '',
          certificateOwner: existingSub.locationDetails?.certificateOwner || '',
        },
        coordinate: {
          polygon: existingSub.location?.polygon || undefined,
          cadFileName: existingSub.coordinate?.cadFileName || undefined,
          cadParamA: existingSub.coordinate?.cadParamA || undefined,
          cadParamB: existingSub.coordinate?.cadParamB || undefined,
          cadParamTx: existingSub.coordinate?.cadParamTx || undefined,
          cadParamTy: existingSub.coordinate?.cadParamTy || undefined,
          cadScale: existingSub.coordinate?.cadScale || undefined,
          cadRotation: existingSub.coordinate?.cadRotation || undefined,
        },
        spatial: {
          kkprNumber: existingSub.spatial?.kkprNumber || '',
          landUse: existingSub.spatial?.landUse || '',
          greenArea: existingSub.spatial?.greenArea || 0,
        },
        technical: {
          lotCount: existingSub.technical?.lotCount || undefined,
          housingType: existingSub.technical?.housingType || undefined,
          cemeteryArea: existingSub.technical?.cemeteryArea || undefined,
          roadRowMain: existingSub.technical?.roadRowMain || undefined,
          roadRowLocal: existingSub.technical?.roadRowLocal || undefined,
          waterSystem: existingSub.technical?.waterSystem || undefined,
          waterSource: existingSub.technical?.waterSource || undefined,
          buildingBlocks: existingSub.technical?.buildingBlocks || undefined,
          kdb: existingSub.technical?.kdb || undefined,
          klb: existingSub.technical?.klb || undefined,
          kdh: existingSub.technical?.kdh || undefined,
          parkingCapacity: existingSub.technical?.parkingCapacity || undefined,
          maxFloors: existingSub.technical?.maxFloors || undefined,
          totalFloorArea: existingSub.technical?.totalFloorArea || undefined,
          facilityType: existingSub.technical?.facilityType || undefined,
          capacity: existingSub.technical?.capacity || undefined,
          disabledAccess: existingSub.technical?.disabledAccess || undefined,
          specialParking: existingSub.technical?.specialParking || undefined,
          fireProtection: existingSub.technical?.fireProtection || undefined,
          warehouseCount: existingSub.technical?.warehouseCount || undefined,
          roadLoadMst: existingSub.technical?.roadLoadMst || undefined,
          electricityPower: existingSub.technical?.electricityPower || undefined,
          ipalCapacity: existingSub.technical?.ipalCapacity || undefined,
          greenBufferArea: existingSub.technical?.greenBufferArea || undefined,
          tpsB3Provision: existingSub.technical?.tpsB3Provision || undefined,
          applicantBuildingArea: existingSub.technical?.applicantBuildingArea || undefined,
          applicantGsb: existingSub.technical?.applicantGsb || undefined,
          applicantRthArea: existingSub.technical?.applicantRthArea || undefined,

          // Ketentuan Sempadan Lengkap
          applicantGsbLocal: existingSub.technical?.applicantGsbLocal || undefined,
          sempadanSungai: existingSub.technical?.sempadanSungai || undefined,
          sempadanDanau: existingSub.technical?.sempadanDanau || undefined,
          sempadanSaluranIrigasi: existingSub.technical?.sempadanSaluranIrigasi || undefined,
          sempadanMataAir: existingSub.technical?.sempadanMataAir || undefined,
          sempadanKhususLainnya: existingSub.technical?.sempadanKhususLainnya || undefined,
        },
        consultant: {
          consultantName: existingSub.consultant?.consultantName || '',
          companyName: existingSub.consultant?.companyName || '',
          picName: existingSub.consultant?.picName || '',
        },
        statement: {
          agreed: existingSub.statement?.agreed || false,
        },
        document: {
          legalDoc: existingSub.documents?.find(d => d.key === 'legalDoc')?.url || undefined,
          technicalDoc: existingSub.documents?.find(d => d.key === 'technicalDoc')?.url || undefined,
          supportDoc: existingSub.documents?.find(d => d.key === 'supportDoc')?.url || undefined,
          supportDoc2: existingSub.documents?.find(d => d.key === 'supportDoc2')?.url || undefined,
          skaDoc: existingSub.documents?.find(d => d.key === 'skaDoc')?.url || undefined,
          cadDoc: existingSub.documents?.find(d => d.key === 'cadDoc')?.url || undefined,
          ktpDoc: existingSub.documents?.find(d => d.key === 'ktpDoc')?.url || undefined,
          nibDoc: existingSub.documents?.find(d => d.key === 'nibDoc')?.url || undefined,
        },
        photo: {
          photoNorth: existingSub.photos?.photoNorth || undefined,
          photoSouth: existingSub.photos?.photoSouth || undefined,
          photoEast: existingSub.photos?.photoEast || undefined,
          photoWest: existingSub.photos?.photoWest || undefined,
          photoAccess: existingSub.photos?.photoAccess || undefined,
        }
      });
    }
  }, [existingSub]);

  // Mutation untuk Simpan Draf (isDraft = true)
  const draftMutation = useMutation({
    mutationFn: async (data: FullSubmissionFormValues) => {
      return SubmissionService.create(data, true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      toast.success('Draf permohonan berhasil disimpan!');
      navigate('/pengajuan/daftar');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal menyimpan draf');
    }
  });

  const handleSaveDraft = () => {
    const currentValues = methods.getValues();
    if (id) {
      currentValues.id_permohonan = id;
    }
    draftMutation.mutate(currentValues);
  };

  const mutation = useMutation({
    mutationFn: async (data: FullSubmissionFormValues) => {
      if (id) {
        data.id_permohonan = id;
      }
      return SubmissionService.create(data, false);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      navigate(`/pengajuan/penerimaan/${res.id}`);
    }
  });

  const onSubmit = (data: FullSubmissionFormValues) => {
    mutation.mutate(data);
  };

  // Validasi dinamis per tahapan sebelum diperbolehkan melangkah ke tab berikutnya
  const nextStep = async () => {
    let fieldsToValidate: any = [];
    switch (currentStep) {
      case 1: fieldsToValidate = 'submission'; break;
      case 2: fieldsToValidate = 'applicant'; break;
      case 3: fieldsToValidate = 'location'; break;
      case 4: fieldsToValidate = 'coordinate'; break;
      case 5: fieldsToValidate = 'spatial'; break;
      case 6: fieldsToValidate = ['technical', 'tpu']; break;
      case 7: fieldsToValidate = 'consultant'; break;
      case 8: fieldsToValidate = 'document'; break;
      case 9: fieldsToValidate = 'photo'; break;
      case 10: fieldsToValidate = 'statement'; break;
    }

    const isStepValid = await trigger(fieldsToValidate);
    if (isStepValid && currentStep < steps.length) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (!isStepValid) {
      // Ekstraksi pesan error spesifik agar pengguna tidak kebingungan
      const errs = methods.formState.errors;
      const errorMessages: string[] = [];
      const checkKeys = Array.isArray(fieldsToValidate) ? fieldsToValidate : [fieldsToValidate];

      checkKeys.forEach((key: string) => {
        const sectionError = (errs as any)[key];
        if (sectionError) {
          if (typeof sectionError.message === 'string' && sectionError.message) {
            errorMessages.push(sectionError.message);
          } else if (typeof sectionError === 'object') {
            Object.keys(sectionError).forEach((subKey) => {
              const subErr = sectionError[subKey];
              if (subErr?.message) {
                errorMessages.push(subErr.message);
              }
            });
          }
        }
      });

      if (errorMessages.length > 0) {
        toast.error(`Periksa isian yang belum lengkap atau tidak valid:\n• ${errorMessages.slice(0, 3).join('\n• ')}`);
      } else {
        toast.error('Mohon lengkapi seluruh isian wajib pada tahap ini sebelum melanjutkan.');
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (id && isLoadingDraft) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4 font-sans">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-slate-500">Memuat draf permohonan...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans">

      {/* ─── SEKSI 1: HEADER HALAMAN & STATUS TERKONEKSI SK PKKPR ─── */}
      <div className="flex flex-col gap-4 select-none">
        <div className="flex items-center gap-4">
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

        {/* ─── BANNER TERKONEKSI SK PKKPR (EARLY INTEGRATION STEP 0) ─── */}
        {connectedPkkprId ? (
          <div className="bg-[#e8f2ea] border border-[#A1CCA5] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2 bg-primary text-white rounded-none shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                    Terkoneksi SK PKKPR Sah
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2 py-0.5 border border-[#A1CCA5]">
                    {connectedKkprNo || 'SK Terdaftar'}
                  </span>
                  <span className="text-[10px] text-emerald-800 bg-white/70 px-2 py-0.5 border border-[#A1CCA5]">
                    ✓ Data Autofill Aktif & Editable
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  {activePkkprQuota ? (
                    <>
                      Sisa Kuota Tapak: <strong className="font-mono text-primary font-bold">{activePkkprQuota.remaining_area_m2.toLocaleString('id-ID')} m²</strong> (dari total {activePkkprQuota.total_approved_area_m2.toLocaleString('id-ID')} m² disetujui) • Seluruh kolom data dapat disesuaikan secara bebas.
                    </>
                  ) : (
                    'Data identitas, lokasi administrasi, luas, dan intensitas tata ruang telah dimuat dari PKKPR.'
                  )}
                </p>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPKKPRModalOpen(true)}
                className="text-xs font-bold text-primary hover:text-primary/80 bg-white border border-[#A1CCA5] px-3.5 py-1.5 transition-colors cursor-pointer"
              >
                Ganti SK PKKPR
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-200 text-slate-700 rounded-none shrink-0">
                <FileCheck className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800">
                  Belum Memilih Dokumen SK PKKPR (Disarankan)
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Pilih SK PKKPR yang telah disahkan untuk auto-fill identitas pemohon, lokasi, dan intensitas tata ruang secara cepat.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPKKPRModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-primary hover:opacity-90 px-4 py-2 transition-all cursor-pointer shrink-0"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Pilih SK PKKPR Sah
            </button>
          </div>
        )}
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
                  <fieldset disabled={isLocked} className="border-none p-0 m-0 min-w-0 flex-1">
                    {currentStep === 1 && <SubmissionSection />}
                    {currentStep === 2 && <ApplicantSection />}
                    {currentStep === 3 && <LocationSection />}
                    {currentStep === 4 && <CoordinateSection />}
                    {currentStep === 5 && <SpatialSection />}
                    {currentStep === 6 && <TechnicalSection />}
                    {currentStep === 7 && <ConsultantSection />}
                    {currentStep === 8 && <DocumentSection />}
                    {currentStep === 9 && <PhotoSection />}
                    {currentStep === 10 && <StatementSection />}
                  </fieldset>
                </div>

                {/* Tombol Navigasi Kaki Formulir (Symmetrical, Clean Typography, Siku Kaku) */}
                <div className="pt-6 border-t border-border flex justify-between items-center select-none">

                  {/* Tombol Sebelumnya */}
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    className="inline-flex items-center px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 transition-all rounded-none outline-none border-none bg-transparent cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1.5" />
                    SEBELUMNYA
                  </button>

                  {/* Tombol Simpan Draf (Borderless, Clean Text Style) */}
                  {!isLocked && (
                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      disabled={draftMutation.isPending || mutation.isPending}
                      className="inline-flex items-center justify-center px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 transition-all rounded-none outline-none border-none bg-transparent cursor-pointer"
                    >
                      {draftMutation.isPending ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                          <span>MENYIMPAN...</span>
                        </>
                      ) : (
                        <>
                          <Save className="h-3.5 w-3.5 mr-1.5" />
                          <span>{id ? 'PERBARUI DRAF' : 'SIMPAN DRAF'}</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Tombol Selanjutnya / Kirim (No Shadow, Perfect Filled State) */}
                  {currentStep < steps.length ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="inline-flex items-center justify-center px-5 py-2.5 bg-primary hover:opacity-90 text-white font-bold uppercase tracking-wider rounded-none transition-all gap-2 text-xs border border-primary cursor-pointer outline-none"
                    >
                      <span>SELANJUTNYA</span>
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </button>
                  ) : (
                    !isLocked && (
                      <button
                        type="submit"
                        disabled={mutation.isPending}
                        className="inline-flex items-center justify-center px-5 py-2.5 bg-primary hover:opacity-90 disabled:opacity-50 text-white font-bold uppercase tracking-wider rounded-none transition-all gap-2 text-xs border border-primary cursor-pointer outline-none"
                      >
                        {mutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin text-white" />
                            <span>MENGIRIMKAN...</span>
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            <span>SIMPAN PENGAJUAN FINAL</span>
                          </>
                        )}
                      </button>
                    )
                  )}
                </div>

              </form>
            </FormProvider>
          </div>
        </div>

      </div>

      {/* ─── STEP 0 PRE-FLIGHT MODAL PEMILIHAN SK PKKPR SAH ─── */}
      <PKKPRSelectionModal
        isOpen={isPKKPRModalOpen}
        onClose={() => setIsPKKPRModalOpen(false)}
        onSelectPKKPR={handleSelectPKKPR}
        currentSelectedPkkprId={connectedPkkprId}
        isSelecting={isAutoFilling}
      />
    </div>
  );
}