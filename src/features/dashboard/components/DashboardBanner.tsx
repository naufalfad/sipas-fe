import { useState, useEffect } from 'react';
import { useConfigStore } from '@/app/store/useConfigStore';
import { useAuthStore } from '@/app/store/useAuthStore';
import { normalizeRole } from '@/components/auth/ProtectedRoute';
import { ChevronLeft, ChevronRight, Sparkles, Shield } from 'lucide-react';

export default function DashboardBanner() {
  const { slideBanners, rotationInterval, fetchConfig } = useConfigStore();
  const { user } = useAuthStore();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // 1. Generate Dynamic Greeting
  useEffect(() => {
    const hr = new Date().getHours();
    if (hr >= 5 && hr < 11) {
      setGreeting('Selamat Pagi');
    } else if (hr >= 11 && hr < 15) {
      setGreeting('Selamat Siang');
    } else if (hr >= 15 && hr < 19) {
      setGreeting('Selamat Sore');
    } else {
      setGreeting('Selamat Malam');
    }
  }, []);

  // 2. Automatic Slideshow Rotation
  useEffect(() => {
    if (slideBanners.length <= 1) return;
    
    const intervalMs = (rotationInterval || 5) * 1000;
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % slideBanners.length);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [slideBanners.length, rotationInterval]);

  const handlePrev = () => {
    setCurrentIdx((prev) => (prev === 0 ? slideBanners.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIdx((prev) => (prev === slideBanners.length - 1 ? 0 : prev + 1));
  };

  if (slideBanners.length === 0) return null;

  const activeSlide = slideBanners[currentIdx];
  const userName = user?.full_name || 'Pengguna GEOSIPAS';
  const displayRole = user ? normalizeRole(user.role) : 'Super Admin';

  return (
    <div className="relative w-full h-64 md:h-72 overflow-hidden border border-[#DAE4DB] shadow-[4px_4px_0px_0px_rgba(65,93,67,0.06)] bg-[#111D13] select-none text-white">
      {/* ─── SLIDE IMAGES BACKGROUND (WITH DISSOLVE FADE TRANSITION) ─── */}
      {slideBanners.map((slide, idx) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-[1200ms] ease-in-out ${
            idx === currentIdx ? '' : 'opacity-0 pointer-events-none'
          }`}
          style={{
            opacity: idx === currentIdx ? (slide.opacity !== undefined ? slide.opacity / 100 : 0.4) : 0
          }}
        >
          <img
            src={slide.imageUrl}
            alt={slide.title}
            className="w-full h-full object-cover scale-105"
          />
        </div>
      ))}

      {/* GRADIENT OVERLAY FOR BETTER TEXT CONTRAST */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#111D13]/90 via-[#111D13]/70 to-[#111D13]/40" />

      {/* ─── SLIDE CONTENT ─── */}
      <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-8 text-left z-10">
        
        {/* Top Section: Greeting & Active Role */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2 text-accent">
            <Sparkles className="h-4.5 w-4.5 animate-pulse text-[#A1CCA5]" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#A1CCA5]">
              {greeting}, {userName}!
            </span>
          </div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white/10 border border-white/20 backdrop-blur-md rounded-none text-[10px] font-bold text-[#A1CCA5]">
            <Shield className="h-3.5 w-3.5" />
            <span>AKTOR: {displayRole.toUpperCase()}</span>
          </div>
        </div>

        {/* Center Section: Banner Title & Subtitle */}
        <div className="space-y-2 md:space-y-3 max-w-2xl py-4">
          <h2 className="text-xl md:text-3xl font-extrabold tracking-tight text-white leading-tight transition-all duration-700">
            {activeSlide.title}
          </h2>
          <p className="text-xs md:text-sm text-slate-200 font-medium leading-relaxed transition-all duration-700">
            {activeSlide.subtitle}
          </p>
        </div>

        {/* Bottom Section: Indicators & Controls */}
        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          {/* Indicators (Dots) */}
          <div className="flex space-x-1.5">
            {slideBanners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIdx(idx)}
                className={`h-1.5 transition-all duration-300 rounded-none ${
                  idx === currentIdx ? 'w-6 bg-accent' : 'w-1.5 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>

          {/* Controls (Arrows) */}
          {slideBanners.length > 1 && (
            <div className="flex space-x-2">
              <button
                onClick={handlePrev}
                className="p-1.5 bg-white/10 border border-white/10 hover:bg-white/20 text-white transition-all cursor-pointer rounded-none"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleNext}
                className="p-1.5 bg-white/10 border border-white/10 hover:bg-white/20 text-white transition-all cursor-pointer rounded-none"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
