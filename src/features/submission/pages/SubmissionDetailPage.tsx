import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { useUIStore } from '@/app/store/useUIStore';
import { useGisUIStore, type LahanKompensasi } from '@/app/store/useGisUIStore';
import { SubmissionService } from '@/features/submission/services/submission.service';
import type { SubmissionStatus } from '../types';
import {
  ArrowLeft, Clock, CheckCircle2,
  MapPin, File, Loader2,
  XCircle, CheckCircle, FileSignature, AlertTriangle, ShieldCheck,
  User, Phone, Mail, Award, HardHat, Camera, Landmark,
  Scale, Globe, Fingerprint
} from 'lucide-react';
import { Source, Layer } from 'react-map-gl/maplibre';
import GISMapContainer from '@/components/maps/GISMapContainer';
import { leafletRingToGeoJSON } from '@/lib/geoUtils';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─── MOCK DATA LAHAN KOMPENSASI DAERAH [Purworejo 8, Bogor 11] ────────────────
const mockKompensasiList: LahanKompensasi[] = [
  {
    idKompensasi: 'komp-101',
    idPermohonan: 'sub-1', // Terkait permohonan PT Maju Jaya Sentosa
    tipeKompensasi: 'LAHAN_MAKAM_FISIK',
    luasKompensasiM2: 500,
    statusPemenuhan: 'PROSES_VERIFIKASI',
    polygon: [
      [-6.5940, 106.8155],
      [-6.5940, 106.8160],
      [-6.5945, 106.8160],
      [-6.5945, 106.8155],
      [-6.5940, 106.8155]
    ],
    buktiLegalitasUrl: '#',
  },
  {
    idKompensasi: 'komp-102',
    idPermohonan: 'sub-5', // Terkait permohonan Batu Tulis Residence (Ditolak)
    tipeKompensasi: 'LAHAN_SAWAH',
    luasKompensasiM2: 12000,
    statusPemenuhan: 'BELUM_TERPENUHI',
    polygon: [
      [-6.6210, 106.8110],
      [-6.6210, 106.8120],
      [-6.6220, 106.8120],
      [-6.6220, 106.8110],
      [-6.6210, 106.8110]
    ],
    buktiLegalitasUrl: undefined,
  }
];

