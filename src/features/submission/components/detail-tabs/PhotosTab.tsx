import { Camera } from 'lucide-react';

interface PhotosTabProps {
  sub: any;
}

export const PhotosTab = ({ sub }: PhotosTabProps) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-left">
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
  );
};
