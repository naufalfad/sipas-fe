import { SpatialAlignmentManager } from './SpatialAlignmentManager';
import { GpuResourceManager } from './GpuResourceManager';
import { BimEventBus } from './BimEventBus';
import type {
  BimElementMetadata,
  EnvironmentalSimLayers,
  RtcAnchorPoint,
  SunSimulationConfig,
  TileSet3DSpec,
} from './types';

/**
 * ============================================================================
 * BIM VIEWER ENGINE FACADE - GRASP Facade & Controller Pattern
 * ============================================================================
 * Bertindak sebagai Single Entry Point untuk seluruh operasi WebGL 3D Scene.
 * Mengenkapsulasi sub-sistem Spatial Alignment, Tileset Streaming, Raycasting,
 * Simulasi Lingkungan (Matahari & Bayangan), dan GPU Disposal.
 * ============================================================================
 */
export class BimViewerEngineFacade {
  private container: HTMLDivElement | null = null;
  private spatialAlignment: SpatialAlignmentManager;
  private gpuManager: GpuResourceManager;
  private eventBus: BimEventBus;

  private currentRtcAnchor: RtcAnchorPoint | null = null;
  private activeTilesets: Map<string, TileSet3DSpec> = new Map();
  private selectedGuid: string | null = null;

  private isInitialized: boolean = false;
  private animationFrameId: number | null = null;

  // Mock Database Element BIM untuk Demo Interaksi Raycasting Presisi
  private mockBimDatabase: Map<string, BimElementMetadata> = new Map();

  constructor() {
    this.spatialAlignment = SpatialAlignmentManager.getInstance();
    this.gpuManager = new GpuResourceManager();
    this.eventBus = BimEventBus.getInstance();
    this.seedMockBimDatabase();
  }

  /**
   * Menemai database mock elemen BIM bertipe IFC standar
   */
  private seedMockBimDatabase(): void {
    const mockElements: BimElementMetadata[] = [
      {
        elementGuid: 'guid-col-001',
        globalId: '3a2F91bK001Xz',
        ifcClass: 'IfcColumn',
        elementName: 'Kolom Struktur Utama K1 (Lantai 1)',
        structuralCategory: 'Struktur Utama',
        dimensions: { lengthMeters: 0.6, widthMeters: 0.6, heightMeters: 4.2, volumeM3: 1.512 },
        materialSpecs: { materialName: 'Beton Bertulang Mutu Tinggi', concreteGrade: 'K-400', steelGrade: 'BJTS 420B' },
        attributes: { 'Kapasitas Beban Aksial': '4,200 kN', 'Tingkat Ketahanan Api': '2 Jam', 'Tanggal Pengecoran': '2026-04-12' },
        complianceStatus: 'SESUAI_SPESIFIKASI',
      },
      {
        elementGuid: 'guid-beam-102',
        globalId: '5b8C12mP002Yy',
        ifcClass: 'IfcBeam',
        elementName: 'Balok Induk B1 (Span 8 Meter)',
        structuralCategory: 'Struktur Utama',
        dimensions: { lengthMeters: 8.0, widthMeters: 0.4, heightMeters: 0.7, volumeM3: 2.24 },
        materialSpecs: { materialName: 'Beton Pre-Stressed', concreteGrade: 'K-500', steelGrade: 'Strand Unbonded' },
        attributes: { 'Momen Lentur Maks': '380 kNm', 'Lendutan Izin': 'L/360 = 22.2 mm', 'Posisi Level': 'Fl. 2 Beam Plan' },
        complianceStatus: 'SESUAI_SPESIFIKASI',
      },
      {
        elementGuid: 'guid-slab-201',
        globalId: '8x9Q34vR003Zz',
        ifcClass: 'IfcSlab',
        elementName: 'Pelat Lantai L2 - Zona Perkantoran',
        structuralCategory: 'Struktur Utama',
        dimensions: { lengthMeters: 12.0, widthMeters: 15.0, heightMeters: 0.15, areaM2: 180, volumeM3: 27.0 },
        materialSpecs: { materialName: 'Beton ReadyMix K-350', concreteGrade: 'K-350', steelGrade: 'Wiremesh M8' },
        attributes: { 'Beban Hidup Desain': '250 kg/m²', 'Waterproofing System': 'Polyurethane Membrane', 'Isolasi Akustik': 'STC 50' },
        complianceStatus: 'SESUAI_SPESIFIKASI',
      },
      {
        elementGuid: 'guid-mep-305',
        globalId: '1m4W78tS004Aa',
        ifcClass: 'IfcPipeSegment',
        elementName: 'Pipa Drainase Utama DN200 (Limbah Cair)',
        structuralCategory: 'MEP & Utilitas',
        dimensions: { lengthMeters: 24.5, widthMeters: 0.2, heightMeters: 0.2 },
        materialSpecs: { materialName: 'HDPE Heavy Duty Class S12.5' },
        attributes: { 'Kemiringan Drainase': '1.5%', 'Kapasitas Debit': '45 Liter/Detik', 'Koneksi Sempadan': 'Terhubung ke IPAL Kawasan' },
        complianceStatus: 'PERINGATAN_SEMPADAN',
      },
    ];

    mockElements.forEach((el) => this.mockBimDatabase.set(el.elementGuid, el));
  }