export default function SubmissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { activeRole, userProfile } = useUIStore();

  // Zustand State Binding [sipas-fe.txt, Purworejo 8]
  const setActiveKompensasi = useGisUIStore((s) => s.setActiveKompensasi);
  const flyTo = useGisUIStore((s) => s.flyTo);

  const [notes, setNotes] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'pemohon' | 'lokasi' | 'teknis' | 'kompensasi' | 'foto'>('ringkasan');

  // Checklist states
  const [adminChecks, setAdminChecks] = useState({
    ktp: false,
    sertifikat: false,
    npwp: false,
    kkpr: false
  });

  const [techChecks, setTechChecks] = useState({
    polygon: false,
    rth: false,
    utilities: false,
    cad: false
  });

  const [kabidAgreed, setKabidAgreed] = useState(false);

  const { data: sub, isLoading } = useQuery({
    queryKey: ['submission', id],
    queryFn: () => SubmissionService.getById(id || ''),
    enabled: !!id,
  });

  const mutation = useMutation({
    mutationFn: async ({ status, notes, passphrase }: { status: SubmissionStatus; notes: string; passphrase?: string }) => {
      return SubmissionService.updateStatus(sub?.id || '', status, `${userProfile.name} (${activeRole})`, notes, passphrase);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submission', id] });
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      setNotes('');
      setPassphrase('');
      setAdminChecks({ ktp: false, sertifikat: false, npwp: false, kkpr: false });
      setTechChecks({ polygon: false, rth: false, utilities: false, cad: false });
      setKabidAgreed(false);
      toast.success('Status berkas berhasil diperbarui!');
    },
    onError: (error: Error) => {
      toast.error(`Gagal memproses verifikasi: ${error.message}`);
    }
  });

  // Filter Kompensasi yang terkait dengan permohonan ini [Purworejo 8]
  const associatedKompensasi = useMemo(() => {
    if (!sub) return null;
    return mockKompensasiList.find(k => k.idPermohonan === sub.id) || null;
  }, [sub]);

  // Memetakan batas luar bidang tanah site plan
  const outerBoundaryGeoJSON = useMemo(() => {
    if (!sub?.location?.polygon || sub.location.polygon.length === 0) return null;
    try {
      const ring = leafletRingToGeoJSON(sub.location.polygon as [number, number][]);
      return {
        type: 'FeatureCollection' as const,
        features: [{
          type: 'Feature' as const,
          geometry: { type: 'Polygon' as const, coordinates: [ring] },
          properties: {}
        }]
      };
    } catch (e) {
      console.warn('[DetailMap] Gagal memetakan polygon batas luar:', e);
      return null;
    }
  }, [sub]);

  // Memetakan detail denah tapak (jalan, RTH, PSU, kaveling)
  const siteplanFeaturesGeoJSON = useMemo(() => {
    const features: any[] = [];
    const loc = sub?.location;
    if (!loc) return { type: 'FeatureCollection' as const, features };

    const addPoly = (rings: [number, number][][], color: string, label: string) => {
      rings.forEach((ring) => {
        try {
          features.push({
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: [leafletRingToGeoJSON(ring)] },
            properties: { color, label },
          });
        } catch { /* skip */ }
      });
    };
    if (loc.roadPolygons) addPoly(loc.roadPolygons, '#cbd5e1', 'Jalan');
    if (loc.rthPolygons) addPoly(loc.rthPolygons, '#10b981', 'RTH');
    if (loc.psuPolygons) addPoly(loc.psuPolygons, '#14b8a6', 'PSU');
    if (loc.kavlingPolygons) addPoly(loc.kavlingPolygons, '#64748b', 'Kaveling');

    return { type: 'FeatureCollection' as const, features };
  }, [sub]);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col justify-center items-center space-y-4">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-xs text-slate-500">Menghubungkan data basis spasial...</p>
      </div>
    );
  }

  if (!sub) {
    return (
      <div className="flex flex-col justify-center items-center py-16 text-center max-w-md mx-auto select-none bg-white border border-border p-8">
        <XCircle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-800">Berkas Tidak Ditemukan</h3>
        <p className="text-xs text-slate-400 mt-2 mb-6 leading-relaxed">
          Nomor registrasi berkas pengajuan tidak terdaftar di dalam sistem administrasi GEOSIPAS.
        </p>
        <Link to="/pengajuan/daftar" className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-semibold transition-colors rounded-none">
          Kembali ke Daftar
        </Link>
      </div>
    );
  }

  // Pengkondisian gaya visual lencana status sesuai standardisasi palet organik baru (WCAG AA Compliant)
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Disetujui':
        return 'bg-accent/35 text-[#415D43] border border-accent/70'; // Celadon theme
      case 'Ditolak':
        return 'bg-rose-50 text-rose-700 border border-rose-100'; // Rose theme
      default:
        return 'bg-amber-50 text-amber-800 border border-amber-100'; // Amber theme
    }
  };

  // --- LOGIKA KONTROL SLA CLOCK PAUSE/RESUME [Bogor 16] ---
  const isSlaPaused = sub.status === 'Ditolak' || sub.status === 'Draft';
  const slaDaysRemaining = sub.remaining_sla_days ?? 0;

  // Helper variables for role-based conditional rendering
  const isAdminActive = activeRole === 'Admin SIPAS' || activeRole === 'Super Admin';
  const isTechActive = activeRole === 'Tim Teknis' || activeRole === 'Super Admin';
  const isKabidActive = activeRole === 'Kepala Bidang' || activeRole === 'Super Admin';

  const showAdminPanel = isAdminActive && (sub.status === 'Menunggu Verifikasi' || sub.status === 'Verifikasi Administrasi');
  const showTechPanel = isTechActive && sub.status === 'Verifikasi Teknis';
  const showKabidPanel = isKabidActive && sub.status === 'Menunggu Persetujuan';

  const allAdminChecked = Object.values(adminChecks).every(Boolean);
  const allTechChecked = Object.values(techChecks).every(Boolean);

  const handleAdminAction = (approved: boolean) => {
    const targetStatus = approved ? 'Verifikasi Teknis' : 'Ditolak';
    const defaultNotes = approved ? 'Berkas dinyatakan LENGKAP dan SAH secara administratif. Diteruskan ke Tim Teknis.' : 'Berkas DITOLAK / butuh REVISI administratif.';
    mutation.mutate({
      status: targetStatus,
      notes: notes.trim() || defaultNotes
    });
  };

  const handleTechAction = (approved: boolean) => {
    const targetStatus = approved ? 'Menunggu Persetujuan' : 'Ditolak';
    const defaultNotes = approved ? 'Hasil audit spasial & teknis dinyatakan LOLOS. Rekomendasi pengesahan dikirim ke Kepala Bidang.' : 'Berkas dikembalikan karena ketidaksesuaian teknis/spasial.';
    mutation.mutate({
      status: targetStatus,
      notes: notes.trim() || defaultNotes
    });
  };

  const handleKabidAction = (approved: boolean) => {
    const targetStatus = approved ? 'Disetujui' : 'Ditolak';
    const defaultNotes = approved ? 'Dokumen Site Plan disahkan secara hukum menggunakan Tanda Tangan Elektronik (TTE) resmi dinas.' : 'Permohonan pengesahan ditolak oleh Kepala Bidang.';

    if (approved && !passphrase) {
      toast.error('Passphrase PIN TTE wajib diisi untuk melakukan pengesahan!');
      return;
    }
    if (approved && passphrase.length < 6) {
      toast.error('Passphrase PIN TTE minimal 6 karakter!');
      return;
    }

    mutation.mutate({
      status: targetStatus,
      notes: notes.trim() || defaultNotes,
      passphrase: approved ? passphrase : undefined
    } as any);
  };

  // Handler Visualisasi Lahan Kompensasi pada Peta Spasial [Purworejo 8]
  const handleShowCompensationOnMap = (komp: LahanKompensasi) => {
    setActiveKompensasi(komp);

    // Hitung centroid poligon kompensasi untuk mengarahkan kamera
    const centroid = calculateCentroid(komp.polygon);
    flyTo({
      longitude: centroid[0],
      latitude: centroid[1],
      zoom: 17,
      pitch: 45
    });
    toast.info('GIS Engine memfokuskan kamera ke poligon lahan pengganti!');
  };

  function calculateCentroid(polygon: [number, number][]): [number, number] {
    let totalLat = 0;
    let totalLng = 0;
    polygon.forEach(([lat, lng]) => {
      totalLat += lat;
      totalLng += lng;
    });
    return [totalLng / polygon.length, totalLat / polygon.length];
  }

  const inputClass = "w-full px-3.5 py-2 bg-white border border-border text-foreground placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-sans text-xs rounded-none";
  const labelClass = "block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide";

  return (
    <div className="space-y-6 font-sans">

      {/* ─── SEKSI 1: HEADER SUMMARY BLOCK ─── */}
      <div className="flex items-center gap-4 select-none">
        <Link to="/pengajuan/daftar" className="p-2 bg-white hover:bg-slate-50 border border-border text-slate-500 hover:text-slate-800 transition-colors rounded-none">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="text-left flex-1">
          <h1 className="text-2xl font-bold text-[#111D13] leading-none">
            Rincian Berkas Pengajuan
          </h1>
          <p className="text-xs text-slate-500 mt-2">
            Informasi administrasi, penelusuran riwayat evaluasi, dan lampiran berkas teknis {sub.submissionNo}.
          </p>
        </div>

        {/* ─── DYNAMIC SLA TRACKER HUD [Bogor 16] ─── */}
        <div className="shrink-0 select-none flex items-center gap-3">
          {isSlaPaused ? (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-700 border border-rose-200 animate-pulse text-[10px] font-black uppercase tracking-widest shadow-sm rounded-none">
              <Clock className="h-4 w-4 text-rose-600" />
              SLA: DI-PAUSE (Revisi)
            </div>
          ) : sub.status === 'Disetujui' ? (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase tracking-widest shadow-sm rounded-none">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              SLA: BERHASIL ({slaDaysRemaining} Hari)
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-black uppercase tracking-widest shadow-sm rounded-none">
              <Clock className="h-4 w-4 text-amber-600 animate-spin" style={{ animationDuration: '4s' }} />
              SLA: {slaDaysRemaining} Hari Tersisa
            </div>
          )}
        </div>
      </div>

      {/* ─── SEKSI 2: CORE WORKSPACE GRID (SPLIT 2/3 DAN 1/3) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Kolom Kiri (2/3): Informasi Proyek & Berkas Laporan */}
        <div className="lg:col-span-2 space-y-6">

          {/* Tab Selector */}
          <div className="flex border-b border-border bg-white overflow-x-auto no-scrollbar select-none">
            {[
              { id: 'ringkasan', label: 'Ringkasan & Berkas' },
              { id: 'pemohon', label: 'Pemohon & Konsultan' },
              { id: 'lokasi', label: 'Lokasi & Tata Ruang' },
              { id: 'teknis', label: 'Parameter Teknis' },
              { id: 'kompensasi', label: 'Kompensasi & Mitigasi' }, // Tab Baru [Purworejo 8]
              { id: 'foto', label: 'Dokumentasi Foto' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-3 font-bold text-xs border-b-2 transition-all duration-200 whitespace-nowrap cursor-pointer ${activeTab === tab.id
                  ? 'border-primary text-primary bg-slate-50/60 font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-slate-700 hover:bg-slate-50/20'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="bg-white border border-border p-6 shadow-[1px_1px_4px_rgba(0,0,0,0.015)] rounded-none text-left min-h-[350px]">
            {activeTab === 'ringkasan' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 border-b border-border pb-2 uppercase tracking-wide mb-4">
                    Informasi Umum Proyek
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Nama Proyek/Kegiatan</span>
                      <span className="text-sm font-bold text-[#111D13] leading-tight block">{sub.housingName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Developer Pengaju</span>
                      <span className="text-sm font-bold text-[#111D13] leading-tight block">{sub.developerName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Luas Lahan</span>
                      <span className="text-xs font-bold text-slate-700 block">{sub.landArea ? `${sub.landArea.toLocaleString('id-ID')} m²` : '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Tanggal Diajukan</span>
                      <span className="text-xs font-bold text-slate-700 block">{sub.submissionDate}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Kategori Pengajuan</span>
                      <span className="text-xs font-bold text-slate-700 block">{sub.submissionDetails?.category || 'PERUMAHAN'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Jenis Permohonan</span>
                      <span className="text-xs font-bold text-slate-700 block">{sub.submissionDetails?.submissionType || 'BARU'}</span>
                    </div>
                    <div className="md:col-span-2 pt-2 border-t border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Lokasi Administratif</span>
                      <span className="text-xs font-semibold text-slate-600 flex items-start gap-1.5 leading-normal">
                        <MapPin className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
                        {sub.location.address}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-800 border-b border-border pb-2 uppercase tracking-wide mb-4">
                    Berkas Lampiran Pengajuan
                  </h3>
                  <div className="space-y-3">
                    {sub.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3.5 bg-slate-50/50 hover:bg-slate-100/50 border border-border/40 transition-colors">
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="p-2 bg-white border border-border text-primary shrink-0">
                            <File className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <h5 className="font-bold text-xs text-[#111D13] truncate">{doc.name}</h5>
                            <span className="text-[10px] text-slate-400 block mt-1">Format: {doc.type.toUpperCase()} • Diunggah: {doc.uploadedAt}</span>
                          </div>
                        </div>
                        <a
                          href={doc.url}
                          onClick={(e) => e.preventDefault()}
                          className="text-xs font-bold text-primary hover:underline shrink-0 pl-3"
                        >
                          Unduh Berkas
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'pemohon' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 border-b border-border pb-2 uppercase tracking-wide mb-4 flex items-center gap-1.5">
                    <User className="h-4.5 w-4.5 text-primary" />
                    Profil Pemohon / Pengaju
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-xs">
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
                          <span className="text-xs font-mono font-bold text-slate-700 block">{sub.applicant?.nib || '-'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Nama Direktur / Penanggung Jawab</span>
                          <span className="text-xs font-bold text-slate-700 block">{sub.applicant?.directorName || '-'}</span>
                        </div>
                      </>
                    ) : (
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Nomor NIK Pemohon</span>
                        <span className="text-xs font-mono font-bold text-slate-700 block">{sub.applicant?.nik || '-'}</span>
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
                  <h3 className="text-xs font-bold text-slate-800 border-b border-border pb-2 uppercase tracking-wide mb-4 flex items-center gap-1.5">
                    <HardHat className="h-4.5 w-4.5 text-primary" />
                    Profil Konsultan Perencana
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-xs">
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
            )}

            {activeTab === 'lokasi' && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-in fade-in duration-200">
                {/* Kolom Kiri: Detail Textual */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 border-b border-border pb-2 uppercase tracking-wide mb-4 flex items-center gap-1.5">
                      <Landmark className="h-4.5 w-4.5 text-primary" />
                      Informasi Spasial Lahan & Kepemilikan
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Nama Lokasi Proyek</span>
                        <span className="text-xs font-bold text-slate-700 block">{sub.locationDetails?.locationName || '-'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Luas Lahan Terdaftar</span>
                        <span className="text-xs font-bold text-slate-700 block">{sub.locationDetails?.landArea ? `${sub.locationDetails.landArea.toLocaleString('id-ID')} m²` : (sub.landArea ? `${sub.landArea.toLocaleString('id-ID')} m²` : '-')}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Desa / Kelurahan</span>
                        <span className="text-xs font-bold text-slate-700 block">{sub.locationDetails?.village || '-'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Kecamatan</span>
                        <span className="text-xs font-bold text-slate-700 block">{sub.locationDetails?.district || '-'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Kabupaten / Kota</span>
                        <span className="text-xs font-bold text-slate-700 block">{sub.locationDetails?.city || '-'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Provinsi</span>
                        <span className="text-xs font-bold text-slate-700 block">{sub.locationDetails?.province || '-'}</span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Alamat Lengkap Lahan</span>
                        <span className="text-xs font-semibold text-slate-600 block">{sub.locationDetails?.fullAddress || sub.location.address}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <h3 className="text-xs font-bold text-slate-800 border-b border-border pb-2 uppercase tracking-wide mb-4">
                      Sertifikasi & Legalitas Tanah
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Status Kepemilikan</span>
                        <span className="text-xs font-bold text-slate-700 block">{sub.locationDetails?.ownershipStatus || 'SHM'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Nomor Sertifikat</span>
                        <span className="text-xs font-mono font-bold text-slate-700 block">{sub.locationDetails?.certificateNumber || '-'}</span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Nama Pemilik Hak Sertifikat</span>
                        <span className="text-xs font-bold text-slate-700 block">{sub.locationDetails?.certificateOwner || '-'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <h3 className="text-xs font-bold text-slate-800 border-b border-border pb-2 uppercase tracking-wide mb-4">
                      Kesesuaian Tata Ruang Otoritas
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Nomor SK KKPR BPN / Dinas</span>
                        <span className="text-xs font-mono font-bold text-slate-700 block">{sub.spatial?.kkprNumber || '-'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Zoning Peruntukan Rencana Tata Ruang</span>
                        <span className="text-xs font-bold text-slate-700 block">{sub.spatial?.landUse || '-'}</span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Luas Alokasi PSU & RTH (m²)</span>
                        <span className="text-xs font-bold text-slate-700 block">
                          {sub.spatial?.greenArea ? `${sub.spatial.greenArea.toLocaleString('id-ID')} m²` : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Kolom Kanan: Visualisasi Peta Proyeksi Spasial */}
                <div className="space-y-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 border-b border-border pb-2 uppercase tracking-wide mb-4 flex items-center gap-1.5">
                      <MapPin className="h-4.5 w-4.5 text-primary" />
                      Visualisasi Proyeksi Bidang & Site Plan (SHP/CAD)
                    </h3>
                    <div className="h-[300px] w-full relative border border-border bg-slate-100 overflow-hidden">
                      {sub.location.lat && sub.location.lng ? (
                        <GISMapContainer
                          center={[sub.location.lat, sub.location.lng]}
                          zoom={16}
                          className="w-full h-full"
                        >
                          {/* Render Outer Boundary */}
                          {outerBoundaryGeoJSON && (
                            <Source id="outer-boundary" type="geojson" data={outerBoundaryGeoJSON}>
                              <Layer
                                id="outer-boundary-line"
                                type="line"
                                paint={{
                                  'line-color': '#ef4444',
                                  'line-width': 2.5,
                                  'line-dasharray': [2, 2]
                                }}
                              />
                              <Layer
                                id="outer-boundary-fill"
                                type="fill"
                                paint={{
                                  'fill-color': '#ef4444',
                                  'fill-opacity': 0.08
                                }}
                              />
                            </Source>
                          )}

                          {/* Render Site Plan AutoCAD Vectors */}
                          {siteplanFeaturesGeoJSON.features.length > 0 && (
                            <Source id="siteplan-features" type="geojson" data={siteplanFeaturesGeoJSON}>
                              <Layer
                                id="siteplan-features-fill"
                                type="fill"
                                paint={{
                                  'fill-color': ['get', 'color'],
                                  'fill-opacity': 0.65
                                }}
                              />
                              <Layer
                                id="siteplan-features-line"
                                type="line"
                                paint={{
                                  'line-color': '#ffffff',
                                  'line-width': 1
                                }}
                              />
                            </Source>
                          )}
                        </GISMapContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                          Peta spasial tidak tersedia untuk koordinat ini.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Legenda Layer */}
                  <div className="bg-slate-50 border border-border p-3.5 space-y-2 select-none text-left">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Legenda Layer Site Plan:</span>
                    <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 text-[10px] font-bold text-slate-600">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-4 border border-dashed border-red-500 bg-red-500/10 block shrink-0"></span>
                        Batas Lahan (Outer Boundary)
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-4 bg-[#64748b] block shrink-0"></span>
                        Kaveling Unit Hunian
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-4 bg-[#cbd5e1] block shrink-0"></span>
                        Jaringan Jalan & ROW
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-4 bg-[#10b981] block shrink-0"></span>
                        RTH (Ruang Terbuka Hijau)
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-4 bg-[#14b8a6] block shrink-0"></span>
                        PSU / Sarana Utilitas
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'teknis' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <h3 className="text-xs font-bold text-slate-800 border-b border-border pb-2 uppercase tracking-wide mb-4 flex items-center gap-1.5">
                  <Award className="h-4.5 w-4.5 text-primary" />
                  Parameter Teknis Kategori: {sub.submissionDetails?.category || 'PERUMAHAN'}
                </h3>

                {/* Rendering kondisional parameter berdasarkan kategori aktual permohonan */}
                {(!sub.submissionDetails?.category || sub.submissionDetails.category === 'PERUMAHAN') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Jumlah Unit Kaveling Rencana</span>
                      <span className="text-xs font-bold text-slate-700 block">{sub.technical?.lotCount ? `${sub.technical.lotCount} unit` : '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Jenis Segmen Hunian</span>
                      <span className="text-xs font-bold text-slate-700 block">{sub.technical?.housingType || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Luas Pemakaman Wajib (m²)</span>
                      <span className="text-xs font-bold text-slate-700 block">{sub.technical?.cemeteryArea ? `${sub.technical.cemeteryArea.toLocaleString('id-ID')} m²` : '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Sistem Air Bersih Tapak</span>
                      <span className="text-xs font-bold text-slate-700 block">{sub.technical?.waterSystem || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Lebar Ruas Jalan Utama (ROW)</span>
                      <span className="text-xs font-bold text-slate-700 block">{sub.technical?.roadRowMain || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Lebar Ruas Jalan Lingkungan (ROW)</span>
                      <span className="text-xs font-bold text-slate-700 block">{sub.technical?.roadRowLocal || '-'}</span>
                    </div>
                  </div>
                )}

                {sub.submissionDetails?.category === 'NON_PERUMAHAN' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Jumlah Blok / Tower Gedung</span>
                      <span className="text-xs font-bold text-slate-700 block">{sub.technical?.buildingBlocks ? `${sub.technical.buildingBlocks} blok` : '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Koefisien Dasar Bangunan (KDB)</span>
                      <span className="text-xs font-bold text-slate-700 block">{sub.technical?.kdb ? `${sub.technical.kdb} %` : '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Koefisien Lantai Bangunan (KLB)</span>
                      <span className="text-xs font-bold text-slate-700 block">{sub.technical?.klb || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Koefisien Dasar Hijau (KDH)</span>
                      <span className="text-xs font-bold text-slate-700 block">{sub.technical?.kdh ? `${sub.technical.kdh} %` : '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Kapasitas Tempat Parkir (SRP)</span>
                      <span className="text-xs font-bold text-slate-700 block">{sub.technical?.parkingCapacity ? `${sub.technical.parkingCapacity} satuan` : '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Jumlah Lantai Maksimal Rencana</span>
                      <span className="text-xs font-bold text-slate-700 block">{sub.technical?.maxFloors ? `${sub.technical.maxFloors} lantai` : '-'}</span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Total Luas Lantai Keseluruhan (GFA)</span>
                      <span className="text-xs font-bold text-slate-700 block">{sub.technical?.totalFloorArea ? `${sub.technical.totalFloorArea.toLocaleString('id-ID')} m²` : '-'}</span>
                    </div>
                  </div>
                )}

                {sub.submissionDetails?.category === 'FASUM' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Jenis Layanan Fasilitas Umum</span>
                      <span className="text-xs font-bold text-slate-700 block">{sub.technical?.facilityType || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Kapasitas Daya Tampung Orang</span>
                      <span className="text-xs font-bold text-slate-700 block">{sub.technical?.capacity ? `${sub.technical.capacity.toLocaleString('id-ID')} orang` : '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Sarana Proteksi Kebakaran</span>
                      <span className="text-xs font-bold text-slate-700 block">{sub.technical?.fireProtection || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Aksesibilitas Difabel</span>
                      <span className="text-xs font-bold text-slate-700 block">{sub.technical?.disabledAccess || '-'}</span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Sarana Parkir Khusus (Ambulans / Bus Sekolah)</span>
                      <span className="text-xs font-semibold text-slate-600 block">{sub.technical?.specialParking || '-'}</span>
                    </div>
                  </div>
                )}

                {sub.submissionDetails?.category === 'INDUSTRI' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Jumlah Unit Gudang Rencana</span>
                      <span className="text-xs font-bold text-slate-700 block">{sub.technical?.warehouseCount ? `${sub.technical.warehouseCount} unit` : '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Muatan Sumbu Terberat Jalan (MST)</span>
                      <span className="text-xs font-bold text-slate-700 block">{sub.technical?.roadLoadMst || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Daya Listrik Terpasang (kVA)</span>
                      <span className="text-xs font-bold text-slate-700 block">{sub.technical?.electricityPower || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Kapasitas IPAL / WWTP Industri</span>
                      <span className="text-xs font-bold text-slate-700 block">{sub.technical?.ipalCapacity || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Luas Penyangga Hijau (Green Buffer)</span>
                      <span className="text-xs font-bold text-slate-700 block">{sub.technical?.greenBufferArea ? `${sub.technical.greenBufferArea.toLocaleString('id-ID')} m²` : '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Penyediaan TPS LImbah B3</span>
                      <span className="text-xs font-semibold text-slate-600 block">{sub.technical?.tpsB3Provision || '-'}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── TAB BARU: KONDISIONAL KELAYAKAN KOMPENSASI & MITIGASI [Purworejo 8] ─── */}
            {activeTab === 'kompensasi' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-border pb-2 flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                    <Scale className="h-4.5 w-4.5 text-primary" />
                    Kewajiban Mitigasi & Kompensasi Lahan
                  </h3>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Aturan Perbup Bogor</span>
                </div>

                {associatedKompensasi ? (
                  <div className="space-y-5">
                    <div className="bg-slate-50 border border-border p-4 space-y-4 text-left">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Tipe Kompensasi</span>
                          <span className="text-xs font-bold text-slate-800 block mt-1">
                            {associatedKompensasi.tipeKompensasi === 'LAHAN_MAKAM_FISIK' && 'Penyediaan Lahan Pemakaman (TPU 2%)'}
                            {associatedKompensasi.tipeKompensasi === 'LAHAN_SAWAH' && 'Penggantian Lahan Pertanian Basah (KP2B 1:1)'}
                            {associatedKompensasi.tipeKompensasi === 'LAHAN_MAKAM_UANG' && 'Uang Pengganti Lahan Pemakaman'}
                            {associatedKompensasi.tipeKompensasi === 'PSU_FISIK_TAMBAHAN' && 'Penyediaan PSU Tambahan Luar Kompleks'}
                          </span>
                        </div>
                        <span className={cn(
                          "px-2 py-0.5 text-[8px] font-black uppercase tracking-wider border leading-none rounded-none shadow-none",
                          associatedKompensasi.statusPemenuhan === 'TERPENUHI' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            associatedKompensasi.statusPemenuhan === 'PROSES_VERIFIKASI' ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' :
                              'bg-rose-50 text-rose-700 border-rose-200'
                        )}>
                          {associatedKompensasi.statusPemenuhan.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs pt-1 border-t border-slate-200/50">
                        <div>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Luas Kewajiban</span>
                          <span className="text-xs font-bold text-slate-700 block mt-1">{associatedKompensasi.luasKompensasiM2.toLocaleString('id-ID')} m²</span>
                        </div>
                        <div>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Nilai Nominal Pengganti</span>
                          <span className="text-xs font-bold text-slate-700 block mt-1">
                            {associatedKompensasi.nilaiNominal ? `Rp ${associatedKompensasi.nilaiNominal.toLocaleString('id-ID')}` : 'N/A (Fisik Lahan)'}
                          </span>
                        </div>
                      </div>

                      {/* Tombol Terapkan ke Map GIS */}
                      {associatedKompensasi.polygon && associatedKompensasi.polygon.length >= 3 && (
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => handleShowCompensationOnMap(associatedKompensasi)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 font-black text-[9px] uppercase tracking-widest border border-teal-200 transition-colors cursor-pointer outline-none rounded-none"
                          >
                            <Globe size={11} />
                            Plotting Lahan Pengganti Di Peta
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="p-4 bg-amber-50/40 border border-amber-200 text-left flex items-start gap-2.5">
                      <AlertTriangle className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h5 className="text-[10px] font-bold text-amber-800 uppercase tracking-wide">Aturan Pemenuhan Jaminan</h5>
                        <p className="text-[10px] text-amber-700 leading-relaxed text-justify">
                          Berdasarkan keputusan rapat komite tim teknis, izin site plan baru hanya dapat disahkan apabila status kompensasi fisik telah dinyatakan 'TERPENUHI' atau memiliki jaminan bank yang sah [Purworejo 8].
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
            )}

            {activeTab === 'foto' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <h3 className="text-xs font-bold text-slate-800 border-b border-border pb-2 uppercase tracking-wide mb-4 flex items-center gap-1.5">
                  <Camera className="h-4.5 w-4.5 text-primary" />
                  Galeri Foto Fisik Lapangan Pemohon
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  {[
                    { label: 'Batas Utara', url: sub.photos?.photoNorth },
                    { label: 'Batas Selatan', url: sub.photos?.photoSouth },
                    { label: 'Batas Timur', url: sub.photos?.photoEast },
                    { label: 'Batas Barat', url: sub.photos?.photoWest },
                    { label: 'Akses Jalan Utama', url: sub.photos?.photoAccess }
                  ].map((photo, i) => (
                    <div key={i} className="group bg-slate-50 border border-border p-2 hover:shadow-md transition-all duration-300">
                      <div className="overflow-hidden bg-slate-100 aspect-video relative">
                        {photo.url && photo.url !== '#' ? (
                          <img
                            src={photo.url}
                            alt={photo.label}
                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=400&q=80';
                            }}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-slate-400">
                            <Camera className="h-8 w-8" />
                          </div>
                        )}
                      </div>
                      <div className="mt-2 text-center">
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">{photo.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ─── KANVAS TINDAKAN EVALUASI (Dinamis Berdasarkan Hak Akses) ─── */}

          {/* Panel Admin SIPAS */}
          {showAdminPanel && (
            <div className="bg-white border border-primary p-5 shadow-[1px_1px_5px_rgba(0,0,0,0.02)] space-y-5 rounded-none text-left animate-in slide-in-from-bottom-2 duration-300">
              <div className="border-b border-border pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Panel Tindakan: Verifikasi Administrasi</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Lakukan validasi keabsahan fisik berkas pemohon.</p>
                </div>
                <span className="px-2 py-0.5 bg-secondary text-primary font-bold text-[9px] uppercase border border-border">ADMINISTRATOR</span>
              </div>

              {/* Checklist */}
              <div className="space-y-2.5">
                <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={adminChecks.ktp}
                    onChange={(e) => setAdminChecks(prev => ({ ...prev, ktp: e.target.checked }))}
                    className="mt-0.5 h-4.5 w-4.5 border-border rounded-none text-primary focus:ring-primary"
                  />
                  <span className="text-xs font-semibold text-slate-700">Kesesuaian Identitas Pemohon (KTP / NIB Direktur)</span>
                </label>
                <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={adminChecks.sertifikat}
                    onChange={(e) => setAdminChecks(prev => ({ ...prev, sertifikat: e.target.checked }))}
                    className="mt-0.5 h-4.5 w-4.5 border-border rounded-none text-primary focus:ring-primary"
                  />
                  <span className="text-xs font-semibold text-slate-700">Keabsahan Sertifikat Kepemilikan Tanah / Surat Hak Atas Lahan</span>
                </label>
                <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={adminChecks.npwp}
                    onChange={(e) => setAdminChecks(prev => ({ ...prev, npwp: e.target.checked }))}
                    className="mt-0.5 h-4.5 w-4.5 border-border rounded-none text-primary focus:ring-primary"
                  />
                  <span className="text-xs font-semibold text-slate-700">Kesesuaian NPWP Wajib Pajak (Badan Usaha / Perorangan)</span>
                </label>
                <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={adminChecks.kkpr}
                    onChange={(e) => setAdminChecks(prev => ({ ...prev, kkpr: e.target.checked }))}
                    className="mt-0.5 h-4.5 w-4.5 border-border rounded-none text-primary focus:ring-primary"
                  />
                  <span className="text-xs font-semibold text-slate-700">Dokumen Kesesuaian Kegiatan Pemanfaatan Ruang (KKPR) Sesuai Rencana</span>
                </label>
              </div>

              {/* Catatan Area */}
              <div className="space-y-1.5">
                <label className={labelClass}>Catatan Evaluasi / Alasan Penolakan</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Berikan keterangan kelayakan administrasi berkas di sini..."
                  className={inputClass}
                />
              </div>

              {/* Tindakan */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={mutation.isPending}
                  onClick={() => handleAdminAction(false)}
                  className="px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all rounded-none cursor-pointer"
                >
                  Tolak Berkas
                </button>
                <button
                  type="button"
                  disabled={mutation.isPending || !allAdminChecked}
                  onClick={() => handleAdminAction(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/95 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed border border-primary text-white text-xs font-bold transition-all rounded-none cursor-pointer"
                >
                  {mutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Setujui & Teruskan ke Teknis
                </button>
              </div>
            </div>
          )}

          {/* Panel Tim Teknis */}
          {showTechPanel && (
            <div className="bg-white border border-primary p-5 shadow-[1px_1px_5px_rgba(0,0,0,0.02)] space-y-5 rounded-none text-left animate-in slide-in-from-bottom-2 duration-300">
              <div className="border-b border-border pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Panel Tindakan: Verifikasi Teknis Spasial</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Lakukan audit fisik, spasial GIS, dan parameter site plan.</p>
                </div>
                <span className="px-2 py-0.5 bg-[#e8f2ea] text-primary font-bold text-[9px] uppercase border border-[#A1CCA5]">TIM TEKNIS</span>
              </div>

              {/* Checklist */}
              <div className="space-y-2.5">
                <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={techChecks.polygon}
                    onChange={(e) => setTechChecks(prev => ({ ...prev, polygon: e.target.checked }))}
                    className="mt-0.5 h-4.5 w-4.5 border-border rounded-none text-primary focus:ring-primary"
                  />
                  <span className="text-xs font-semibold text-slate-700">Kesesuaian Batas Lahan & Polygon Spasial Bidang BPN</span>
                </label>
                <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={techChecks.rth}
                    onChange={(e) => setTechChecks(prev => ({ ...prev, rth: e.target.checked }))}
                    className="mt-0.5 h-4.5 w-4.5 border-border rounded-none text-primary focus:ring-primary"
                  />
                  <span className="text-xs font-semibold text-slate-700">Kesesuaian Alokasi RTH & PSU Dinas (Minimum 20%)</span>
                </label>
                <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={techChecks.utilities}
                    onChange={(e) => setTechChecks(prev => ({ ...prev, utilities: e.target.checked }))}
                    className="mt-0.5 h-4.5 w-4.5 border-border rounded-none text-primary focus:ring-primary"
                  />
                  <span className="text-xs font-semibold text-slate-700">Rencana Utilitas (ROW Lebar Jalan, Jaringan Air & Drainase) Memenuhi Syarat</span>
                </label>
                <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={techChecks.cad}
                    onChange={(e) => setTechChecks(prev => ({ ...prev, cad: e.target.checked }))}
                    className="mt-0.5 h-4.5 w-4.5 border-border rounded-none text-primary focus:ring-primary"
                  />
                  <span className="text-xs font-semibold text-slate-700">Gambar CAD / DWG Site Plan Valid & Telah Diasistensi</span>
                </label>
              </div>

              {/* Catatan Area */}
              <div className="space-y-1.5">
                <label className={labelClass}>Catatan Teknis / Rekomendasi Perubahan</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tuliskan catatan teknis detail hasil audit spasial..."
                  className={inputClass}
                />
              </div>

              {/* Tindakan */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={mutation.isPending}
                  onClick={() => handleTechAction(false)}
                  className="px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all rounded-none cursor-pointer"
                >
                  Kembalikan untuk Revisi
                </button>
                <button
                  type="button"
                  disabled={mutation.isPending || !allTechChecked}
                  onClick={() => handleTechAction(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/95 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed border border-primary text-white text-xs font-bold transition-all rounded-none cursor-pointer"
                >
                  {mutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Setujui & Kirim ke Kabid
                </button>
              </div>
            </div>
          )}

          {/* Panel Kepala Bidang / TTE */}
          {showKabidPanel && (
            <div className="bg-white border border-primary p-5 shadow-[1px_1px_5px_rgba(0,0,0,0.02)] space-y-5 rounded-none text-left animate-in slide-in-from-bottom-2 duration-300">
              <div className="border-b border-border pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Panel Tindakan: Pengesahan & TTE</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Tandatangani Surat Keputusan (SK) Site Plan secara elektronik.</p>
                </div>
                <span className="px-2 py-0.5 bg-teal-50 text-teal-700 font-bold text-[9px] uppercase border border-teal-200">KEPALA BIDANG</span>
              </div>

              {/* Peringatan TTE */}
              <div className="bg-[#e8f2ea]/40 border border-primary/20 p-4 flex items-start gap-2.5">
                <AlertTriangle className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5 animate-pulse" />
                <div className="space-y-1">
                  <h5 className="text-[10px] font-bold text-slate-800 uppercase tracking-wide">Persetujuan TTE Dinas</h5>
                  <p className="text-[10px] text-slate-600 leading-normal">
                    Tindakan ini akan menyematkan tanda tangan sertifikat elektronik BSrE resmi pada Surat Keputusan (SK) Pengesahan Site Plan pemohon secara legal di mata hukum.
                  </p>
                </div>
              </div>

              {/* Checkbox */}
              <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={kabidAgreed}
                  onChange={(e) => setKabidAgreed(e.target.checked)}
                  className="mt-0.5 h-4.5 w-4.5 border-border rounded-none text-primary focus:ring-primary"
                />
                <span className="text-xs font-bold text-slate-800">
                  Saya secara sadar menyetujui rekomendasi kelayakan teknis berkas pengajuan dan siap menandatangani SK.
                </span>
              </label>

              {/* Catatan Area */}
              <div className="space-y-1.5">
                <label className={labelClass}>Catatan Pengesahan Pimpinan (Opsional)</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Masukkan pesan pengesahan untuk pengaju..."
                  className={inputClass}
                />
              </div>

              {/* Passphrase Input Field */}
              <div className="space-y-1.5">
                <label className={labelClass}>Passphrase PIN TTE Pejabat</label>
                <input
                  type="password"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Masukkan PIN TTE Anda (Min. 6 Karakter)..."
                  className={inputClass}
                  required
                />
              </div>

              {/* Tindakan */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={mutation.isPending}
                  onClick={() => handleKabidAction(false)}
                  className="px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all rounded-none cursor-pointer"
                >
                  Tolak Pengesahan
                </button>
                <button
                  type="button"
                  disabled={mutation.isPending || !kabidAgreed}
                  onClick={() => handleKabidAction(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#415D43] hover:bg-[#415D43]/95 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed border border-[#415D43] text-white text-xs font-bold transition-all rounded-none cursor-pointer"
                >
                  {mutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <FileSignature className="h-3.5 w-3.5" />
                  )}
                  Tanda Tangan SK & Sahkan
                </button>
              </div>
            </div>
          )}

          {/* Tombol Unduh SK Jika Status Disetujui (Celah C) */}
          {sub.status === 'Disetujui' && (
            <div className="bg-[#e8f2ea]/30 border border-primary/20 p-5 rounded-none text-left flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in slide-in-from-bottom-2 duration-500">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                  <ShieldCheck className="h-4.5 w-4.5 text-primary" />
                  Berkas Site Plan Telah Disahkan
                </h4>
                <p className="text-[10px] text-slate-400 mt-1">Surat Keputusan (SK) resmi dan salinan digital peta rencana tapak telah terbit.</p>
                <div className="mt-3">
                  {sub.signatureHash ? (
                    <span className="font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 p-2 break-all text-[10px] block">
                      <Fingerprint className="inline mr-1" size={12} /> {sub.signatureHash}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[10px]">Belum Ditandatangani Elektronik</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  if (sub.signedPdfUrl) {
                    window.open(sub.signedPdfUrl, '_blank');
                  } else {
                    window.alert(`Mengunduh Surat Keputusan Pengesahan Site Plan (${sub.submissionNo}-SK.pdf)...`);
                  }
                }}
                className="px-4 py-2.5 bg-primary hover:bg-primary/95 text-white font-bold text-xs transition-colors rounded-none border-none cursor-pointer"
              >
                Unduh Surat Keputusan (SK) PDF
              </button>
            </div>
          )}

        </div>

        {/* Kolom Kanan (1/3): Status & Riwayat Pelacakan */}
        <div className="bg-white border border-border p-5 shadow-[1px_1px_3px_rgba(0,0,0,0.015)] space-y-6 rounded-none text-left">

          {/* Status Terkini */}
          <div className="border-b border-border pb-5 select-none">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Status Berkas Saat Ini</span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold mt-2.5 border ${getStatusBadgeClass(sub.status)}`}>
              {sub.status === 'Disetujui' ? <CheckCircle className="h-3.5 w-3.5 text-[#415D43]" /> :
                sub.status === 'Ditolak' ? <XCircle className="h-3.5 w-3.5 text-rose-600" /> : <Clock className="h-3.5 w-3.5 text-amber-600" />}
              {sub.status}
            </span>
          </div>

          {/* Riwayat Alur Proses (Timeline) */}
          <div className="space-y-4">
            <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wide">Riwayat Proses Pelacakan</h4>

            <div className="relative border-l border-border/80 ml-3 pl-6 space-y-6 py-1">
              {sub.history.map((hist, i) => {
                const isApproved = hist.status === 'Disetujui';
                const isRejected = hist.status === 'Ditolak';

                return (
                  <div key={i} className="relative">
                    {/* Circle timeline nodes (bulat sempurna terlindung di index.css) */}
                    <div className={`absolute -left-9 mt-0.5 rounded-full p-1 border-4 border-white text-white ${isApproved ? 'bg-emerald-600' : isRejected ? 'bg-rose-600' : 'bg-amber-500'
                      }`}>
                      {isApproved ? <CheckCircle2 className="h-3.5 w-3.5 text-white" /> :
                        isRejected ? <XCircle className="h-3.5 w-3.5 text-white" /> : <Clock className="h-3.5 w-3.5 text-white" />}
                    </div>

                    <h5 className="font-bold text-slate-800 text-xs leading-none">{hist.status}</h5>
                    <div className="text-[10px] text-slate-400 mt-1.5 flex items-center space-x-2">
                      <span>{hist.date}</span>
                      <span>•</span>
                      <span className="font-bold text-slate-500">{hist.actor}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{hist.notes}</p>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}