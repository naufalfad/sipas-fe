import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/app/store/useAuthStore';
import { SubmissionService } from '../services/submission.service';
import { Camera, MapPin, CheckCircle2, RotateCcw, CloudLightning, Loader2, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

interface InspectionLogFormProps {
  submissionId: string;
  onSuccess?: () => void;
}

export function InspectionLogForm({ submissionId, onSuccess }: InspectionLogFormProps) {
  const { user } = useAuthStore();
  const [inspectorName, setInspectorName] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // GPS States
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Logs List States
  const [logsList, setLogsList] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Offline caching status
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Webcam States
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (user?.full_name) {
      setInspectorName(user.full_name);
    } else if (user?.username) {
      setInspectorName(user.username);
    }
  }, [user]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Membersihkan webcam stream saat komponen unmount
  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [mediaStream]);

  const fetchLogs = () => {
    setLoadingLogs(true);
    SubmissionService.getGroundInspections(submissionId)
      .then((res) => {
        if (res && res.data) {
          setLogsList(res.data);
        }
      })
      .catch((err) => {
        console.error('Gagal memuat log inspeksi darat:', err);
      })
      .finally(() => {
        setLoadingLogs(false);
      });
  };

  useEffect(() => {
    fetchLogs();
  }, [submissionId]);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setMediaStream(stream);
      setIsWebcamActive(true);

      // Delay sesaat untuk memastikan video ref terpasang
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(err => {
            console.error('Webcam Play error:', err);
          });
        }
      }, 100);
    } catch (err: any) {
      console.error('Gagal menyalakan webcam:', err);
      toast.error(`Gagal mengaktifkan kamera laptop/webcam: ${err.message}`);
    }
  };

  const stopWebcam = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
    }
    setIsWebcamActive(false);
  };

  const capturePhotoFromWebcam = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Hilangkan pencerminan (mirroring) default browser
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setPhotoPreview(dataUrl);

      fetch(dataUrl)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], 'webcam_capture.jpg', { type: 'image/jpeg' });
          setPhoto(file);
          toast.success('Foto webcam berhasil ditangkap!');
        })
        .catch((err) => {
          console.error('Gagal memproses berkas biner dari webcam:', err);
          toast.error('Gagal memproses tangkapan gambar.');
        });
    }

    stopWebcam();
  };

  const handleGetLocation = () => {
    if (!('geolocation' in navigator)) {
      toast.error('Perangkat Anda tidak mendukung fitur Geolocation GPS.');
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
        setGpsLoading(false);
        toast.success('Koordinat GPS berhasil diperoleh!', {
          description: `Lat: ${position.coords.latitude.toFixed(6)}, Lng: ${position.coords.longitude.toFixed(6)}`,
        });
      },
      (error) => {
        setGpsLoading(false);
        console.error('Gagal mendeteksi lokasi GPS:', error);
        toast.error(`Gagal mendeteksi lokasi GPS: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        toast.error('Ukuran foto melebihi batas 20MB.');
        return;
      }
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inspectorName.trim()) {
      toast.warning('Nama petugas verifikator wajib diisi.');
      return;
    }
    if (!photo) {
      toast.warning('Foto bukti kunjungan fisik lapangan wajib diambil.');
      return;
    }
    if (lat === null || lng === null) {
      toast.warning('Koordinat GPS lokasi wajib terdeteksi terlebih dahulu.');
      return;
    }

    // Jika offline, simpan data ke local storage
    if (isOffline) {
      const offlineLog = {
        submissionId,
        inspectorName,
        notes,
        lat,
        lng,
        photoBase64: photoPreview,
        photoName: photo.name,
        photoType: photo.type,
        timestamp: new Date().toISOString()
      };

      try {
        const existingLogs = JSON.parse(localStorage.getItem('offline_inspection_logs') || '[]');
        existingLogs.push(offlineLog);
        localStorage.setItem('offline_inspection_logs', JSON.stringify(existingLogs));
        toast.success('Penyimpanan Lokal Offline Berhasil!', {
          description: 'Aplikasi sedang offline. Data kunjungan disimpan di HP Anda, silakan unggah saat mendapat sinyal.',
        });
        resetForm();
        if (onSuccess) onSuccess();
      } catch (err) {
        toast.error('Gagal menyimpan data kunjungan secara offline.');
      }
      return;
    }

    // Jalankan pengunggahan online langsung ke server
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('inspector_name', inspectorName);
      formData.append('latitude', String(lat));
      formData.append('longitude', String(lng));
      formData.append('notes', notes);
      formData.append('photo', photo);

      await SubmissionService.createGroundInspection(submissionId, formData);
      toast.success('Log kunjungan lapangan darat berhasil diunggah!', {
        description: 'TTE presensi terekam secara geospasial di database.',
      });
      resetForm();
      fetchLogs();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(`Gagal mengunggah laporan kunjungan darat: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setNotes('');
    setPhoto(null);
    setPhotoPreview(null);
    setLat(null);
    setLng(null);
  };

  return (
    <div className="space-y-6 text-left select-none font-sans bg-white">
      {/* TITLE & HEADER */}
      <div className="border-b border-slate-200 pb-2.5">
        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <Camera size={15} className="text-primary" />
          Input Bukti Kunjungan Lapangan Darat (Ground Inspection)
        </h4>
        <span className="text-[10px] text-slate-450 block mt-1">
          Verifikasi kehadiran fisik petugas di area koordinat tapak secara presisi
        </span>
      </div>

      {/* PANDUAN INSPEKSI DARAT (Flat Panel) */}
      <div className="p-3.5 bg-slate-50 border-l-2 border-slate-400 text-slate-700 text-[10px] space-y-1.5 leading-relaxed">
        <span className="font-bold uppercase text-slate-800 flex items-center gap-1.5">
          <HelpCircle size={13} className="text-slate-500" />
          Langkah Kerja Tim Inspeksi Darat:
        </span>
        <ol className="list-decimal pl-4 space-y-1 text-slate-500">
          <li>Kunci berkas pengajuan di kantor (Portal Desktop) sebelum berangkat ke lapangan.</li>
          <li>Kunjungi titik fisik lahan proyek (seperti patok batas BPN, area RTH, atau lebar PSU jalan).</li>
          <li>Ambil foto objek tersebut di tempat. <strong>Hanya kamera aktif perangkat HP atau Webcam Laptop yang diperbolehkan</strong> (mencegah manipulasi foto).</li>
          <li>Klik tombol <strong>Dapatkan Lokasi GPS</strong> untuk merekam titik koordinat eksak tempat Anda berdiri.</li>
          <li>Klik <strong>Unggah Bukti Kunjungan</strong>. Silakan ambil beberapa foto di titik koordinat berbeda sepanjang bidang lahan.</li>
        </ol>
      </div>

      {isOffline && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] flex items-center gap-2">
          <CloudLightning size={14} className="animate-pulse" />
          <span>Aplikasi dalam mode offline. Data kunjungan disimpan sementara di memori HP.</span>
        </div>
      )}

      {/* FORM INPUT FIELDS */}
      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
        {/* INPUT NAMA PETUGAS */}
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nama Verifikator Lapangan</label>
          <input
            type="text"
            value={inspectorName}
            onChange={(e) => setInspectorName(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary rounded-none font-sans"
            placeholder="Masukkan nama lengkap petugas..."
            required
          />
        </div>

        {/* KAMERA DIRECT CAPTURE & WEBCAM */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Dokumentasi Foto Lapangan (Geotagged)</label>

          {isWebcamActive ? (
            <div className="space-y-2 border border-slate-300 p-2.5 bg-black">
              <video
                ref={videoRef}
                className="w-full aspect-video object-cover bg-black"
                style={{ transform: 'scaleX(-1)' }}
                playsInline
                muted
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={capturePhotoFromWebcam}
                  className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-none border-none cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Camera size={13} />
                  <span>Ambil Foto</span>
                </button>
                <button
                  type="button"
                  onClick={stopWebcam}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-none border border-slate-700 cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </div>
          ) : photoPreview ? (
            <div className="relative border border-slate-200 bg-black aspect-video flex items-center justify-center overflow-hidden">
              <img src={photoPreview} alt="Pratinjau Kunjungan" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => {
                  setPhoto(null);
                  setPhotoPreview(null);
                }}
                className="absolute bottom-2.5 right-2.5 px-2.5 py-1.5 bg-rose-600 text-white font-bold text-[9px] uppercase tracking-wider flex items-center gap-1 rounded-none border-none cursor-pointer"
              >
                <RotateCcw size={10} /> Hapus &amp; Ulangi
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <label className="border border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 transition-colors py-6 flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center">
                <Camera size={24} className="text-slate-450" />
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Pilih File Foto</span>
                <span className="text-[8.5px] text-slate-400">Gunakan Kamera HP / Uploader Berkas</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={startWebcam}
                className="border border-slate-350 bg-slate-900 hover:bg-slate-800 transition-colors py-6 flex flex-col items-center justify-center gap-2 cursor-pointer text-center text-white"
              >
                <Camera size={24} className="text-teal-400" />
                <span className="text-[10px] font-bold uppercase tracking-wide">Gunakan Webcam Laptop</span>
                <span className="text-[8.5px] text-slate-300">Nyalakan Kamera Depan PC / Laptop</span>
              </button>
            </div>
          )}
        </div>

        {/* GPS CAPTURE */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Deteksi Koordinat GPS Lapangan</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={gpsLoading}
              className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5 rounded-none border-none cursor-pointer transition-colors disabled:opacity-50"
            >
              {gpsLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <MapPin size={12} className="text-teal-400" />
              )}
              <span>Dapatkan Lokasi GPS</span>
            </button>
            {lat !== null && lng !== null && (
              <div className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-800 flex items-center gap-1.5 text-[10px] font-mono font-bold leading-tight">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                <div className="text-left">
                  <div>LAT: {lat.toFixed(6)}</div>
                  <div>LNG: {lng.toFixed(6)}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CATATAN SURVEI */}
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Catatan Tambahan / Temuan Lapangan</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Tuliskan keterangan detail kondisi rona fisik lapangan (contoh: patok batas barat, kondisi RTH, ROW lebar jalan rencana, dll)..."
            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary rounded-none font-sans"
          />
        </div>

        {/* ACTION SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={isSubmitting || gpsLoading || isWebcamActive}
          className="w-full py-2.5 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-none border-none transition-colors cursor-pointer hover:bg-primary/95 disabled:opacity-50 shadow-md flex items-center justify-center gap-2"
        >
          {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          <span>{isOffline ? 'Simpan Offline' : 'Unggah Bukti Kunjungan Darat'}</span>
        </button>
      </form>

      {/* RIWAYAT UNGGAHAN SESI INI (Divider-separated List) */}
      <div className="border-t border-slate-200 pt-4 space-y-2 select-none">
        <h5 className="text-[10px] font-black text-slate-800 uppercase tracking-widest block text-left">
          Daftar Bukti Kunjungan Darat Terunggah ({logsList.length})
        </h5>

        {loadingLogs ? (
          <div className="flex justify-center py-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
          </div>
        ) : logsList.length === 0 ? (
          <div className="p-2 text-[9px] text-slate-400 text-center italic">
            Belum ada dokumentasi foto darat yang diunggah untuk berkas ini.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto max-w-xl">
            {logsList.map((log) => (
              <div key={log.id} className="py-2.5 flex items-center gap-2.5 text-[10px] first:pt-0 last:pb-0">
                <img src={log.photoUrl} alt="Foto Kunjungan" className="w-10 h-8 object-cover border border-slate-100 shrink-0" />
                <div className="flex-1 text-left min-w-0">
                  <span className="font-bold text-slate-700 block truncate">{log.notes || 'Foto Bukti Kunjungan'}</span>
                  <span className="text-[8.5px] text-slate-450 block mt-0.5 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString('id-ID')} • Dev: {log.distanceMeters !== null && log.distanceMeters !== undefined ? `${log.distanceMeters.toFixed(1)}m` : '—'}
                  </span>
                </div>
                <div>
                  {log.isVerified ? (
                    <span className="text-[8px] font-black text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded-none">LOKASI SESUAI</span>
                  ) : (
                    <span className="text-[8px] font-black text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-none">DI LUAR LOKASI</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PENYELESAIAN TUGAS LAPANGAN (Subtle Info Board) */}
      {logsList.length > 0 && (
        <div className="p-3.5 bg-slate-50 border-l-2 border-teal-600 text-slate-700 text-[10px] space-y-1.5 text-left select-none max-w-xl">
          <span className="font-bold uppercase flex items-center gap-1.5 text-teal-800">
            <CheckCircle2 size={13} className="text-teal-600" />
            Bukti Darat Dikunci
          </span>
          <p className="leading-relaxed text-slate-500 text-[9.5px]">
            Dokumentasi rona darat lapangan geotagged telah terunggah dengan aman ke server. Silakan lengkapi juga ulasan **Sidak Udara Drone** (jika diwajibkan untuk kategori perumahan/industri) sebelum mengajukan draf ulasan Telaah Staf ke Kepala Bidang.
          </p>
        </div>
      )}
    </div>
  );
}