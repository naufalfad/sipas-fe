import { useRef, useState } from 'react';

interface SignatureCanvasPadProps {
  value: string;
  onChange: (base64: string) => void;
  onClear: () => void;
  placeholder?: string;
}

export const SignatureCanvasPad = ({
  value,
  onChange,
  onClear,
  placeholder = "Goreskan tanda tangan Anda di sini"
}: SignatureCanvasPadProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(!!value);

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
    const dataUrl = canvas.toDataURL('image/png');
    onChange(dataUrl);
    setHasDrawn(true);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onClear();
    setHasDrawn(false);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
          Tanda Tangan Pejabat (TTD Drawer)
        </label>
        <button
          type="button"
          onClick={handleClear}
          className="text-[10px] text-rose-500 hover:text-rose-700 font-bold transition-colors cursor-pointer outline-none border-none bg-transparent"
        >
          Hapus TTD
        </button>
      </div>
      <div className="relative border border-slate-200 rounded-none bg-slate-50 overflow-hidden select-none">
        <canvas
          ref={canvasRef}
          width={380}
          height={150}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-[150px] cursor-crosshair touch-none bg-slate-50"
        />
        {!hasDrawn && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[11px] text-slate-400 font-medium">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
};
