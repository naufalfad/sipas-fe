import React, { useState, useRef } from 'react';
import { useConfigStore } from '@/app/store/useConfigStore';
import { toast } from 'sonner';
import {
  Settings,
  Clock,
  Image,
  AlertOctagon,
  Plus,
  Trash2,
  Sliders,
  Sparkles,
  Eye,
  Upload
} from 'lucide-react';

export default function ConfigPage() {
  const {
    sessionDuration,
    idleTimeout,
    isMaintenance,
    maintenanceMessage,
    slideBanners,
    rotationInterval,
    fetchConfig,
    updateSessionConfig,
    toggleMaintenanceMode,
    addSlide,
    deleteSlide,
    updateRotationInterval,
    appName,
    appLogo,
    updateBrandingConfig,
    mapCenterLat,
    mapCenterLng,
    mapZoom,
    updateMapConfig
  } = useConfigStore();

  const [activeTab, setActiveTab] = useState<'sesi' | 'banner' | 'pemeliharaan' | 'branding'>('sesi');

  // ── Sesi States ──
  const [sessDur, setSessDur] = useState(sessionDuration);
  const [idleTime, setIdleTime] = useState(idleTimeout);

  // ── Slide States ──
  const [newTitle, setNewTitle] = useState('');
  const [newSub, setNewSub] = useState('');
  const [newImgFile, setNewImgFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rotSec, setRotSec] = useState(rotationInterval);
  const [cropFocal, setCropFocal] = useState<'center' | 'top' | 'bottom'>('center');
  const [imgZoom, setImgZoom] = useState(100);
  const [newOpacity, setNewOpacity] = useState(40);

  // ── Maintenance States ──
  const [maintActive, setMaintActive] = useState(isMaintenance);
  const [maintMsg, setMaintMsg] = useState(maintenanceMessage);

  // ── Branding States ──
  const [logoImg, setLogoImg] = useState<string | null>(appLogo || null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // ── Map Center States ──
  const [cLat, setCLat] = useState(mapCenterLat || -6.4816);
  const [cLng, setCLng] = useState(mapCenterLng || 106.8560);
  const [cZoom, setCZoom] = useState(mapZoom || 11);



  // ── Fetch & Sync Hooks ──
  React.useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  React.useEffect(() => {
    setSessDur(sessionDuration);
    setIdleTime(idleTimeout);
    setRotSec(rotationInterval);
    setMaintActive(isMaintenance);
    setMaintMsg(maintenanceMessage);
    setLogoImg(appLogo || null);
    setCLat(mapCenterLat || -6.4816);
    setCLng(mapCenterLng || 106.8560);
    setCZoom(mapZoom || 11);
  }, [sessionDuration, idleTimeout, rotationInterval, isMaintenance, maintenanceMessage, appName, appLogo, mapCenterLat, mapCenterLng, mapZoom]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Ukuran logo terlalu besar! Maksimal 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoImg(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateBrandingConfig("GEOSIPAS", logoImg);
      await updateMapConfig(Number(cLat), Number(cLng), Number(cZoom));
      toast.success('Pengaturan logo aplikasi dan parameter peta GIS berhasil diperbarui!');
    } catch (err) {
      toast.error('Gagal memperbarui pengaturan.');
    }
  };

  // ── 1. Handle Sesi Save ──
  const handleSaveSesi = (e: React.FormEvent) => {
    e.preventDefault();
    updateSessionConfig(sessDur, idleTime);
    toast.success('Konfigurasi sesi berhasil diperbarui!');
  };

  // ── 2. Handle Maintenance Save ──
  const handleSaveMaint = (e: React.FormEvent) => {
    e.preventDefault();
    toggleMaintenanceMode(maintActive, maintMsg);
    if (maintActive) {
      toast.warning('Mode Pemeliharaan Aktif! Seluruh pengguna selain Super Admin akan segera dikeluarkan.');
    } else {
      toast.success('Mode Pemeliharaan Dinonaktifkan. Seluruh pengguna dapat kembali mengakses sistem.');
    }
  };

  // ── 3. Handle Local Image Upload (Base64) ──
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Ukuran file terlalu besar! Maksimal 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImgFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // ── 4. Add New Slide ──
  const handleAddSlide = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newSub || !newImgFile) {
      toast.error('Judul, subjudul, dan file gambar wajib diisi!');
      return;
    }

    addSlide({
      imageUrl: newImgFile,
      title: newTitle,
      subtitle: newSub,
      opacity: newOpacity
    });

    toast.success('Slide banner baru berhasil ditambahkan!');
    setNewTitle('');
    setNewSub('');
    setNewImgFile(null);
    setNewOpacity(40);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getFocalClass = (focal: 'center' | 'top' | 'bottom') => {
    if (focal === 'top') return 'object-top';
    if (focal === 'bottom') return 'object-bottom';
    return 'object-center';
  };

  return (
    <div className="space-y-6 font-sans">
      {/* ─── HEADER HALAMAN ─── */}
      <div className="text-left select-none">
        <h1 className="text-2xl font-bold text-[#111D13] leading-none flex items-center gap-2.5">
          <Settings className="h-6 w-6 text-primary" />
          Konfigurasi & Pengaturan Sistem
        </h1>
        <p className="text-xs text-slate-500 mt-2">
          Pusat kontrol wewenang Super Admin untuk mengatur parameter operasional sesi dinas, banner dinamis, dan pemeliharaan sistem.
        </p>
      </div>

      {/* ─── NAVIGATION TABS ─── */}
      <div className="flex border-b border-slate-200">
        {[
          { id: 'sesi', label: 'Konfigurasi Sesi', icon: Clock },
          { id: 'banner', label: 'Slide Banner & Slideshow', icon: Image },
          { id: 'pemeliharaan', label: 'Mode Pemeliharaan', icon: AlertOctagon },
          { id: 'branding', label: 'Referensi Logo & Titik Peta', icon: Sliders }
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center space-x-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer outline-none border-transparent ${isActive
                ? 'border-primary text-primary bg-[#e8f2ea]/20'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
            >
              <Icon className="h-4 w-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── TAB CONTENT: CONFIG SESI ─── */}
      {activeTab === 'sesi' && (
        <div className="bg-white border border-border p-6 shadow-[1px_1px_3px_rgba(0,0,0,0.015)] rounded-none text-left max-w-2xl">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b pb-3 mb-4">
            <Clock className="h-4.5 w-4.5 text-primary" />
            Pengaturan Masa Aktif & Idle Timeout Sesi
          </h3>

          <form onSubmit={handleSaveSesi} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Masa Berlaku Token Sesi Backend (JWT Duration) *</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  required
                  min={10}
                  max={1440}
                  value={sessDur}
                  onChange={(e) => setSessDur(Number(e.target.value))}
                  className="w-32 border border-slate-200 bg-slate-50 p-2 text-xs focus:outline-none focus:bg-white focus:border-primary font-semibold"
                />
                <span className="text-xs text-slate-500">Menit (Default: 120 Menit / 2 Jam)</span>
              </div>
              <p className="text-[10px] text-slate-400">Menentukan waktu kedaluwarsa token keamanan backend sebelum meminta pengguna log in kembali.</p>
            </div>

            <div className="space-y-2 border-t pt-4">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Batas Waktu Pengguna Pasif (Idle Timeout Inactivity) *</label>
              <div className="flex items-center space-x-3">
                <input
                  type="range"
                  min={1}
                  max={60}
                  value={idleTime}
                  onChange={(e) => setIdleTime(Number(e.target.value))}
                  className="flex-1 accent-primary h-1 bg-slate-100"
                />
                <span className="text-xs font-bold text-primary bg-secondary px-2.5 py-1 border border-border w-16 text-center shrink-0">
                  {idleTime} Menit
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Jika pengguna tidak melakukan aktivitas mouse/keyboard selama waktu ini, aplikasi otomatis memutus sesi login demi alasan keamanan.</p>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <button
                type="submit"
                className="px-5 py-2.5 bg-primary hover:bg-primary/95 text-white text-xs font-semibold rounded-none shadow-[2px_2px_0px_rgba(65,93,67,0.15)] transition-all cursor-pointer border border-primary"
              >
                Simpan Pengaturan Sesi
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── TAB CONTENT: BANNER SLIDESHOW ─── */}
      {activeTab === 'banner' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">

          {/* Kolom Kiri: Form Add Banner */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-border p-6 shadow-[1px_1px_3px_rgba(0,0,0,0.015)] rounded-none">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b pb-3 mb-4">
                <Plus className="h-4.5 w-4.5 text-primary" />
                Tambah Slide Banner Baru
              </h3>

              <form onSubmit={handleAddSlide} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Judul Slide (Title) *</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Sistem Informasi Tata Ruang Bogor"
                    className="w-full border border-slate-200 bg-slate-50 p-2 text-xs focus:outline-none focus:bg-white focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Keterangan Singkat (Subtitle) *</label>
                  <input
                    type="text"
                    required
                    value={newSub}
                    onChange={(e) => setNewSub(e.target.value)}
                    placeholder="Memudahkan monitoring evaluasi site plan digital dengan integrasi spasial."
                    className="w-full border border-slate-200 bg-slate-50 p-2 text-xs focus:outline-none focus:bg-white focus:border-primary"
                  />
                </div>

                {/* File Image Upload */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-3">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">File Gambar Background (Maks. 2MB) *</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        className="hidden"
                        id="banner-image-upload"
                      />
                      <label
                        htmlFor="banner-image-upload"
                        className="inline-flex items-center space-x-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold rounded-none cursor-pointer transition-colors"
                      >
                        <Upload className="h-4 w-4" />
                        <span>Pilih File Gambar</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Opacity Gambar Slide ({newOpacity}%)</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={newOpacity}
                        onChange={(e) => setNewOpacity(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <span className="text-[11px] font-bold text-slate-600 w-8">{newOpacity}%</span>
                    </div>
                  </div>

                  {/* Focal Point crop controller */}
                  {newImgFile && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Fokus Penyesuaian Gambar (Crop Alignment)</label>
                      <div className="flex space-x-1.5">
                        {['top', 'center', 'bottom'].map((f) => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => setCropFocal(f as any)}
                            className={`px-3 py-1 text-[10px] font-bold uppercase border cursor-pointer ${cropFocal === f
                              ? 'bg-primary text-white border-primary'
                              : 'bg-slate-50 text-slate-500 border-slate-200'
                              }`}
                          >
                            {f === 'top' ? 'Atas' : f === 'center' ? 'Tengah' : 'Bawah'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* ADVANCED PREVIEW SIMULATOR CONTAINER */}
                {newImgFile && (
                  <div className="space-y-2 pt-2 border-t">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 leading-none">
                      <Eye className="h-3.5 w-3.5 text-[#415D43]" />
                      Pratinjau Simulator Banner Dashboard (Live Preview)
                    </label>

                    {/* Simulated Banner Container */}
                    <div className="relative w-full h-44 overflow-hidden border bg-[#111D13] text-white">
                      {/* Background Image */}
                      <img
                        src={newImgFile}
                        alt="Preview Background"
                        className={`absolute inset-0 w-full h-full object-cover ${getFocalClass(cropFocal)}`}
                        style={{
                          transform: `scale(${imgZoom / 100})`,
                          opacity: newOpacity / 100
                        }}
                      />

                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-[#111D13]/90 via-[#111D13]/70 to-transparent" />

                      {/* Foreground Layout Elements */}
                      <div className="absolute inset-0 flex flex-col justify-between p-4 z-10 text-left">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1 text-accent">
                            <Sparkles className="h-3.5 w-3.5 text-[#A1CCA5]" />
                            <span className="text-[9px] font-bold uppercase tracking-wider text-[#A1CCA5]">
                              Selamat Pagi, Super Administrator!
                            </span>
                          </div>
                          <span className="px-2 py-0.5 bg-white/10 text-[8px] font-bold tracking-wider uppercase border border-white/20">
                            Aktor: Super Admin
                          </span>
                        </div>

                        <div className="space-y-1 py-2 max-w-sm">
                          <h4 className="text-sm font-extrabold tracking-tight text-white leading-tight">
                            {newTitle || 'Masukan Judul Banner'}
                          </h4>
                          <p className="text-[9px] text-slate-200 leading-snug">
                            {newSub || 'Masukan keterangan pelengkap di atas.'}
                          </p>
                        </div>

                        <div className="flex justify-between items-center border-t border-white/10 pt-1.5">
                          <div className="flex space-x-1">
                            <span className="h-1 bg-accent w-5" />
                            <span className="h-1 bg-white/40 w-1" />
                            <span className="h-1 bg-white/40 w-1" />
                          </div>
                          <span className="text-[8px] text-slate-400">Jeda: {rotSec} Detik</span>
                        </div>
                      </div>
                    </div>

                    {/* Scale zoom simulator slider */}
                    <div className="flex items-center space-x-2 pt-1">
                      <label className="text-[9px] font-bold text-slate-400">Zoom Gambar:</label>
                      <input
                        type="range"
                        min="100"
                        max="150"
                        value={imgZoom}
                        onChange={(e) => setImgZoom(Number(e.target.value))}
                        className="flex-1 accent-primary h-1 bg-slate-100"
                      />
                      <span className="text-[9px] font-mono text-slate-500">{imgZoom}%</span>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-4 border-t">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-primary hover:bg-primary/95 text-white text-xs font-semibold rounded-none shadow-[2px_2px_0px_rgba(65,93,67,0.15)] transition-all cursor-pointer border border-primary"
                  >
                    Tambahkan Slide Banner
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Kolom Kanan: List Slides & Rotation Timer */}
          <div className="space-y-6">
            {/* Interval Timer Setting */}
            <div className="bg-white border border-border p-5 rounded-none shadow-[1px_1px_3px_rgba(0,0,0,0.015)]">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b mb-3">
                <Sliders className="h-4 w-4 text-primary" />
                Durasi Rotasi Slideshow
              </h4>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min={2}
                  max={60}
                  value={rotSec}
                  onChange={(e) => {
                    setRotSec(Number(e.target.value));
                    updateRotationInterval(Number(e.target.value));
                  }}
                  className="w-20 border border-slate-200 bg-slate-50 p-2 text-xs focus:outline-none focus:bg-white focus:border-primary font-bold text-center"
                />
                <span className="text-xs text-slate-500">Detik per Gambar</span>
              </div>
              <p className="text-[9px] text-slate-400 mt-2 leading-relaxed">Kecepatan pergantian otomatis antar slide background di dashboard utama.</p>
            </div>

            {/* List slides */}
            <div className="bg-white border border-border p-5 rounded-none shadow-[1px_1px_3px_rgba(0,0,0,0.015)] space-y-4">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-2 border-b">
                Slide Aktif ({slideBanners.length})
              </h4>

              <div className="space-y-3 max-h-80 overflow-y-auto divide-y">
                {slideBanners.map((slide) => (
                  <div key={slide.id} className="pt-3 first:pt-0 flex space-x-3 items-start justify-between">
                    <img
                      src={slide.imageUrl}
                      alt={slide.title}
                      className="w-12 h-12 object-cover border border-slate-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-xs text-slate-800 truncate">{slide.title}</h5>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{slide.subtitle}</p>
                      <span className="inline-block px-1.5 py-0.5 bg-slate-100 border text-slate-500 font-bold text-[8px] tracking-wide uppercase mt-1">
                        Opacity: {slide.opacity !== undefined ? slide.opacity : 40}%
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        if (slideBanners.length === 1) {
                          toast.error('Gagal: Minimal harus menyisakan 1 slide banner aktif.');
                          return;
                        }
                        deleteSlide(slide.id);
                        toast.success('Slide banner berhasil dihapus.');
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors border-none bg-transparent cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ─── TAB CONTENT: MAINTENANCE MODE ─── */}
      {activeTab === 'pemeliharaan' && (
        <div className="bg-white border border-border p-6 shadow-[1px_1px_3px_rgba(0,0,0,0.015)] rounded-none text-left max-w-2xl">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b pb-3 mb-4">
            <AlertOctagon className="h-4.5 w-4.5 text-rose-600" />
            Manajemen Status Pemeliharaan Aplikasi
          </h3>

          <form onSubmit={handleSaveMaint} className="space-y-6">
            {/* Toggle Switch */}
            <div className="flex items-center justify-between border-b pb-4">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-800">Aktifkan Mode Pemeliharaan (Maintenance Mode)</span>
                <p className="text-[10px] text-slate-400 max-w-md">Ketika diaktifkan, seluruh sesi login non-admin akan diputus secara paksa (auto-kick), dan mereka dilarang mengakses sistem hingga status dimatikan kembali.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={maintActive}
                  onChange={(e) => setMaintActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
              </label>
            </div>

            {/* Custom message */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Pesan Pemeliharaan Kustom (Custom Notice Message) *</label>
              <textarea
                required
                rows={4}
                value={maintMsg}
                onChange={(e) => setMaintMsg(e.target.value)}
                placeholder="Tuliskan alasan pemeliharaan sistem di sini agar dibaca oleh pengguna yang terkick..."
                className="w-full border border-slate-200 bg-slate-50 p-2.5 text-xs focus:outline-none focus:bg-white focus:border-primary font-medium"
              />
              <p className="text-[9px] text-slate-400">Pesan ini akan langsung disajikan di tengah layar pemeliharaan premium pengguna.</p>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <button
                type="submit"
                className={`px-5 py-2.5 text-white text-xs font-semibold rounded-none shadow-[2px_2px_0px_rgba(0,0,0,0.15)] transition-all cursor-pointer border ${maintActive
                  ? 'bg-rose-600 hover:bg-rose-700 border-rose-700'
                  : 'bg-primary hover:bg-primary/95 border-primary'
                  }`}
              >
                {maintActive ? 'Aktifkan Mode Pemeliharaan' : 'Simpan Konfigurasi Pemeliharaan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── TAB CONTENT: BRANDING IDENTITAS & LOGO ─── */}
      {activeTab === 'branding' && (
        <div className="bg-white border border-border p-6 shadow-[1px_1px_3px_rgba(0,0,0,0.015)] rounded-none text-left max-w-2xl animate-in fade-in duration-300 space-y-6">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b pb-3">
            <Sliders className="h-4.5 w-4.5 text-primary" />
            Pengaturan Referensi Logo & Titik Tengah Peta GIS
          </h3>

          <form onSubmit={handleSaveBranding} className="space-y-6">
            {/* Bagian 1: Branding */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider">1. Referensi Logo Pada Dokumen Cetak</h4>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Referensi Logo Dokumen Cetak (.png, .jpg, .svg)
                </label>
                <div className="flex items-center space-x-4">
                  <div className="h-20 w-20 border border-slate-200 bg-slate-50 flex items-center justify-center p-2 overflow-hidden relative group shrink-0">
                    {logoImg ? (
                      <>
                        <img src={logoImg} alt="Preview Logo" className="h-full w-full object-contain" />
                        <button
                          type="button"
                          onClick={() => setLogoImg(null)}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity cursor-pointer border-none"
                        >
                          Hapus
                        </button>
                      </>
                    ) : (
                      <span className="text-[9px] font-bold text-slate-400 text-center">No Logo (Default)</span>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      ref={logoInputRef}
                      onChange={handleLogoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="border border-slate-200 hover:border-slate-400 bg-white hover:bg-slate-50 px-4.5 py-2 text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 text-slate-700 outline-none"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>Pilih Berkas Gambar</span>
                    </button>
                    <p className="text-[9px] text-slate-400 leading-normal">
                      Format yang didukung: PNG, JPEG, SVG. Maksimal ukuran berkas 2MB. Logo ini akan dicetak pada kop surat Laporan Eksekutif PDF.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bagian 2: GIS Map Center */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider">2. Titik Tengah Default Peta GIS</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Tentukan koordinat geografis (Latitude & Longitude) serta tingkat Zoom level default yang akan digunakan saat pertama kali peta GIS interaktif dibuka.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Latitude (Garis Lintang) *</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={cLat}
                    onChange={(e) => setCLat(Number(e.target.value))}
                    required
                    className="w-full border border-slate-200 px-3.5 py-2 text-xs focus:outline-none focus:border-primary font-medium"
                    placeholder="Contoh: -6.4816"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Longitude (Garis Bujur) *</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={cLng}
                    onChange={(e) => setCLng(Number(e.target.value))}
                    required
                    className="w-full border border-slate-200 px-3.5 py-2 text-xs focus:outline-none focus:border-primary font-medium"
                    placeholder="Contoh: 106.8560"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Zoom Level (4 - 18) *</label>
                  <input
                    type="number"
                    min="4"
                    max="18"
                    value={cZoom}
                    onChange={(e) => setCZoom(Number(e.target.value))}
                    required
                    className="w-full border border-slate-200 px-3.5 py-2 text-xs focus:outline-none focus:border-primary font-medium"
                    placeholder="Contoh: 11"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t flex justify-end">
              <button
                type="submit"
                className="bg-primary hover:bg-primary/95 text-white px-5 py-2 text-xs font-black transition-all cursor-pointer shadow-sm active:scale-[0.98] outline-none"
              >
                Simpan Perubahan Pengaturan
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
