import { useEffect, useRef, useState, useMemo } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Sun, RotateCw, ArrowLeft, MousePointer2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { mockSubmissions } from "@/mock/submission/submissions";

export default function BimViewerPage() {
    const mountRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const [isSimulatingSun, setIsSimulatingSun] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    const housingName = useMemo(() => {
        if (!id) return "Peninjau 3D CAD/BIM";
        const sub = mockSubmissions.find(s => s.id === id);
        return sub ? sub.housingName : "Peninjau 3D CAD/BIM";
    }, [id]);

    useEffect(() => {
        const container = mountRef.current;
        if (!container) return;

        let animationFrameId: number;
        let time = 0;
        const sunState = { active: false };

        // ─── SCENE ───────────────────────────────────────────────────────────────
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0f172a);
        scene.fog = new THREE.FogExp2(0x0f172a, 0.012);

        // ─── CAMERA ──────────────────────────────────────────────────────────────
        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || window.innerHeight;
        const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000);
        camera.position.set(40, 35, 55);
        camera.lookAt(0, 0, 0);

        // ─── RENDERER (Optimized) ─────────────────────────────────────────────────
        const renderer = new THREE.WebGLRenderer({
            antialias: false,           // Off for performance
            powerPreference: "high-performance",
        });
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFShadowMap; // Lighter than PCFSoft
        renderer.outputColorSpace = THREE.SRGBColorSpace;

        // Canvas must fill container — explicitly style it
        renderer.domElement.style.display = "block";
        renderer.domElement.style.width = "100%";
        renderer.domElement.style.height = "100%";
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // ─── ORBIT CONTROLS ───────────────────────────────────────────────────────
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.06;
        controls.maxPolarAngle = Math.PI / 2 - 0.02;
        controls.minDistance = 8;
        controls.maxDistance = 180;

        // ─── LIGHTING ────────────────────────────────────────────────────────────
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x2d3748, 0.5);
        scene.add(hemisphereLight);

        const sunLight = new THREE.DirectionalLight(0xfff9c4, 1.8);
        sunLight.position.set(40, 60, 30);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 1024;
        sunLight.shadow.mapSize.height = 1024;
        sunLight.shadow.camera.near = 1;
        sunLight.shadow.camera.far = 200;
        sunLight.shadow.camera.left = -60;
        sunLight.shadow.camera.right = 60;
        sunLight.shadow.camera.top = 60;
        sunLight.shadow.camera.bottom = -60;
        sunLight.shadow.bias = -0.001;
        scene.add(sunLight);

        // ─── VISIBLE SUN SPHERE ───────────────────────────────────────────────────
        const sunGeom = new THREE.SphereGeometry(2.5, 12, 12);
        const sunMat = new THREE.MeshBasicMaterial({ color: 0xfff9c4 });
        const sunMesh = new THREE.Mesh(sunGeom, sunMat);
        sunMesh.position.copy(sunLight.position);
        scene.add(sunMesh);

        // ─── GROUND ───────────────────────────────────────────────────────────────
        const groundGeom = new THREE.PlaneGeometry(400, 400);
        const groundMat = new THREE.MeshLambertMaterial({ color: 0x1a2535 }); // Cheaper than Standard
        const ground = new THREE.Mesh(groundGeom, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        ground.castShadow = false;
        scene.add(ground);

        // ─── GRID ─────────────────────────────────────────────────────────────────
        const gridHelper = new THREE.GridHelper(200, 80, 0x2d3748, 0x1a2535);
        gridHelper.position.y = 0.05;
        const gridMats = Array.isArray(gridHelper.material) ? gridHelper.material : [gridHelper.material];
        gridMats.forEach(m => { m.transparent = true; m.opacity = 0.4; });
        scene.add(gridHelper);

        // ─── ROADS ────────────────────────────────────────────────────────────────
        const roadMat = new THREE.MeshLambertMaterial({ color: 0x2d3748 });
        const road1 = new THREE.Mesh(new THREE.PlaneGeometry(6, 100), roadMat);
        road1.rotation.x = -Math.PI / 2;
        road1.position.y = 0.06;
        scene.add(road1);
        const road2 = new THREE.Mesh(new THREE.PlaneGeometry(100, 6), roadMat);
        road2.rotation.x = -Math.PI / 2;
        road2.position.y = 0.06;
        scene.add(road2);

        // ─── BUILDINGS ────────────────────────────────────────────────────────────
        const houseMat = new THREE.MeshLambertMaterial({ color: 0x0f766e });
        const roofMat  = new THREE.MeshLambertMaterial({ color: 0x134e4a });
        const facilityMat = new THREE.MeshLambertMaterial({ color: 0xd97706 });
        const facilityRoofMat = new THREE.MeshLambertMaterial({ color: 0x92400e });

        const buildingGroup = new THREE.Group();
        scene.add(buildingGroup);
        const allGeoms: THREE.BufferGeometry[] = [];

        const placeBuilding = (
            x: number, z: number, w: number, d: number, h: number, 
            bodyMat: THREE.Material, roofMaterial: THREE.Material
        ) => {
            const bodyGeom = new THREE.BoxGeometry(w, h, d);
            allGeoms.push(bodyGeom);
            const body = new THREE.Mesh(bodyGeom, bodyMat);
            body.position.set(x, h / 2, z);
            body.castShadow = true;
            body.receiveShadow = true;
            buildingGroup.add(body);

            // Roof (pyramid-like via scaled box)
            const roofGeom = new THREE.ConeGeometry(Math.max(w, d) * 0.75, h * 0.3, 4);
            allGeoms.push(roofGeom);
            const roof = new THREE.Mesh(roofGeom, roofMaterial);
            roof.position.set(x, h + (h * 0.15), z);
            roof.rotation.y = Math.PI / 4;
            roof.castShadow = true;
            buildingGroup.add(roof);
        };

        // Grid-based layout for realism (not random scatter)
        const rows = 5, cols = 5;
        const spacingX = 14, spacingZ = 16;
        const offsetX = -((cols - 1) * spacingX) / 2;
        const offsetZ = -((rows - 1) * spacingZ) / 2;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = offsetX + col * spacingX;
                const z = offsetZ + row * spacingZ;
                // Skip center area for road intersection
                if (Math.abs(x) < 6 || Math.abs(z) < 8) continue;

                const isFacility = (row === 0 && col === 0) || (row === 4 && col === 4);
                const bw = 4 + Math.random() * 2;
                const bd = 5 + Math.random() * 2;
                const bh = isFacility ? 8 + Math.random() * 6 : 3 + Math.random() * 2;

                placeBuilding(
                    x + (Math.random() - 0.5) * 2,
                    z + (Math.random() - 0.5) * 2,
                    bw, bd, bh,
                    isFacility ? facilityMat : houseMat,
                    isFacility ? facilityRoofMat : roofMat
                );
            }
        }

        // ─── ANIMATION LOOP ───────────────────────────────────────────────────────
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            controls.update();

            if (sunState.active) {
                time += 0.004;
                const radius = 90;
                sunLight.position.x = Math.cos(time) * radius;
                sunLight.position.y = Math.max(8, Math.sin(time) * radius);
                sunLight.position.z = Math.sin(time * 0.5) * 40;
                sunMesh.position.copy(sunLight.position);

                const ratio = sunLight.position.y / radius;
                if (ratio < 0.25) {
                    sunLight.color.set(0xf97316);
                    sunMat.color.set(0xf97316);
                    sunLight.intensity = 0.7;
                    ambientLight.intensity = 0.15;
                } else {
                    sunLight.color.set(0xfff9c4);
                    sunMat.color.set(0xfff9c4);
                    sunLight.intensity = 1.8;
                    ambientLight.intensity = 0.5;
                }
            } else {
                sunLight.position.set(40, 60, 30);
                sunMesh.position.copy(sunLight.position);
                sunLight.color.set(0xfff9c4);
                sunMat.color.set(0xfff9c4);
                sunLight.intensity = 1.8;
                ambientLight.intensity = 0.5;
            }

            renderer.render(scene, camera);
        };
        animate();
        setIsReady(true);

        // ─── RESIZE ───────────────────────────────────────────────────────────────
        const handleResize = () => {
            const cw = container.clientWidth;
            const ch = container.clientHeight;
            camera.aspect = cw / ch;
            camera.updateProjectionMatrix();
            renderer.setSize(cw, ch);
        };
        window.addEventListener("resize", handleResize);

        // ─── RESET CAM EVENT ──────────────────────────────────────────────────────
        const handleResetCam = () => {
            camera.position.set(40, 35, 55);
            controls.target.set(0, 0, 0);
            controls.update();
        };
        window.addEventListener("bim-reset-cam", handleResetCam);

        // ─── TOGGLE SUN EVENT ─────────────────────────────────────────────────────
        const handleToggleSun = (e: Event) => {
            sunState.active = (e as CustomEvent).detail;
        };
        window.addEventListener("bim-toggle-sun", handleToggleSun);

        // ─── CLEANUP ─────────────────────────────────────────────────────────────
        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("bim-reset-cam", handleResetCam);
            window.removeEventListener("bim-toggle-sun", handleToggleSun);

            allGeoms.forEach(g => g.dispose());
            sunGeom.dispose();
            sunMat.dispose();
            groundGeom.dispose();
            groundMat.dispose();
            roadMat.dispose();
            houseMat.dispose();
            roofMat.dispose();
            facilityMat.dispose();
            facilityRoofMat.dispose();
            gridHelper.geometry.dispose();
            gridMats.forEach(m => m.dispose());

            controls.dispose();
            renderer.dispose();
            renderer.forceContextLoss();
            rendererRef.current = null;

            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Toggle sun via custom event (avoids stale closure problem)
    const handleSunToggle = () => {
        const next = !isSimulatingSun;
        setIsSimulatingSun(next);
        window.dispatchEvent(new CustomEvent("bim-toggle-sun", { detail: next }));
    };

    return (
        <div style={{ position: "fixed", inset: 0, background: "#0f172a", zIndex: 9999 }}>
            {/* ── THREE.JS MOUNT TARGET ── fills entire viewport */}
            <div
                ref={mountRef}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
            />

            {/* ── TOP BAR ── */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 }}
                className="flex items-center gap-4 px-6 py-4 border-b border-slate-700/60 bg-slate-900/70 backdrop-blur-md shadow-xl"
            >
                <button
                    onClick={() => navigate("/gis")}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-teal-600 text-slate-300 hover:text-white text-xs font-bold uppercase tracking-widest rounded-lg transition-all cursor-pointer outline-none border border-slate-700 hover:border-teal-500"
                >
                    <ArrowLeft size={15} />
                    Kembali ke Peta
                </button>

                <div className="h-5 w-px bg-slate-700" />

                <div className="flex items-center gap-3 text-teal-400">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-70" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500" />
                    </span>
                    <h1 className="text-sm font-black tracking-widest uppercase text-teal-300">
                        BIM VIEWER — {housingName}
                    </h1>
                </div>

                {!isReady && (
                    <div className="ml-auto flex items-center gap-2 text-xs text-slate-400">
                        <span className="animate-spin text-teal-400">⏳</span>
                        Memuat engine 3D…
                    </div>
                )}
            </div>

            {/* ── HUD BOTTOM BAR ── */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 10 }}
                className="flex items-center justify-between px-6 pb-6 pt-4 pointer-events-none"
            >
                {/* Left: hint */}
                <div className="pointer-events-auto flex items-center gap-3 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 px-5 py-3 rounded-xl shadow-xl">
                    <MousePointer2 size={16} className="text-teal-400" />
                    <span className="text-xs font-semibold text-slate-300">
                        Drag → Putar &nbsp;|&nbsp; Scroll → Zoom &nbsp;|&nbsp; Klik Kanan+Drag → Geser
                    </span>
                </div>

                {/* Right: actions */}
                <div className="pointer-events-auto flex items-center gap-3">
                    <button
                        onClick={handleSunToggle}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold border transition-all shadow-xl cursor-pointer outline-none ${
                            isSimulatingSun
                                ? "bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30"
                                : "bg-slate-900/80 text-slate-300 border-slate-700/50 hover:bg-slate-800 hover:text-white"
                        }`}
                    >
                        <Sun size={16} className={isSimulatingSun ? "animate-spin" : ""} style={isSimulatingSun ? { animationDuration: "3s" } : {}} />
                        {isSimulatingSun ? "Hentikan Simulasi" : "Simulasi Matahari"}
                    </button>

                    <button
                        onClick={() => window.dispatchEvent(new Event("bim-reset-cam"))}
                        className="flex items-center gap-2 px-5 py-3 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 hover:bg-teal-600 hover:border-teal-500 hover:text-white text-slate-300 rounded-xl text-sm font-bold transition-all shadow-xl cursor-pointer outline-none"
                    >
                        <RotateCw size={16} />
                        Reset View
                    </button>
                </div>
            </div>
        </div>
    );
}
