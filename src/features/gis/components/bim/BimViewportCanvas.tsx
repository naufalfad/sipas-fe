import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useBimStore } from '@/app/store/useBimStore';
import { BimEventBus } from '../../bim/BimEventBus';
import {
  Loader2,
  Sparkles,
} from 'lucide-react';

interface HoveredElementInfo {
  guid: string;
  name: string;
  ifcClass: string;
  screenPos: { x: number; y: number };
}

export default function BimViewportCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const waterPlaneRef = useRef<THREE.Mesh | null>(null);
  const interactiveMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());

  // Orbit State
  const isDraggingRef = useRef(false);
  const isRightDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const cameraTargetRef = useRef(new THREE.Vector3(0, 6, 0));

  // Store Hooks
  const sunConfig = useBimStore((s) => s.sunConfig);
  const envLayers = useBimStore((s) => s.envLayers);
  const setSelectedElement = useBimStore((s) => s.setSelectedElement);
  const setRtcAnchor = useBimStore((s) => s.setRtcAnchor);
  const selectedElementMetadata = useBimStore((s) => s.selectedElementMetadata);
  const uploadedCadFileName = useBimStore((s) => s.uploadedCadFileName);

  // Component UI State
  const [isEngineReady, setIsEngineReady] = useState(false);
  const [loadPercent, setLoadPercent] = useState(0);
  const [hoveredInfo, setHoveredInfo] = useState<HoveredElementInfo | null>(null);
  const [cameraViewMode, setCameraViewMode] = useState<'ORBIT' | 'TOP' | 'FRONT'>('ORBIT');

  // Simulated Elements Metadata Database
  const bimMetadataMap = useRef<Map<string, any>>(
    new Map([
      [
        'col-001',
        {
          elementGuid: 'col-001',
          globalId: '3a2F91bK001Xz',
          ifcClass: 'IfcColumn',
          elementName: 'Kolom Utama K1 (Beton K-400)',
          structuralCategory: 'Struktur Utama',
          dimensions: { lengthMeters: 0.6, widthMeters: 0.6, heightMeters: 14.0, volumeM3: 5.04 },
          materialSpecs: { materialName: 'Beton Bertulang Mutu Tinggi', concreteGrade: 'K-400', steelGrade: 'BJTS 420B' },
          attributes: { 'Kapasitas Aksial': '4,500 kN', 'Tingkat Tahan Api': '2 Jam', 'Posisi Level': 'Fl. 1-4 Core Column' },
          complianceStatus: 'SESUAI_SPESIFIKASI',
        },
      ],
      [
        'col-002',
        {
          elementGuid: 'col-002',
          globalId: '3a2F91bK002Xz',
          ifcClass: 'IfcColumn',
          elementName: 'Kolom Utama K2 (Beton K-400)',
          structuralCategory: 'Struktur Utama',
          dimensions: { lengthMeters: 0.6, widthMeters: 0.6, heightMeters: 14.0, volumeM3: 5.04 },
          materialSpecs: { materialName: 'Beton Bertulang Mutu Tinggi', concreteGrade: 'K-400', steelGrade: 'BJTS 420B' },
          attributes: { 'Kapasitas Aksial': '4,500 kN', 'Tingkat Tahan Api': '2 Jam', 'Posisi Level': 'Fl. 1-4 Core Column' },
          complianceStatus: 'SESUAI_SPESIFIKASI',
        },
      ],
      [
        'beam-101',
        {
          elementGuid: 'beam-101',
          globalId: '5b8C12mP001Yy',
          ifcClass: 'IfcBeam',
          elementName: 'Balok Induk B1 Span 12M',
          structuralCategory: 'Struktur Utama',
          dimensions: { lengthMeters: 12.0, widthMeters: 0.5, heightMeters: 0.8, volumeM3: 4.8 },
          materialSpecs: { materialName: 'Beton Pre-Stressed', concreteGrade: 'K-500', steelGrade: 'Strand Unbonded' },
          attributes: { 'Momen Lentur Maks': '520 kNm', 'Lendutan Izin': 'L/360', 'Posisi Level': 'Fl. 2 Beam Plan' },
          complianceStatus: 'SESUAI_SPESIFIKASI',
        },
      ],
      [
        'slab-201',
        {
          elementGuid: 'slab-201',
          globalId: '8x9Q34vR003Zz',
          ifcClass: 'IfcSlab',
          elementName: 'Pelat Atas Penthouse (Fl. 4)',
          structuralCategory: 'Struktur Utama',
          dimensions: { lengthMeters: 14.0, widthMeters: 14.0, heightMeters: 0.2, areaM2: 196, volumeM3: 39.2 },
          materialSpecs: { materialName: 'Beton ReadyMix K-350', concreteGrade: 'K-350', steelGrade: 'Wiremesh M8' },
          attributes: { 'Beban Hidup Desain': '300 kg/m²', 'Waterproofing': 'Polyurethane Membrane', 'Status Insulasi': 'STC 55' },
          complianceStatus: 'SESUAI_SPESIFIKASI',
        },
      ],
      [
        'mep-pipe-01',
        {
          elementGuid: 'mep-pipe-01',
          globalId: '1m4W78tS004Aa',
          ifcClass: 'IfcPipeSegment',
          elementName: 'Pipa Utama Drainase DN200',
          structuralCategory: 'MEP & Utilitas',
          dimensions: { lengthMeters: 18.5, widthMeters: 0.25, heightMeters: 0.25 },
          materialSpecs: { materialName: 'HDPE Heavy Duty Class S12.5' },
          attributes: { 'Kemiringan Drainase': '1.8%', 'Kapasitas Debit': '65 Liter/Detik', 'Koneksi Sempadan': 'Terhubung ke IPAL Bogor' },
          complianceStatus: 'PERINGATAN_SEMPADAN',
        },
      ],
      [
        'block-surround-1',
        {
          elementGuid: 'block-surround-1',
          globalId: '99xZ11aB009Qq',
          ifcClass: 'IfcBuildingElementProxy',
          elementName: 'Kaveling Sekitar A (Ruko Commercial)',
          structuralCategory: 'Kaveling Tetangga',
          dimensions: { lengthMeters: 10.0, widthMeters: 10.0, heightMeters: 8.0 },
          materialSpecs: { materialName: 'Struktur Komposit' },
          attributes: { 'Status Zonasi': 'K2 Komersial', 'KDB': '60%' },
          complianceStatus: 'SESUAI_SPESIFIKASI',
        },
      ],
      [
        'block-surround-2',
        {
          elementGuid: 'block-surround-2',
          globalId: '99xZ11aB010Qq',
          ifcClass: 'IfcBuildingElementProxy',
          elementName: 'Kaveling Sekitar B (Perumahan Residensial)',
          structuralCategory: 'Kaveling Tetangga',
          dimensions: { lengthMeters: 12.0, widthMeters: 10.0, heightMeters: 6.0 },
          materialSpecs: { materialName: 'Struktur Komposit' },
          attributes: { 'Status Zonasi': 'R3 Residensial', 'KDB': '50%' },
          complianceStatus: 'SESUAI_SPESIFIKASI',
        },
      ],
    ])
  );

  // Initialize Three.js 3D Engine Scene
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth || window.innerWidth;
    const height = containerRef.current.clientHeight || window.innerHeight;

    // 1. Three.js Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16);
    scene.fog = new THREE.FogExp2(0x090d16, 0.008);
    sceneRef.current = scene;

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(38, 32, 48);
    camera.lookAt(cameraTargetRef.current);
    cameraRef.current = camera;

    // 3. WebGL Renderer Setup
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // 4. Lighting Setup (Blender Style High Quality Ambient & Sun Light)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.6);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfde047, 1.4);
    sunLight.position.set(30, 45, 25);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 150;
    const d = 40;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    // 5. Grid Helper Floor & Axis (Blender Viewport Floor)
    const gridHelper = new THREE.GridHelper(120, 60, 0x0d9488, 0x1e293b);
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    // Ground Base Slab
    const groundGeo = new THREE.BoxGeometry(100, 0.2, 100);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0b1324,
      roughness: 0.9,
      metalness: 0.1,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.position.y = -0.11;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // 6. BUILD REAL 3D BIM BUILDING MESHES & NEIGHBORING BLOCKS (LAMPIRAN 2 BLENDER SCENE!)
    const interactiveMap = new Map<string, THREE.Mesh>();

    const createBimBlock = (
      guid: string,
      geo: THREE.BufferGeometry,
      colorHex: number,
      pos: [number, number, number],
      roughness = 0.3,
      metalness = 0.4
    ) => {
      const mat = new THREE.MeshStandardMaterial({
        color: colorHex,
        roughness,
        metalness,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...pos);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { guid, baseColor: colorHex };

      // Wireframe Edges Overlay for CAD BIM Feel
      const edges = new THREE.EdgesGeometry(geo);
      const lineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35 });
      const wireframe = new THREE.LineSegments(edges, lineMat);
      mesh.add(wireframe);

      scene.add(mesh);
      interactiveMap.set(guid, mesh);
      return mesh;
    };

    // --- MAIN TOWER BUILDINGS & COLUMNS (Siteplan Proposed Project) ---
    createBimBlock('slab-ground', new THREE.BoxGeometry(22, 0.5, 22), 0x0f172a, [0, 0.25, 0], 0.8, 0.2);

    // Columns (IfcColumn K1 & K2)
    createBimBlock('col-001', new THREE.BoxGeometry(1.2, 14, 1.2), 0x0d9488, [-8, 7.5, -8]);
    createBimBlock('col-002', new THREE.BoxGeometry(1.2, 14, 1.2), 0x0d9488, [8, 7.5, -8]);
    createBimBlock('col-003', new THREE.BoxGeometry(1.2, 14, 1.2), 0x0d9488, [-8, 7.5, 8]);
    createBimBlock('col-004', new THREE.BoxGeometry(1.2, 14, 1.2), 0x0d9488, [8, 7.5, 8]);

    // Horizontal Beams (IfcBeam)
    createBimBlock('beam-101', new THREE.BoxGeometry(17.2, 1.0, 1.0), 0x0284c7, [0, 7.5, -8]);
    createBimBlock('beam-102', new THREE.BoxGeometry(17.2, 1.0, 1.0), 0x0284c7, [0, 7.5, 8]);
    createBimBlock('beam-103', new THREE.BoxGeometry(1.0, 1.0, 15.0), 0x0284c7, [-8, 7.5, 0]);
    createBimBlock('beam-104', new THREE.BoxGeometry(1.0, 1.0, 15.0), 0x0284c7, [8, 7.5, 0]);

    // Slabs (IfcSlab Floor 2 & Roof)
    createBimBlock('slab-101', new THREE.BoxGeometry(18, 0.4, 18), 0x334155, [0, 8.0, 0], 0.6, 0.3);
    createBimBlock('slab-201', new THREE.BoxGeometry(18, 0.4, 18), 0x0f766e, [0, 14.5, 0], 0.4, 0.5);

    // Upper Penthouse Structure Block (3D Glass Box)
    const glassGeo = new THREE.BoxGeometry(12, 6, 12);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.65,
      roughness: 0.1,
      metalness: 0.8,
      transmission: 0.6,
      ior: 1.5,
    });
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    glassMesh.position.set(0, 17.5, 0);
    glassMesh.castShadow = true;
    glassMesh.userData = { guid: 'slab-201', baseColor: 0x38bdf8 };
    scene.add(glassMesh);

    // MEP Drainage Pipe Cylinder (IfcPipeSegment)
    const pipeGeo = new THREE.CylinderGeometry(0.3, 0.3, 20, 16);
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.2, metalness: 0.8 });
    const pipeMesh = new THREE.Mesh(pipeGeo, pipeMat);
    pipeMesh.rotation.z = Math.PI / 2;
    pipeMesh.position.set(0, 1.2, 11);
    pipeMesh.userData = { guid: 'mep-pipe-01', baseColor: 0xf59e0b };
    scene.add(pipeMesh);
    interactiveMap.set('mep-pipe-01', pipeMesh);

    // --- NEIGHBORING BUILDINGS (Like Lampiran 2 Extruded Blocks) ---
    createBimBlock('block-surround-1', new THREE.BoxGeometry(14, 10, 14), 0x1e293b, [-30, 5, -25], 0.7, 0.2);
    createBimBlock('block-surround-2', new THREE.BoxGeometry(16, 12, 14), 0x334155, [28, 6, -20], 0.7, 0.2);
    createBimBlock('block-surround-3', new THREE.BoxGeometry(18, 16, 16), 0xd97706, [-28, 8, 25], 0.6, 0.4);
    createBimBlock('block-surround-4', new THREE.BoxGeometry(14, 8, 14), 0x1e293b, [30, 4, 28], 0.7, 0.2);

    // 7. Water Plane Shader (Environmental Stream)
    const waterGeo = new THREE.PlaneGeometry(120, 12);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.75,
      roughness: 0.1,
      metalness: 0.9,
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.set(0, 0.05, 38);
    waterMesh.visible = envLayers.riversActive;
    scene.add(waterMesh);
    waterPlaneRef.current = waterMesh;

    interactiveMeshesRef.current = interactiveMap;

    // Set RTC Anchor info
    setRtcAnchor({
      longitude: 106.8560,
      latitude: -6.4816,
      altitude: 265,
      localCenter: { x: 0, y: 0, z: 0 },
    });

    setLoadPercent(100);
    setIsEngineReady(true);

    // 8. ANIMATION RENDER LOOP (60 FPS WebGL)
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (glassMesh) {
        glassMesh.rotation.y += 0.002;
      }

      if (waterMesh && waterMesh.visible) {
        waterMesh.position.z = 38 + Math.sin(Date.now() * 0.002) * 0.3;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      groundGeo.dispose();
      groundMat.dispose();
    };
  }, [setRtcAnchor]);

  // Sync Sun Simulation
  useEffect(() => {
    if (!sunLightRef.current || !sceneRef.current) return;
    if (sunConfig.enabled) {
      const hour = sunConfig.hourOfDay; // 0..24
      const angle = ((hour - 6) / 12) * Math.PI;
      const sunX = Math.cos(angle) * 45;
      const sunY = Math.sin(angle) * 45 + 5;
      sunLightRef.current.position.set(sunX, Math.max(sunY, 2), 25);
      sunLightRef.current.intensity = sunY > 0 ? 1.5 : 0.1;

      if (sunY <= 0) {
        sceneRef.current.background = new THREE.Color(0x020617);
      } else {
        sceneRef.current.background = new THREE.Color(0x090d16);
      }
    }
  }, [sunConfig]);

  // Sync Water Layer
  useEffect(() => {
    if (waterPlaneRef.current) {
      waterPlaneRef.current.visible = envLayers.riversActive || envLayers.drainageActive;
    }
  }, [envLayers]);

  // Sync Selected Element Highlight Shader
  useEffect(() => {
    interactiveMeshesRef.current.forEach((mesh, guid) => {
      const isSelected = selectedElementMetadata?.elementGuid === guid;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (mat) {
        if (isSelected) {
          mat.emissive.setHex(0x0d9488);
          mat.emissiveIntensity = 0.6;
        } else {
          mat.emissive.setHex(0x000000);
          mat.emissiveIntensity = 0;
        }
      }
    });
  }, [selectedElementMetadata]);

  // --- MOUSE ORBIT & PAN CONTROLS (BLENDER STYLE) ---
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    isRightDraggingRef.current = e.button === 2 || e.shiftKey;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current || !cameraRef.current) return;

    if (isDraggingRef.current) {
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };

      const camera = cameraRef.current;
      const target = cameraTargetRef.current;

      if (isRightDraggingRef.current) {
        const panSpeed = 0.05;
        camera.position.x -= deltaX * panSpeed;
        camera.position.y += deltaY * panSpeed;
        target.x -= deltaX * panSpeed;
        target.y += deltaY * panSpeed;
      } else {
        const rotSpeed = 0.005;
        const offset = camera.position.clone().sub(target);
        const radius = offset.length();

        let theta = Math.atan2(offset.x, offset.z);
        let phi = Math.acos(Math.min(Math.max(offset.y / radius, -1), 1));

        theta -= deltaX * rotSpeed;
        phi -= deltaY * rotSpeed;
        phi = Math.min(Math.max(phi, 0.1), Math.PI / 2 - 0.05);

        offset.x = radius * Math.sin(phi) * Math.sin(theta);
        offset.y = radius * Math.cos(phi);
        offset.z = radius * Math.sin(phi) * Math.cos(theta);

        camera.position.copy(target).add(offset);
        camera.lookAt(target);
      }
      return;
    }

    // RAYCAST HOVER PICKING (LAMPIRAN 2 FLOATING 3D TAGS)
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);

    const meshes = Array.from(interactiveMeshesRef.current.values());
    const intersects = raycaster.intersectObjects(meshes, true);

    if (intersects.length > 0) {
      let topMesh: THREE.Mesh | null = null;
      let curr: THREE.Object3D | null = intersects[0].object;
      while (curr) {
        if (curr.userData && curr.userData.guid) {
          topMesh = curr as THREE.Mesh;
          break;
        }
        curr = curr.parent;
      }

      if (topMesh && topMesh.userData.guid) {
        const guid = topMesh.userData.guid;
        const meta = bimMetadataMap.current.get(guid) || {
          elementName: `Elemen 3D #${guid}`,
          ifcClass: 'IfcBuildingElement',
        };

        setHoveredInfo({
          guid,
          name: meta.elementName,
          ifcClass: meta.ifcClass,
          screenPos: { x: e.clientX - rect.left, y: e.clientY - rect.top },
        });
        return;
      }
    }

    setHoveredInfo(null);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    isRightDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!cameraRef.current) return;
    const camera = cameraRef.current;
    const target = cameraTargetRef.current;
    const zoomFactor = e.deltaY > 0 ? 1.08 : 0.92;

    const offset = camera.position.clone().sub(target);
    if (offset.length() * zoomFactor > 5 && offset.length() * zoomFactor < 200) {
      offset.multiplyScalar(zoomFactor);
      camera.position.copy(target).add(offset);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!containerRef.current || !cameraRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);

    const meshes = Array.from(interactiveMeshesRef.current.values());
    const intersects = raycaster.intersectObjects(meshes, true);

    if (intersects.length > 0) {
      let topMesh: THREE.Mesh | null = null;
      let curr: THREE.Object3D | null = intersects[0].object;
      while (curr) {
        if (curr.userData && curr.userData.guid) {
          topMesh = curr as THREE.Mesh;
          break;
        }
        curr = curr.parent;
      }

      if (topMesh && topMesh.userData.guid) {
        const guid = topMesh.userData.guid;
        const meta = bimMetadataMap.current.get(guid);
        if (meta) {
          setSelectedElement(meta);
          BimEventBus.getInstance().publish('BIM_ELEMENT_SELECTED', { elementGuid: guid, metadata: meta });
        }
      }
    }
  };

  const handleResetCamera = (mode: 'ORBIT' | 'TOP' | 'FRONT') => {
    if (!cameraRef.current) return;
    setCameraViewMode(mode);
    const camera = cameraRef.current;
    const target = cameraTargetRef.current;

    if (mode === 'TOP') {
      camera.position.set(0, 70, 0.1);
    } else if (mode === 'FRONT') {
      camera.position.set(0, 15, 60);
    } else {
      camera.position.set(38, 32, 48);
    }
    camera.lookAt(target);
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onContextMenu={(e) => e.preventDefault()}
      onClick={handleCanvasClick}
      className="relative w-full h-full bg-slate-950 overflow-hidden cursor-grab active:cursor-grabbing select-none"
    >
      {/* 1. THREE.JS REAL 3D WEBGL CANVAS SCENE */}
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* 2. HOVER 3D TAG TOOLTIP (MATCHING LAMPIRAN 2 FLOATING TAGS) */}
      {hoveredInfo && (
        <div
          style={{ left: hoveredInfo.screenPos.x + 15, top: hoveredInfo.screenPos.y - 25 }}
          className="absolute z-30 pointer-events-none bg-slate-900/90 backdrop-blur-md border border-teal-500/60 shadow-2xl px-2.5 py-1.5 rounded-lg flex items-center gap-2 transform -translate-x-1/2 -translate-y-full animate-fade-in"
        >
          <div className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-teal-300 font-mono leading-none">
              {hoveredInfo.ifcClass}
            </span>
            <span className="text-[11px] font-bold text-white leading-tight">
              {hoveredInfo.name}
            </span>
          </div>
          <span className="text-[8px] bg-teal-950 text-teal-400 border border-teal-800 px-1 py-0.5 rounded font-mono uppercase">
            Click to Inspect
          </span>
        </div>
      )}

      {/* 3. CAMERA PRESET CONTROLS & HUD OVERLAY */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md border border-slate-800 p-1 rounded-xl shadow-xl">
        <button
          type="button"
          onClick={() => handleResetCamera('ORBIT')}
          className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg transition border-none cursor-pointer ${
            cameraViewMode === 'ORBIT' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Orbit 3D
        </button>
        <button
          type="button"
          onClick={() => handleResetCamera('TOP')}
          className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg transition border-none cursor-pointer ${
            cameraViewMode === 'TOP' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Top 2D
        </button>
        <button
          type="button"
          onClick={() => handleResetCamera('FRONT')}
          className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg transition border-none cursor-pointer ${
            cameraViewMode === 'FRONT' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Tampak Depan
        </button>
      </div>

      {/* 4. BLENDER CANVAS INSTRUCTION BANNER */}
      <div className="absolute top-4 left-4 z-10 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 flex items-center gap-2 pointer-events-none shadow-lg">
        <Sparkles className="w-4 h-4 text-teal-400 animate-pulse" />
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-white block">3D BIM Real-Time Viewport (Three.js WebGL)</span>
            <span className="text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-1.5 py-0.2 rounded font-mono">
              📁 {uploadedCadFileName}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block">
            Drag Kiri: Orbit | Drag Kanan / Shift+Drag: Pan | Scroll: Zoom | Klik Objek: Inspeksi Metadata
          </span>
        </div>
      </div>

      {/* 5. LOADING OVERLAY */}
      {!isEngineReady && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center z-50">
          <Loader2 className="w-10 h-10 text-teal-400 animate-spin mb-3" />
          <span className="text-sm font-bold text-slate-200">Memuat Mesh 3D Building & WebGL Scene...</span>
          <div className="w-48 h-1.5 bg-slate-800 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-teal-400 transition-all duration-300" style={{ width: `${loadPercent}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}
