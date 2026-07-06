/**
 * ============================================================================
 * GEOSIPAS DETIL & COCKPIT VERIFIKASI — [SubmissionDetailPage.tsx] (REVISED v3)
 * ============================================================================
 * Peran: Layar utama verifikasi dinas lintas OPD dan dasbor scorecard pemohon.
 *        Mengintegrasikan 13 aspek checklist toggle, tabel komparasi tiga sisi,
 *        SLA tracking dinamis, andalalin/AMDAL check, dan tanda tangan digital.
 * ============================================================================
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useUIStore } from '@/app/store/useUIStore';
import { useAuthStore } from '@/app/store/useAuthStore';
import { normalizeRole } from '@/components/auth/ProtectedRoute';
import { useGisUIStore, type LahanKompensasi } from '@/app/store/useGisUIStore';
import { SubmissionService } from '@/features/submission/services/submission.service';
import type { SubmissionStatus } from '../types';
import {
  ArrowLeft, Clock, CheckCircle2,
  MapPin, File, Loader2, UploadCloud,
  XCircle, CheckCircle, FileSignature, AlertTriangle, ShieldCheck,
  User, Phone, Mail, Award, HardHat, Camera, Landmark,
  Scale, Globe, Fingerprint, RefreshCw, Layers
} from 'lucide-react';
import { Source, Layer } from 'react-map-gl/maplibre';
import GISMapContainer from '@/components/maps/GISMapContainer';
import { leafletRingToGeoJSON } from '@/lib/geoUtils';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import AuditTrailViewer from '@/features/approval/components/AuditTrailViewer';

const uploadFileToBackend = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:8000/api/v1/submissions/upload', {
    method: 'POST',
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: formData
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || 'Gagal mengunggah berkas ke server');
  }

  const data = await response.json();
  return data;
};

// ─── STYLING CONSTANTS (PROTECTED VARIATIONS) ──────────────────────────────────
const inputClass = "w-full px-3.5 py-2 bg-white border border-border text-foreground placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-sans text-xs rounded-none";
const labelClass = "block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide";

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
      [-6.6010, 106.8055],
      [-6.6010, 106.8065],
      [-6.6025, 106.8065],
      [-6.6025, 106.8055],
      [-6.6010, 106.8055]
    ],
    buktiLegalitasUrl: '#',
  },
  {
    idKompensasi: 'komp-103',
    idPermohonan: 'sub-3',
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

const getCoordinates = (
  e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  canvas: HTMLCanvasElement | null
) => {
  if (!canvas) return { x: 0, y: 0 };
  const rect = canvas.getBoundingClientRect();
  const displayWidth = rect.width;
  const displayHeight = rect.height;
  const logicalWidth = canvas.width;
  const logicalHeight = canvas.height;

  if ('touches' in e) {
    if (e.touches.length === 0) return { x: 0, y: 0 };
    const clientX = e.touches[0].clientX - rect.left;
    const clientY = e.touches[0].clientY - rect.top;
    return {
      x: (clientX / displayWidth) * logicalWidth,
      y: (clientY / displayHeight) * logicalHeight
    };
  }

  const clientX = e.clientX - rect.left;
  const clientY = e.clientY - rect.top;
  return {
    x: (clientX / displayWidth) * logicalWidth,
    y: (clientY / displayHeight) * logicalHeight
  };
};

function calculateCentroid(polygon: [number, number][]): [number, number] {
  let totalLng = 0;
  let totalLat = 0;
  polygon.forEach((coord) => {
    const [a, b] = coord;
    if (a >= -15 && a <= 10 && b >= 90 && b <= 145) {
      totalLng += b;
      totalLat += a;
    } else {
      totalLng += a;
      totalLat += b;
    }
  });
  return [totalLng / polygon.length, totalLat / polygon.length];
}

// ─── DEFINISI 13 ASPEK CHECKLIST VERIFIKASI RESMI DINAS ───
interface AspectDefinition {
  code: string;
  label: string;
  helpText: string;
}

const VERIFICATION_ASPECTS: AspectDefinition[] = [
  { code: 'REQ_ZONING', label: 'Kesesuaian dengan RTRW / RDTR', helpText: 'Memastikan posisi koordinat bidang tanah berada pada peruntukan zona ruang yang tepat (RDTR DKI Jakarta Buku 2 Hal 6).' },
  { code: 'REQ_LEGAL', label: 'Status & Legalitas Kepemilikan Lahan', helpText: 'Validasi dokumen sertifikat tanah (SHM/HGB) asli terdaftar resmi BPN tanpa adanya catatan sengketa.' },
  { code: 'REQ_ACCESS', label: 'Aksesibilitas & Lebar Jalan Utama (ROW)', helpText: 'Uji kesesuaian sirkulasi masuk-keluar kendaraan, lebar jalan, serta pekarangan trotoar pejalan kaki.' },
  { code: 'REQ_DRAINAGE', label: 'Sistem Drainase & Pengendalian Banjir', helpText: 'Audit kelayakan jaringan saluran air hujan internal tapak guna mencegah potensi genangan/banjir.' },
  { code: 'REQ_KDB', label: 'Koefisien Dasar Bangunan (KDB)', helpText: 'Uji rasio tutupan lantai dasar bangunan terhadap luas lahan efektif (Buku 2 Hal 7).' },
  { code: 'REQ_KLB', label: 'Koefisien Lantai Bangunan (KLB)', helpText: 'Uji batas total luas seluruh lantai gedung yang diizinkan (Buku 2 Hal 8).' },
  { code: 'REQ_KDH', label: 'Koefisien Dasar Hijau (KDH)', helpText: 'Uji persentase area pekarangan terbuka penyerapan air alami (Buku 2 Hal 11).' },
  { code: 'REQ_RTH', label: 'Ruang Terbuka Hijau (RTH) Minimum', helpText: 'Kewajiban pemenuhan luasan RTH minimal 20% bagi kawasan perumahan daerah (Buku 2 Hal 11).' },
  { code: 'REQ_GSB', label: 'Garis Sempadan Bangunan (GSB)', helpText: 'Uji jarak mundur fisik dinding bangunan terluar dari as rencana jalan kota (Buku 2 Hal 13).' },
  { code: 'REQ_UTILITY', label: 'Prasarana & Utilitas Kota', helpText: 'Ketersediaan jaringan listrik PLN, gardu penunjang, pembuangan sampah mandiri, dan suplai air minum.' },
  { code: 'REQ_ENV_IMPACT', label: 'Dampak Lingkungan (AMDAL / UKL-UPL)', helpText: 'Penyertaan dokumen kelayakan lingkungan AMDAL resmi untuk kawasan industri/skala besar.' },
  { code: 'REQ_TRAFFIC', label: 'Dampak Lalu Lintas (Andalalin)', helpText: 'Penyertaan surat persetujuan andalalin dari Dishub guna mencegah kemacetan sirkulasi jalan.' },
  { code: 'REQ_PSU', label: 'Sarana Utilitas Umum / Fasum / Fasos', helpText: 'Penyediaan lahan pemakaman (TPU 2%) dan penyerahan PSU untuk perumahan (Purworejo 8).' },
];

export default function SubmissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { activeRole: uiActiveRole, userProfile: uiUserProfile } = useUIStore();
  const { user } = useAuthStore();

  const effectiveRole = user ? (normalizeRole(user.role) as string) : uiActiveRole;
  const activeRole = effectiveRole;
  const userProfile = user ? {
    name: user.full_name || user.username,
    email: user.email,
  } : uiUserProfile;

  // Zustand State Binding [sipas-fe.txt, Purworejo 8]
  const setActiveKompensasi = useGisUIStore((s) => s.setActiveKompensasi);
  const flyTo = useGisUIStore((s) => s.flyTo);

  const [notes, setNotes] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [signature, setSignature] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  // State untuk Tab Aktif
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'pemohon' | 'lokasi' | 'teknis' | 'kompensasi' | 'foto' | 'audit'>('ringkasan');

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

  // ─── REVISI: STATE UNTUK PENILAIAN DYNAMIC CHECKLIST & SANDING ANGKA VERIFIKATOR ───
  const [kkprVerdict, setKkprVerdict] = useState<string>('Sesuai');
  const [verifiedKdb, setVerifiedKdb] = useState<number | ''>('');
  const [verifiedKlb, setVerifiedKlb] = useState<number | ''>('');
  const [verifiedKdh, setVerifiedKdh] = useState<number | ''>('');
  const [verifiedGsb, setVerifiedGsb] = useState<number | ''>('');
  const [verifiedRthArea, setVerifiedRthArea] = useState<number | ''>('');

  // State dictionary untuk mumpung 13-aspek pemeriksaan dinas
  const [checklistStates, setChecklistStates] = useState<Record<string, {
    status: 'Sesuai' | 'Sesuai Bersyarat' | 'Tidak Sesuai';
    catatan: string;
    attachmentUrl?: string;
    isUploading?: boolean;
  }>>({});

  const { data: sub, isLoading } = useQuery({
    queryKey: ['submission', id],
    queryFn: () => SubmissionService.getById(id || ''),
    enabled: !!id,
  });

  // Pre-populate input verifikasi dinas jika sudah ada evaluasi sebelumnya di DB
  useEffect(() => {
    if (sub) {
      if (sub.kkprVerdict) setKkprVerdict(sub.kkprVerdict);
      if (sub.verifiedKdb !== undefined && sub.verifiedKdb !== null) setVerifiedKdb(sub.verifiedKdb);
      if (sub.verifiedKlb !== undefined && sub.verifiedKlb !== null) setVerifiedKlb(sub.verifiedKlb);
      if (sub.verifiedKdh !== undefined && sub.verifiedKdh !== null) setVerifiedKdh(sub.verifiedKdh);
      if (sub.verifiedGsb !== undefined && sub.verifiedGsb !== null) setVerifiedGsb(sub.verifiedGsb);
      if (sub.verifiedRthArea !== undefined && sub.verifiedRthArea !== null) setVerifiedRthArea(sub.verifiedRthArea);

      if (sub.evaluationChecklist && sub.evaluationChecklist.length > 0) {
        const mappedStates: typeof checklistStates = {};
        sub.evaluationChecklist.forEach((item) => {
          mappedStates[item.aspekCode] = {
            status: item.statusKelayakan as any,
            catatan: item.catatanVerifikator || '',
            attachmentUrl: item.attachmentUrl
          };
        });
        setChecklistStates(mappedStates);
      } else {
        // Inisialisasi awal default state checklist
        const defaultStates: typeof checklistStates = {};
        VERIFICATION_ASPECTS.forEach((aspect) => {
          defaultStates[aspect.code] = {
            status: 'Sesuai',
            catatan: ''
          };
        });
        setChecklistStates(defaultStates);
      }
    }
  }, [sub]);

  const mutation = useMutation({
    mutationFn: async ({
      status,
      notes,
      passphrase,
      signatureBase64,
      actionTypeOverride
    }: {
      status: SubmissionStatus;
      notes: string;
      passphrase?: string;
      signatureBase64?: string;
      actionTypeOverride?: 'APPROVE' | 'REJECT' | 'REVERT_TO_TECHNICAL' | 'REVERT_TO_ADMINISTRATIVE';
    }) => {
      // Map checklist items dari state lokal ke format yang diharapkan backend
      const checklistItemsPayload = Object.entries(checklistStatesMapped).map(([code, item]) => ({
        aspekCode: code,
        aspekLabel: item.aspekLabel,
        statusKelayakan: item.statusKelayakan,
        catatanVerifikator: item.catatanVerifikator,
        attachmentUrl: item.attachmentUrl
      }));

      return SubmissionService.updateStatus(
        sub?.id || '',
        status,
        `${userProfile.name} (${activeRole})`,
        notes,
        passphrase,
        signatureBase64,
        actionTypeOverride,
        kkpr_verdict_final,
        verified_kdb_final,
        verified_klb_final,
        verified_kdh_final,
        verified_gsb_final,
        verified_rth_area_final,
        checklistItemsPayload
      );
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['submission', id], exact: true }),
        queryClient.invalidateQueries({ queryKey: ['submissions'] })
      ]);
      setNotes('');
      setPassphrase('');
      setSignature('');
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

  // Canvas drawing handlers for signature pad
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoordinates(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
    isDrawingRef.current = true;
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoordinates(e, canvas);
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#0f172a'; // slate-900
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Export signature as base64 png
    const dataUrl = canvas.toDataURL('image/png');
    setSignature(dataUrl);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature('');
  };

  const getCoordinatesLocal = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    return getCoordinates(e, canvasRef.current);
  };
  const startDrawingLocal = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => startDrawing(e);
  const drawLocal = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => draw(e);
  const stopDrawingLocal = () => stopDrawing();

  // Helper variables for role-based conditional rendering
  const isAdminActive = effectiveRole === 'Admin SIPAS';
  const isTechActive = effectiveRole === 'Tim Teknis';
  const isKabidActive = effectiveRole === 'Kepala Bidang';

  const showAdminPanel = sub && isAdminActive && (sub.status === 'Menunggu Verifikasi' || sub.status === 'Verifikasi Administrasi');
  const showTechPanel = sub && isTechActive && sub.status === 'Verifikasi Teknis';
  const showKabidPanel = sub && isKabidActive && sub.status === 'Menunggu Persetujuan';

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

    if (approved) {
      if (!passphrase) {
        toast.error('Passphrase PIN TTE wajib diisi untuk melakukan pengesahan!');
        return;
      }
      if (passphrase.length < 6) {
        toast.error('Passphrase PIN TTE minimal 6 karakter!');
        return;
      }
      if (!signature) {
        toast.error('Tanda Tangan Pejabat wajib digambar pada pad drawer!');
        return;
      }
    }

    mutation.mutate({
      status: targetStatus,
      notes: notes.trim() || defaultNotes,
      passphrase: approved ? passphrase : undefined,
      signatureBase64: approved ? signature : undefined
    });
  };

  const handleRevertToTechnical = () => {
    if (!notes.trim()) {
      toast.error('Catatan alasan pengembalian wajib diisi sebelum mengembalikan berkas ke Tim Teknis.');
      return;
    }
    mutation.mutate({
      status: 'Verifikasi Teknis',
      notes: notes.trim(),
      actionTypeOverride: 'REVERT_TO_TECHNICAL'
    });
  };

  const handleRevertToAdministrative = () => {
    if (!notes.trim()) {
      toast.error('Catatan alasan pengembalian wajib diisi sebelum mengembalikan berkas ke Admin SIPAS.');
      return;
    }
    mutation.mutate({
      status: 'Verifikasi Administrasi',
      notes: notes.trim(),
      actionTypeOverride: 'REVERT_TO_ADMINISTRATIVE'
    });
  };

  const handleAdminActionLocal = (approved: boolean) => handleAdminAction(approved);
  const handleTechActionLocal = (approved: boolean) => handleTechAction(approved);
  const handleKabidActionLocal = (approved: boolean) => handleKabidAction(approved);

  // ── HANDLER PENGEMBALIAN INTERNAL: Kabid → Tim Teknis ──────────────────────
  const handleRevertToTechnicalLocal = () => handleRevertToTechnical();

  // ── HANDLER PENGEMBALIAN INTERNAL: Tim Teknis → Admin SIPAS ───────────────
  const handleRevertToAdministrativeLocal = () => handleRevertToAdministrative();

  // Handler Visualisasi Lahan Kompensasi pada Peta Spasial [Purworejo 8]
  const handleShowCompensationOnMap = (komp: LahanKompensasi) => {
    setActiveKompensasi(komp);

    const centroid = calculateCentroid(komp.polygon);
    flyTo({
      longitude: centroid[0],
      latitude: centroid[1],
      zoom: 17,
      pitch: 45
    });
    toast.info('GIS Engine memfokuskan kamera ke poligon lahan pengganti!');
  };

  // ─── REVISI: DYNAMIC CHECKLIST ACTIONS HANDLER (YES/NO/CONDITIONAL TOGGLE) ──
  const handleToggleAspect = (code: string, statusVal: 'Sesuai' | 'Sesuai Bersyarat' | 'Tidak Sesuai') => {
    setChecklistStates((prev) => ({
      ...prev,
      [code]: {
        ...prev[code],
        status: statusVal
      }
    }));
  };

  const handleAspectNoteChange = (code: string, noteVal: string) => {
    setChecklistStates((prev) => ({
      ...prev,
      [code]: {
        ...prev[code],
        catatan: noteVal
      }
    }));
  };

  const handleAspectAttachmentUpload = async (code: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setChecklistStates((prev) => ({
        ...prev,
        [code]: { ...prev[code], isUploading: true }
      }));

      const res = await uploadFileToBackend(file);
      setChecklistStates((prev) => ({
        ...prev,
        [code]: {
          ...prev[code],
          attachmentUrl: res.file_url,
          isUploading: false
        }
      }));
      toast.success(`Berhasil mengunggah dokumen pendukung aspek: ${file.name}`);
    } catch {
      setChecklistStates((prev) => ({
        ...prev,
        [code]: { ...prev[code], isUploading: false }
      }));
      toast.error('Gagal mengunggah berkas peninjauan teknis ke server.');
    }
  };

  // ─── PREPARE DTO SINKRONISASI MUTATION ───
  // Menyusun struktur checklist penampung state data form
  const checklistItemsForPayload = useMemo(() => {
    return VERIFICATION_ASPECTS.map((aspect) => {
      const state = checklistStates[aspect.code] || { status: 'Sesuai', catatan: '' };
      return {
        aspek_code: aspect.code,
        aspek_label: aspect.label,
        status_kelayakan: state.status,
        catatan_verifikator: state.catatan || null,
        attachment_url: state.attachmentUrl || null
      };
    });
  }, [checklistStates]);

  const handleTriggerSubmissionVerification = () => {
    if (kkprVerdict === 'Sesuai Bersyarat' && !notes.trim()) {
      toast.error('Catatan teknis bersyarat wajib dicantumkan pada kolom justifikasi global pimpinan.');
      return;
    }

    mutation.mutate({
      status: kkprVerdict === 'Sesuai' || kkprVerdict === 'Sesuai Bersyarat' ? 'Menunggu Persetujuan' : 'Ditolak',
      notes: notes.trim() || `Verifikasi spasial diselesaikan dengan keputusan final: ${kkprVerdict}.`
    });
  };

  // Bind values for mutation referencing
  const checklistStatesMapped = useMemo(() => {
    const map: Record<string, any> = {};
    VERIFICATION_ASPECTS.forEach((aspect) => {
      const state = checklistStates[aspect.code] || { status: 'Sesuai', catatan: '' };
      map[aspect.code] = {
        aspekLabel: aspect.label,
        statusModel: state.status,
        statusKelayakan: state.status,
        catatanVerifikator: state.catatan || null,
        attachmentUrl: state.attachmentUrl || null
      };
    });
    return map;
  }, [checklistStates]);

  const kkpr_verdict_final = kkprVerdict;
  const verified_kdb_final = verifiedKdb === '' ? undefined : Number(verifiedKdb);
  const verified_klb_final = verifiedKlb === '' ? undefined : Number(verifiedKlb);
  const verified_kdh_final = verifiedKdh === '' ? undefined : Number(verifiedKdh);
  const verified_gsb_final = verifiedGsb === '' ? undefined : Number(verifiedGsb);
  const verified_rth_area_final = verifiedRthArea === '' ? undefined : Number(verifiedRthArea);

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

  // SLA and Pause variables
  const isSlaPaused = sub.status === 'Ditolak' || sub.status === 'Draft';
  const slaDaysRemaining = sub.remaining_sla_days ?? 0;

  // ─── REVISI: INTERACTIVE SCORECARD UNTUK PEMOHON ───
  const hasRevisionIssues = sub.kkprVerdict === 'Sesuai Bersyarat' || sub.status === 'Ditolak';

  return (
    <div className="space-y-6 font-sans text-slate-700">

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

      {/* ─── BARU: INTERACTIVE SCORECARD KEPATUHAN SPASIAL PEMOHON ─── */}
      {effectiveRole === 'Pemohon' && hasRevisionIssues && (
        <div className="bg-white border border-border p-6 shadow-md text-left space-y-5 animate-in slide-in-from-top-2 duration-300">
          <div className="border-b border-border pb-3 flex justify-between items-center select-none">
            <div className="space-y-1">
              <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest leading-none block">Dinas Tata Ruang Verdict</span>
              <h3 className="text-sm font-bold text-slate-900 uppercase">Laporan Kepatuhan Tata Ruang (KKPR Scorecard)</h3>
            </div>
            <span className={cn(
              "px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-none leading-none border",
              sub.kkprVerdict === 'Sesuai Bersyarat' ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-rose-50 text-rose-700 border-rose-200"
            )}>
              {sub.kkprVerdict || 'Perlu Perbaikan'}
            </span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed text-justify">
            Berdasarkan hasil peninjauan dan kalkulasi ulang manual tim teknis dinas, rencana tapak Anda dinilai <strong className="font-bold text-slate-800">{sub.kkprVerdict === 'Sesuai Bersyarat' ? 'Dapat Disetujui dengan Ketentuan Khusus' : 'Belum Memenuhi Syarat Kepatuhan'}</strong>. Silakan tinjau rincian poin evaluasi berikut:
          </p>

          <div className="border border-slate-100 divide-y divide-slate-100">
            {sub.evaluationChecklist && sub.evaluationChecklist.length > 0 ? (
              sub.evaluationChecklist.map((item: any) => {
                const isCompliant = item.statusKelayakan === 'Sesuai';
                const isConditional = item.statusKelayakan === 'Sesuai Bersyarat';
                return (
                  <div key={item.aspekCode} className="p-3.5 flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <h4 className="text-xs font-bold text-slate-800">{item.aspekLabel}</h4>
                      {item.catatanVerifikator && (
                        <p className="text-xs text-slate-500 font-mono italic">"{item.catatanVerifikator}"</p>
                      )}
                      {item.attachmentUrl && (
                        <a
                          href={item.attachmentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block text-[10px] font-bold text-teal-600 hover:underline mt-1"
                        >
                          📥 Unduh Berkas Coretan Dinas
                        </a>
                      )}
                    </div>
                    <span className={cn(
                      "px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border leading-none rounded-none shrink-0",
                      isCompliant ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        isConditional ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-rose-50 text-rose-700 border-rose-200"
                    )}>
                      {item.statusKelayakan}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-slate-400">
                Pemeriksaan aspek spasial belum diselesaikan oleh tim teknis dinas.
              </div>
            )}
          </div>

          {sub.status === 'Ditolak' && (
            <div className="pt-3 border-t border-slate-100 text-right">
              <Link
                to={`/pengajuan/edit/${sub.id}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(220,38,38,0.15)] rounded-none decoration-none"
              >
                <FileSignature className="h-4 w-4" />
                Buka Form Revisi & Perbaiki Sekarang
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ─── SEKSI 2: CORE WORKSPACE GRID (SPLIT 2/3 DAN 1/3) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Kolom Kiri (2/3): Informasi Proyek & Berkas Laporan */}
        <div className="lg:col-span-2 space-y-6">

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

            {activeTab === 'audit' && (
              <div className="animate-in fade-in duration-200">
                <AuditTrailViewer submissionId={sub.id} />
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
                  onClick={() => handleAdminActionLocal(false)}
                  className="px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all rounded-none cursor-pointer"
                >
                  Tolak Berkas
                </button>
                <button
                  type="button"
                  disabled={mutation.isPending || !allAdminChecked}
                  onClick={() => handleAdminActionLocal(true)}
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
              <div className="pt-2 flex items-center justify-end gap-3 flex-wrap">
                {/* Kembalikan ke Admin — Jalur Revert Internal (amber) */}
                <button
                  type="button"
                  disabled={mutation.isPending}
                  onClick={handleRevertToAdministrativeLocal}
                  title="Kembalikan ke Admin SIPAS untuk perbaikan dokumen (SLA tetap berjalan)"
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-bold transition-all rounded-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 14 4 9 9 4" /><path d="M20 20v-7a4 4 0 0 0-4-4H4" />
                  </svg>
                  Kembalikan ke Admin
                </button>
                <button
                  type="button"
                  disabled={mutation.isPending}
                  onClick={() => handleTechActionLocal(false)}
                  className="px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all rounded-none cursor-pointer"
                >
                  Kembalikan untuk Revisi
                </button>
                <button
                  type="button"
                  disabled={mutation.isPending || !allTechChecked}
                  onClick={() => handleTechActionLocal(true)}
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

              {/* Tanda Tangan Canvas Pad */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className={labelClass}>Tanda Tangan Pejabat (TTD Drawer)</label>
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="text-[10px] text-rose-500 hover:text-rose-700 font-bold transition-colors cursor-pointer"
                  >
                    Hapus TTD
                  </button>
                </div>
                <div className="relative border border-slate-200 rounded-none bg-slate-50 overflow-hidden select-none">
                  <canvas
                    ref={canvasRef}
                    width={380}
                    height={150}
                    onMouseDown={startDrawingLocal}
                    onMouseMove={drawLocal}
                    onMouseUp={stopDrawingLocal}
                    onMouseLeave={stopDrawingLocal}
                    onTouchStart={startDrawingLocal}
                    onTouchMove={drawLocal}
                    onTouchEnd={stopDrawingLocal}
                    className="w-full h-[150px] cursor-crosshair touch-none bg-slate-50"
                  />
                  {!signature && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[11px] text-slate-400 font-medium">
                      Goreskan tanda tangan Anda di sini
                    </div>
                  )}
                </div>
              </div>

              {/* Tindakan */}
              <div className="pt-2 flex items-center justify-end gap-3 flex-wrap">
                {/* Kembalikan ke Tim Teknis — Jalur Revert Internal (amber) */}
                <button
                  type="button"
                  disabled={mutation.isPending}
                  onClick={handleRevertToTechnicalLocal}
                  title="Kembalikan ke Tim Teknis untuk klarifikasi teknis (SLA tetap berjalan)"
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-bold transition-all rounded-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 14 4 9 9 4" /><path d="M20 20v-7a4 4 0 0 0-4-4H4" />
                  </svg>
                  Kembalikan ke Tim Teknis
                </button>
                <button
                  type="button"
                  disabled={mutation.isPending}
                  onClick={() => handleKabidActionLocal(false)}
                  className="px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all rounded-none cursor-pointer"
                >
                  Tolak Pengesahan
                </button>
                <button
                  type="button"
                  disabled={mutation.isPending || !kabidAgreed}
                  onClick={() => handleKabidActionLocal(true)}
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