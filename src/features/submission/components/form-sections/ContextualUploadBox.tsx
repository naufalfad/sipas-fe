import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { UploadCloud, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { FullSubmissionFormValues } from '../../schemas/submissionFormSchema';
import { uploadFileToBackend } from '../../utils/upload';
import { LabelWithInfo } from './LabelWithInfo';

export const ContextualUploadBox = ({
  label,
  fieldKey,
  accept = ".pdf,.jpg,.jpeg,.png,.zip",
  helpText
}: {
  label: string;
  fieldKey: string;
  accept?: string;
  helpText?: string;
}) => {
  const { setValue, watch } = useFormContext<FullSubmissionFormValues>();
  const [loading, setLoading] = useState(false);
  const fileUrl = watch(fieldKey as any);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Limit size to 20MB
      const MAX_FILE_SIZE = 20 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        toast.error('Berkas terlalu besar! Batas ukuran maksimal adalah 20MB.');
        return;
      }

      // Check allowed extensions if accept is provided
      if (accept) {
        const allowedExtensions = accept.split(',').map(ext => ext.trim().toLowerCase());
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!allowedExtensions.includes(fileExtension)) {
          toast.error(`Format berkas tidak valid! Hanya menerima format: ${accept}`);
          return;
        }
      }

      try {
        setLoading(true);
        const res = await uploadFileToBackend(file);
        setValue(fieldKey as any, `${res.file_url}?name=${encodeURIComponent(file.name)}`);
        toast.success(`Berhasil mengunggah: ${file.name}`);
      } catch (err) {
        toast.error('Gagal mengunggah berkas ke server');
      } finally {
        setLoading(false);
      }
    }
  };

  const onClear = () => {
    setValue(fieldKey as any, undefined);
  };

  const getOriginalFileName = (url: string) => {
    try {
      const parsedUrl = new URL(url, window.location.origin);
      const nameParam = parsedUrl.searchParams.get('name');
      if (nameParam) return decodeURIComponent(nameParam);
    } catch (e) {
      // Fallback
    }
    const lastSegment = url.split('/').pop() || 'File terunggah';
    return lastSegment.split('?')[0];
  };

  return (
    <div className="space-y-1.5 text-left select-none">
      <LabelWithInfo label={label} helpText={helpText} />
      {loading ? (
        <div className="flex items-center gap-2.5 p-3.5 bg-slate-50 border border-dashed border-border">
          <Loader2 className="h-4.5 w-4.5 animate-spin text-primary" />
          <span className="text-[10px] font-black text-primary uppercase tracking-widest animate-pulse leading-none">Mengunggah...</span>
        </div>
      ) : fileUrl ? (
        <div className="flex items-center justify-between p-3 bg-[#e8f2ea]/20 border border-primary/30">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle className="h-4.5 w-4.5 text-primary shrink-0" />
            <span className="text-[11px] font-mono text-primary truncate max-w-[240px]" title={getOriginalFileName(fileUrl)}>
              {getOriginalFileName(fileUrl)}
            </span>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="text-[10px] font-bold text-rose-600 hover:text-rose-700 transition-colors cursor-pointer outline-none border-none bg-transparent"
          >
            Hapus
          </button>
        </div>
      ) : (
        <div className="relative border border-dashed border-slate-300 bg-slate-50/30 hover:bg-slate-50 p-3 flex items-center justify-center gap-2 cursor-pointer transition-all">
          <input
            type="file"
            accept={accept}
            onChange={onFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <UploadCloud className="h-4.5 w-4.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600">Klik untuk Unggah Berkas</span>
        </div>
      )}
    </div>
  );
};