  /**
   * Menginisialisasi Engine Canvas 3D
   */
  public async initializeEngine(canvasContainer: HTMLDivElement): Promise<void> {
    this.container = canvasContainer;
    this.isInitialized = true;

    // Mulai Render Loop 60 FPS
    this.startRenderLoop();
  }

  /**
   * Memuat Parcel Spatial & Alignment RTC Origin Shift
   */
  public async loadParcelAndTileset(
    longitude: number = 106.7892,
    latitude: number = -6.5944,
    tilesetUrl: string = '/tilesets/bogor_siteplan_3dtiles/tileset.json'
  ): Promise<TileSet3DSpec> {
    // 1. Hitung RTC Anchor Point
    this.currentRtcAnchor = this.spatialAlignment.computeRtcAnchor(longitude, latitude, 265);
    this.eventBus.publish('RTC_ANCHOR_UPDATED', this.currentRtcAnchor);

    // 2. Registrasi Buffer & Mock Tileset
    const tilesetId = `tileset-${Date.now()}`;
    const mockSpec: TileSet3DSpec = {
      id: tilesetId,
      name: 'Siteplan 3D Gedung Pelayanan SIPAS Bogor',
      rootTilesetUrl: tilesetUrl,
      b3dmCount: 14,
      geometricError: 16,
      boundingBox: {
        min: { x: -50, y: -50, z: 0 },
        max: { x: 50, y: 50, z: 35 },
      },
      rtcAnchor: this.currentRtcAnchor,
      isLoaded: true,
      fileSizeMb: 12.4,
    };

    this.activeTilesets.set(tilesetId, mockSpec);
    this.gpuManager.registerBuffer(`gpu-buffer-${tilesetId}`);
    this.eventBus.publish('TILES_PROGRESS', { tilesetId, percentLoaded: 100 });

    return mockSpec;
  }

  /**
   * Eksekusi Raycasting saat user menglik objek 3D di Canvas
   */
  public executeRaycastSelect(guid?: string): void {
    const targetGuid = guid || Array.from(this.mockBimDatabase.keys())[Math.floor(Math.random() * this.mockBimDatabase.size)];
    this.selectedGuid = targetGuid;

    const metadata = this.mockBimDatabase.get(targetGuid);
    if (metadata) {
      this.eventBus.publish('BIM_ELEMENT_SELECTED', {
        elementGuid: targetGuid,
        metadata: metadata,
      });
    }
  }

  /**
   * Membersihkan pilihan elemen
   */
  public clearSelection(): void {
    this.selectedGuid = null;
    this.eventBus.publish('BIM_SELECTION_CLEARED', undefined);
  }

  /**
   * Menyetel Simulasi Posisi Matahari & Bayangan
   */
  public updateSunSimulation(config: SunSimulationConfig): void {
    if (!config.enabled) return;

    const sunPos = this.spatialAlignment.calculateSunPosition(
      config.hourOfDay,
      config.monthOfYear,
      config.latitude,
      config.longitude
    );

    // Dalam integrasi fisik WebGL: update directionalLight.position & shadowMap
    console.log(`[SunSimulation] Sun updated: Azimuth=${sunPos.azimuth.toFixed(1)}°, Altitude=${sunPos.altitude.toFixed(1)}°`);
  }

  /**
   * Menyetel Visibilitas Layer Simulasi Lingkungan
   */
  public updateEnvironmentLayers(layers: EnvironmentalSimLayers): void {
    console.log('[EnvironmentLayers] Applied layers:', layers);
  }

  /**
   * Main Render Loop (60 FPS)
   */
  private startRenderLoop(): void {
    const animate = () => {
      if (!this.isInitialized) return;
      // Loop update matriks kamera & frustum culling
      this.animationFrameId = requestAnimationFrame(animate);
    };
    this.animationFrameId = requestAnimationFrame(animate);
  }

  /**
   * Disposal eksplisit VRAM GPU saat unmount
   */
  public disposeEngine(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.gpuManager.disposeAll();
    this.activeTilesets.clear();
    this.isInitialized = false;
    this.container = null;
  }

  public getSelectedGuid(): string | null {
    return this.selectedGuid;
  }

  public getMockDatabase(): BimElementMetadata[] {
    return Array.from(this.mockBimDatabase.values());
  }

  public getCanvasContainer(): HTMLDivElement | null {
    return this.container;
  }
}
