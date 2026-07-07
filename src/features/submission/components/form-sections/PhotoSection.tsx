import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { CheckCircle2, Loader2, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import type { FullSubmissionFormValues } from '../../schemas/submissionFormSchema';
import { uploadFileToBackend } from '../../utils/upload';

export const PhotoSection = () => {
  const { watch, setValue } = useFormContext<FullSubmissionFormValues>();

  const getPhotoFieldKey = (dir: string) => {
    if (dir.includes('Utara')) return 'photo.photoNorth';
    if (dir.includes('Selatan')) return 'photo.photoSouth';
    if (dir.includes('Timur')) return 'photo.photoEast';
    if (dir.includes('Barat')) return 'photo.photoWest';
    return 'photo.photoAccess';
  };

  const [isUploading, setIsUploading] = useState<Record<string, boolean>>({});

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>, fieldKey: any) => {
    const file = e.target.files?.[0];
    if (file) {
      // Batasan ukuran berkas 20MB secara ketat
      const MAX_FILE_SIZE = 20 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        toast.error('Berkas terlalu besar! Batas ukuran maksimal adalah 20MB.');
        return;
      }

      try {
        setIsUploading(prev => ({ ...prev, [fieldKey]: true }));
        const uploadResult = await uploadFileToBackend(file);
        setValue(fieldKey, `${uploadResult.file_url}?name=${encodeURIComponent(file.name)}`);
        toast.success(`Berhasil mengunggah foto: ${file.name}`);
      } catch (err) {
        toast.error('Gagal mengunggah foto ke server');
      } finally {
        setIsUploading(prev => ({ ...prev, [fieldKey]: false }));
      }
    }
  };

  const handleClearPhoto = (fieldKey: any) => {
    setValue(fieldKey, undefined);
  };

  const triggerPhotoInput = (idx: number) => {
    const input = document.getElementById(`photo-upload-${idx}`) as HTMLInputElement;
    if (input) {
      input.click();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header Bagian - Bersih & Tanpa Label Nomor Langkah */}
      <div className="border-b border-border pb-3">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
          <CheckCircle2 className="h-4.5 w-4.5 text-primary" />
          Bukti Foto Kondisi Fisik Lapangan
        </h3>
        <p className="text-[10px] text-slate-400 mt-1">
          Sertakan dokumentasi foto kondisi riil rona tapak di lapangan dari 5 penjuru arah mata angin.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-left">
        {['Sisi Utara', 'Sisi Selatan', 'Sisi Timur', 'Sisi Barat', 'Akses Jalan Utama'].map((dir, idx) => {
          const fieldKey = getPhotoFieldKey(dir);
          const fileValue = watch(fieldKey as any);

          return (
            <div key={idx} className="relative group aspect-square border border-border bg-white overflow-hidden select-none rounded-none">
              <input
                type="file"
                id={`photo-upload-${idx}`}
                className="hidden"
                onChange={(e) => handlePhotoChange(e, fieldKey)}
                accept="image/*"
              />

              {isUploading[fieldKey] ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 bg-slate-50">
                  <Loader2 className="h-5 w-5 text-primary mb-2 animate-spin" />
                  <p className="text-[8px] text-slate-400 uppercase tracking-wider">Mengunggah...</p>
                </div>
              ) : fileValue ? (
                <div className="relative w-full h-full flex flex-col items-center justify-center p-1.5 animate-in zoom-in-95 duration-200">
                  <img
                    src={fileValue instanceof File ? URL.createObjectURL(fileValue) : fileValue}
                    alt={dir}
                    className="object-cover w-full h-full border border-slate-200"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearPhoto(fieldKey);
                    }}
                    className="absolute top-1 right-1 bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-none text-[8px] font-black uppercase tracking-wider border-none cursor-pointer shadow-md transition-colors outline-none"
                  >
                    Hapus
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => triggerPhotoInput(idx)}
                  className="w-full h-full flex flex-col items-center justify-center text-center p-4 hover:bg-slate-50/50 transition-colors cursor-pointer"
                >
                  <UploadCloud className="h-5 w-5 text-secondary-foreground/60 mb-2 group-hover:text-primary transition-colors" />
                  <p className="text-[10px] font-bold text-slate-700 leading-snug">{dir}</p>
                  <p className="text-[8px] text-slate-400 mt-1 uppercase tracking-wider">Pilih Foto</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};