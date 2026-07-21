import { useBimStore } from '@/app/store/useBimStore';
import {
  Box,
  Layers,
  MapPin,
  Maximize2,
  ShieldCheck,
  Sun,
  X,
} from 'lucide-react';

export default function BimPropertyPanel() {
  const isSidePanelOpen = useBimStore((s) => s.isSidePanelOpen);
  const setSidePanelOpen = useBimStore((s) => s.setSidePanelOpen);
  const activeTab = useBimStore((s) => s.activeTab);
  const setActiveTab = useBimStore((s) => s.setActiveTab);

  const activeParcelName = useBimStore((s) => s.activeParcelName);
  const activeParcelNop = useBimStore((s) => s.activeParcelNop);
  const activeParcelAreaM2 = useBimStore((s) => s.activeParcelAreaM2);
  const activeParcelZone = useBimStore((s) => s.activeParcelZone);

  const selectedElementMetadata = useBimStore((s) => s.selectedElementMetadata);
  const clearSelection = useBimStore((s) => s.clearSelection);
  const rtcAnchor = useBimStore((s) => s.rtcAnchor);
  const sunConfig = useBimStore((s) => s.sunConfig);
  const envLayers = useBimStore((s) => s.envLayers);

  if (!isSidePanelOpen) {
    return (
      <button
        onClick={() => setSidePanelOpen(true)}
        className="absolute top-4 right-4 z-20 bg-slate-900/90 border border-slate-700 text-teal-400 p-2.5 rounded-xl shadow-2xl hover:bg-slate-800 transition-all flex items-center gap-2 text-xs font-semibold"
      >
        <Maximize2 className="w-4 h-4" />
        <span>Buka Panel Property</span>
      </button>
    );
  }

  return (
    <aside className="w-96 h-full bg-slate-900/95 border-l border-slate-800 backdrop-blur-xl flex flex-col z-20 shadow-2xl transition-all duration-300 select-none">
      {/* Header Panel */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center">
            <Box className="w-4 h-4 text-teal-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">BIM Inspector 3D</h3>
            <p className="text-[10px] text-slate-400">Spesifikasi IFC & Audit Spasial Real-Time</p>
          </div>
        </div>
        <button
          onClick={() => setSidePanelOpen(false)}
          className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="grid grid-cols-4 bg-slate-950/80 p-1 border-b border-slate-800 text-[11px] font-semibold">
        <button
          onClick={() => setActiveTab('bim-spec')}
          className={`py-2 rounded-md transition text-center ${
            activeTab === 'bim-spec'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          IFC Spec
        </button>

        <button
          onClick={() => setActiveTab('persil-context')}
          className={`py-2 rounded-md transition text-center ${
            activeTab === 'persil-context'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Persil
        </button>

        <button
          onClick={() => setActiveTab('env-simulation')}
          className={`py-2 rounded-md transition text-center ${
            activeTab === 'env-simulation'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Lingkungan
        </button>

        <button
          onClick={() => setActiveTab('compliance-check')}
          className={`py-2 rounded-md transition text-center ${
            activeTab === 'compliance-check'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Audit K3
        </button>
      </div>

      {/* Content Body Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs text-slate-300 custom-scrollbar">
        {/* Tab 1: IFC Spec Metadata */}
        {activeTab === 'bim-spec' && (
          <div>
            {selectedElementMetadata ? (
              <div className="space-y-4">
                {/* Element Badge */}
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold font-mono bg-teal-950 text-teal-300 border border-teal-800">
                      {selectedElementMetadata.ifcClass}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      GUID: {selectedElementMetadata.elementGuid}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-100">{selectedElementMetadata.elementName}</h4>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <Layers className="w-3.5 h-3.5 text-teal-400" />
                    <span>Kategori: {selectedElementMetadata.structuralCategory}</span>
                  </div>
                </div>

                {/* Dimensions */}
                <div className="space-y-2">
                  <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Dimensi Geometri</h5>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedElementMetadata.dimensions.lengthMeters && (
                      <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Panjang / Panjang Span</span>
                        <span className="text-sm font-bold text-slate-100 font-mono">
                          {selectedElementMetadata.dimensions.lengthMeters} m
                        </span>
                      </div>
                    )}
                    {selectedElementMetadata.dimensions.heightMeters && (
                      <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Tinggi / Penampang</span>
                        <span className="text-sm font-bold text-slate-100 font-mono">
                          {selectedElementMetadata.dimensions.heightMeters} m
                        </span>
                      </div>
                    )}
                    {selectedElementMetadata.dimensions.volumeM3 && (
                      <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Volume Material</span>
                        <span className="text-sm font-bold text-teal-300 font-mono">
                          {selectedElementMetadata.dimensions.volumeM3} m³
                        </span>
                      </div>
                    )}
                    {selectedElementMetadata.dimensions.areaM2 && (
                      <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Luas Area</span>
                        <span className="text-sm font-bold text-teal-300 font-mono">
                          {selectedElementMetadata.dimensions.areaM2} m²
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Material Specifications */}
                <div className="space-y-2">
                  <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Spesifikasi Material</h5>
                  <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Material Utama:</span>
                      <span className="font-semibold text-slate-200">{selectedElementMetadata.materialSpecs.materialName}</span>
                    </div>
                    {selectedElementMetadata.materialSpecs.concreteGrade && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Mutu Beton:</span>
                        <span className="font-mono font-bold text-teal-400">{selectedElementMetadata.materialSpecs.concreteGrade}</span>
                      </div>
                    )}
                    {selectedElementMetadata.materialSpecs.steelGrade && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Mutu Baja Tulangan:</span>
                        <span className="font-mono font-bold text-amber-400">{selectedElementMetadata.materialSpecs.steelGrade}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Attributes */}
                <div className="space-y-2">
                  <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Atribut Desain</h5>
                  <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-1.5 font-mono text-[11px]">
                    {Object.entries(selectedElementMetadata.attributes).map(([key, val]) => (
                      <div key={key} className="flex justify-between border-b border-slate-800/60 pb-1 last:border-none">
                        <span className="text-slate-400">{key}</span>
                        <span className="text-slate-200 font-semibold">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={clearSelection}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition font-medium text-xs"
                >
                  Reset Pilihan Elemen
                </button>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 space-y-3">
                <Box className="w-10 h-10 mx-auto text-slate-600 animate-pulse" />
                <p className="text-xs">Belum ada elemen 3D yang dipilih.</p>
                <p className="text-[10px] text-slate-600">Klik salah satu komponen struktur di viewport 3D untuk inspeksi.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Persil Context */}
        {activeTab === 'persil-context' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-teal-950/30 border border-teal-500/30 space-y-2">
              <div className="flex items-center gap-2 text-teal-400 font-bold">
                <MapPin className="w-4 h-4" />
                <span>{activeParcelName}</span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">NOP: {activeParcelNop}</p>
            </div>

            <div className="space-y-2">
              <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Atribut Spasial Lahan</h5>
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Luas Persil Tanah:</span>
                  <span className="font-bold text-slate-100 font-mono">{activeParcelAreaM2.toLocaleString()} m²</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Zonasi Tata Ruang:</span>
                  <span className="font-semibold text-teal-300">{activeParcelZone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Wilayah Administratif:</span>
                  <span className="text-slate-200">Kabupaten Bogor, Jawa Barat</span>
                </div>
              </div>
            </div>

            {rtcAnchor && (
              <div className="space-y-2">
                <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Jangkar Presisi RTC Center</h5>
                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Longitude (WGS84):</span>
                    <span className="text-slate-200">{rtcAnchor.longitude}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Latitude (WGS84):</span>
                    <span className="text-slate-200">{rtcAnchor.latitude}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Altitude Datum:</span>
                    <span className="text-teal-400">{rtcAnchor.altitude} m MSL</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Environmental Simulation Status */}
        {activeTab === 'env-simulation' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <Sun className="w-4 h-4" />
                <span>Simulasi Posisi Matahari & Bayangan</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Pukul {sunConfig.hourOfDay}:00 WIB — Bulan ke-{sunConfig.monthOfYear}
              </p>
            </div>

            <div className="space-y-2">
              <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Layer Lingkungan Aktif</h5>
              <div className="space-y-1.5">
                <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300">Shader Air Sungai (GeoJSON)</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${envLayers.riversActive ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-500'}`}>
                    {envLayers.riversActive ? 'AKTIF' : 'NON-AKTIF'}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300">Jaringan Drainase/Limbah</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${envLayers.drainageActive ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-500'}`}>
                    {envLayers.drainageActive ? 'AKTIF' : 'NON-AKTIF'}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300">Spatial Heatmap Kualitas Udara</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${envLayers.airQualityHeatmapActive ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-500'}`}>
                    {envLayers.airQualityHeatmapActive ? 'AKTIF' : 'NON-AKTIF'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Compliance Check Audit */}
        {activeTab === 'compliance-check' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Status Kepatuhan Tata Ruang: PASS</span>
              </div>
              <p className="text-[11px] text-slate-300">BIM Model memenuhi regulasi KDB, KLB, dan Sempadan Bogor.</p>
            </div>

            <div className="space-y-2">
              <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Matriks Indikator K3 & GIS</h5>
              <div className="space-y-2">
                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-200">KDB (Koefisien Dasar Bangunan)</span>
                    <span className="text-emerald-400">42% / Max 60% (MEMENUHI)</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400" style={{ width: '70%' }} />
                  </div>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-200">Jarak Sempadan Sungai (GSS)</span>
                    <span className="text-emerald-400">18.5 Meter / Min 15.0m</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-400" style={{ width: '85%' }} />
                  </div>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-200">Proteksi Kebakaran (Akses Damkar)</span>
                    <span className="text-emerald-400">Lebar 6.0m (MEMENUHI)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
