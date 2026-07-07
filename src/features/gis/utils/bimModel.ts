import * as THREE from 'three';

export function disposeHierarchy(obj: any) {
  obj.traverse((child: any) => {
    if (child.geometry) {
      child.geometry.dispose();
    }
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach((m: any) => m.dispose());
      } else {
        child.material.dispose();
      }
    }
  });
}

export function createMockSitePlanModel() {
  const mainGroup = new THREE.Group();

  const lawnMat = new THREE.MeshLambertMaterial({ color: 0x1b5e20 });
  const roadMat = new THREE.MeshLambertMaterial({ color: 0x1e293b }); // Darker asphalt
  const markingMat = new THREE.MeshBasicMaterial({ color: 0xffffff }); // White markings
  const houseMat = new THREE.MeshLambertMaterial({ color: 0x0f766e });
  const roofMat = new THREE.MeshLambertMaterial({ color: 0x9a3412 }); // Terracotta orange
  const facilityMat = new THREE.MeshLambertMaterial({ color: 0xd97706 });
  const facilityRoofMat = new THREE.MeshLambertMaterial({ color: 0x78350f });
  const windowMat = new THREE.MeshBasicMaterial({ color: 0xfef08a }); // Lit window yellow
  const poleMat = new THREE.MeshLambertMaterial({ color: 0x475569 }); // Slate pole
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xfbef35 }); // Glowing light

  // 1. Lawn
  const lawnGeo = new THREE.BoxGeometry(80, 0.2, 80);
  const lawn = new THREE.Mesh(lawnGeo, lawnMat);
  lawn.position.y = 0.1;
  mainGroup.add(lawn);

  // 2. Roads
  const road1 = new THREE.Mesh(new THREE.BoxGeometry(6, 0.3, 80), roadMat);
  road1.position.set(0, 0.2, 0);
  mainGroup.add(road1);

  const road2 = new THREE.Mesh(new THREE.BoxGeometry(80, 0.3, 6), roadMat);
  road2.position.set(0, 0.2, 0);
  mainGroup.add(road2);

  // 3. Road Markings (dashed center lines)
  for (let z = -38; z <= 38; z += 6) {
    if (Math.abs(z) < 5) continue;
    const mark = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.32, 3), markingMat);
    mark.position.set(0, 0.201, z);
    mainGroup.add(mark);
  }
  for (let x = -38; x <= 38; x += 6) {
    if (Math.abs(x) < 5) continue;
    const mark = new THREE.Mesh(new THREE.BoxGeometry(3, 0.32, 0.2), markingMat);
    mark.position.set(x, 0.201, 0);
    mainGroup.add(mark);
  }

  // 4. Streetlights
  const addStreetlight = (lx: number, lz: number) => {
    const lightGroup = new THREE.Group();
    lightGroup.position.set(lx, 0.2, lz);

    const pole = new THREE.Mesh(new THREE.BoxGeometry(0.2, 6, 0.2), poleMat);
    pole.position.y = 3;
    lightGroup.add(pole);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.15, 0.5), poleMat);
    head.position.set(lx > 0 ? -0.3 : 0.3, 6, 0);
    lightGroup.add(head);

    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), lightMat);
    bulb.position.set(lx > 0 ? -0.3 : 0.3, 5.8, 0);
    lightGroup.add(bulb);

    mainGroup.add(lightGroup);
  };

  addStreetlight(4, 4);
  addStreetlight(-4, 4);
  addStreetlight(4, -4);
  addStreetlight(-4, -4);
  addStreetlight(4, 30);
  addStreetlight(-4, -30);

  // 5. Buildings Builder
  const placeBuilding = (
    x: number, z: number, w: number, d: number, h: number,
    bodyMat: THREE.Material, roofMaterial: THREE.Material
  ) => {
    const buildingGroup = new THREE.Group();
    buildingGroup.position.set(x, 0.2, z);

    const bodyGeom = new THREE.BoxGeometry(w, h, d);
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = h / 2;
    buildingGroup.add(body);

    const roofH = h * 0.4;
    const roofGeom = new THREE.ConeGeometry(Math.max(w, d) * 0.85, roofH, 4);
    const roof = new THREE.Mesh(roofGeom, roofMaterial);
    roof.position.y = h + (roofH / 2);
    roof.rotation.y = Math.PI / 4;
    buildingGroup.add(roof);

    const windowW = 0.5;
    const windowH = 0.8;
    const windowThick = 0.05;
    const floors = Math.floor(h / 3.5);

    for (let f = 0; f < floors; f++) {
      const winY = 1.5 + f * 3.5;
      for (let side = -1; side <= 1; side += 2) {
        const winX = side * (w * 0.25);
        const win = new THREE.Mesh(new THREE.BoxGeometry(windowW, windowH, windowThick), windowMat);
        win.position.set(winX, winY, d / 2 + 0.02);
        buildingGroup.add(win);

        const winBack = new THREE.Mesh(new THREE.BoxGeometry(windowW, windowH, windowThick), windowMat);
        winBack.position.set(winX, winY, -d / 2 - 0.02);
        buildingGroup.add(winBack);
      }
    }

    mainGroup.add(buildingGroup);
  };

  const rows = 5;
  const cols = 5;
  const spacingX = 14;
  const spacingZ = 16;
  const offsetX = -((cols - 1) * spacingX) / 2;
  const offsetZ = -((rows - 1) * spacingZ) / 2;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = offsetX + col * spacingX;
      const z = offsetZ + row * spacingZ;

      if (Math.abs(x) < 6 || Math.abs(z) < 8) continue;

      const isFacility = (row === 0 && col === 0) || (row === 4 && col === 4);
      const bw = 5 + (row % 2) * 1.5 + (col % 2) * 0.5;
      const bd = 6 + (col % 2) * 1.5 + (row % 2) * 0.5;
      const bh = isFacility ? 24 : 10 + (row % 3) * 3; // Much taller!

      placeBuilding(
        x,
        z,
        bw, bd, bh,
        isFacility ? facilityMat : houseMat,
        isFacility ? facilityRoofMat : roofMat
      );
    }
  }

  return mainGroup;
}
