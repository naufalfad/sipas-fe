import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { MercatorCoordinate } from 'maplibre-gl';
import { disposeHierarchy, createMockSitePlanModel } from '../utils/bimModel';

export function useCustom3DLayer() {
  const customUser3DLayerRef = useRef<any>(null);

  const customUser3DLayer = useMemo(() => {
    const layer: any = {
      id: 'user-3d-model-layer',
      type: 'custom',
      renderingMode: '3d',
      map: null,
      renderer: null,
      scene: null,
      camera: null,
      modelMesh: null,
      currentModelId: null,
      modelTransform: null,
      pendingCentroid: null,
      pendingModelUrl: null,

      onAdd(map: any, gl: any) {
        this.map = map;
        this.renderer = new THREE.WebGLRenderer({
          canvas: map.getCanvas(),
          context: gl,
          antialias: true,
        });
        this.renderer.autoClear = false;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera();

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(0, -70, 100).normalize();
        this.scene.add(dirLight);

        const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
        dirLight2.position.set(0, 70, 100).normalize();
        this.scene.add(dirLight2);

        if (this.currentModelId && this.pendingCentroid) {
          const id = this.currentModelId;
          const centroid = this.pendingCentroid;
          const url = this.pendingModelUrl;
          this.currentModelId = null;
          this.loadModel(id, centroid, url);
        }
      },

      loadModel(id: string, centroid: [number, number], modelUrl: string) {
        if (this.currentModelId === id && this.scene) return;

        this.clearModel();
        this.currentModelId = id;
        this.pendingCentroid = centroid;
        this.pendingModelUrl = modelUrl;

        if (!this.scene) return;

        const center = MercatorCoordinate.fromLngLat(centroid, 0);
        const scale = center.meterInMercatorCoordinateUnits();

        this.modelTransform = {
          translateX: center.x,
          translateY: center.y,
          translateZ: center.z,
          scale: scale,
          rx: Math.PI / 2,
          ry: 0,
          rz: 0,
        };

        const triggerFallback = () => {
          if (this.currentModelId !== id || !this.scene) return;
          if (this.modelMesh) {
            this.scene.remove(this.modelMesh);
            disposeHierarchy(this.modelMesh);
          }
          const mockModel = createMockSitePlanModel();
          this.modelMesh = mockModel;
          this.scene.add(mockModel);
          if (this.map) this.map.triggerRepaint();
        };

        if (modelUrl) {
          import('three/addons/loaders/GLTFLoader.js').then(({ GLTFLoader }) => {
            if (this.currentModelId !== id) return;

            const loader = new GLTFLoader();
            loader.load(
              modelUrl,
              (gltf) => {
                if (this.currentModelId !== id) {
                  disposeHierarchy(gltf.scene);
                  return;
                }

                if (this.modelMesh && this.scene) {
                  this.scene.remove(this.modelMesh);
                  disposeHierarchy(this.modelMesh);
                }

                const model = gltf.scene;
                model.scale.set(10, 10, 10);

                this.modelMesh = model;
                this.scene.add(model);
                if (this.map) this.map.triggerRepaint();
              },
              undefined,
              (err) => {
                console.warn('[THREE-BIM] Fallback triggered:', err);
                triggerFallback();
              }
            );
          }).catch((err) => {
            console.warn('[THREE-BIM] Fallback triggered:', err);
            triggerFallback();
          });
        } else {
          triggerFallback();
        }
      },

      clearModel() {
        this.currentModelId = null;
        this.modelTransform = null;
        this.pendingCentroid = null;
        this.pendingModelUrl = null;
        if (this.modelMesh && this.scene) {
          this.scene.remove(this.modelMesh);
          disposeHierarchy(this.modelMesh);
          this.modelMesh = null;
          if (this.map) this.map.triggerRepaint();
        }
      },

      render(_gl: any, matrix: number[]) {
        if (!this.renderer || !this.scene || !this.camera || !this.modelMesh || !this.modelTransform || !this.pendingCentroid) return;

        const { rx, ry, rz } = this.modelTransform;

        let elevation = 0;
        if (this.map) {
          try {
            elevation = this.map.queryTerrainElevation(this.pendingCentroid) || 0;
          } catch (e) {
            // ignore elevation read errors during tile transitions
          }
        }

        const center = MercatorCoordinate.fromLngLat(this.pendingCentroid, elevation);
        const scale = center.meterInMercatorCoordinateUnits();

        const rotationX = new THREE.Matrix4().makeRotationX(rx);
        const rotationY = new THREE.Matrix4().makeRotationY(ry);
        const rotationZ = new THREE.Matrix4().makeRotationZ(rz);

        const m = new THREE.Matrix4().fromArray(matrix);
        const l = new THREE.Matrix4()
          .makeTranslation(center.x, center.y, center.z)
          .scale(new THREE.Vector3(scale, -scale, scale))
          .multiply(rotationX)
          .multiply(rotationY)
          .multiply(rotationZ);

        this.camera.projectionMatrix = m.multiply(l);
        this.renderer.resetState();
        this.renderer.render(this.scene, this.camera);
      },

      onRemove() {
        this.clearModel();
        if (this.renderer) {
          this.renderer.dispose();
          this.renderer = null;
        }
      }
    };

    customUser3DLayerRef.current = layer;
    return layer;
  }, []);

  return { customUser3DLayer, customUser3DLayerRef };
}
