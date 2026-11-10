import * as THREE from 'three';
import {
  createBrandHeaderTexture,
  createKnurlBumpTexture,
  createPlateFaceTexture,
  createPlatformDeckTexture,
  createRadialShadowTexture,
  FINISH_THEMES,
  FinishPresetId,
} from './gymMaterials';

export type HotspotId = 'barbell' | 'rack' | 'legpress' | 'platform' | 'kettlebells';

export interface HotspotSpec {
  id: HotspotId;
  title: string;
  subtitle: string;
  metrics: { label: string; value: string }[];
  description: string;
  cameraPos: [number, number, number];
  cameraTarget: [number, number, number];
}

export const HOTSPOT_SPECS: Record<HotspotId, HotspotSpec> = {
  barbell: {
    id: 'barbell',
    title: '21 Fitness Olympic Barbell',
    subtitle: 'Compound Strength · Squats, Deadlifts & Presses',
    metrics: [
      { label: 'Bar Weight', value: '20 kg' },
      { label: 'Grip Shaft', value: '28 mm' },
      { label: 'Spin', value: '10 Bearings' },
    ],
    description:
      'Used for foundational compound lifts (Squats, Bench Press, Deadlifts, Overhead Press). High-tensile steel with diamond knurling ensures a secure grip during heavy sets.',
    cameraPos: [2.2, 1.55, 2.35],
    cameraTarget: [0, 1.32, 0.25],
  },
  rack: {
    id: 'rack',
    title: '21 Fitness Monolith Power Rack',
    subtitle: 'Safe Solo Lifting · 25mm Westside Hole Spacing',
    metrics: [
      { label: 'Steel Frame', value: '7-Gauge' },
      { label: 'Max Load', value: '1,500 kg' },
      { label: 'Safety Arms', value: 'UHMW Lined' },
    ],
    description:
      'Engineered with heavy-duty safety spotter arms and multi-grip pull-up handles so you can train to muscular failure safely on squats and presses.',
    cameraPos: [-3.1, 2.4, 3.4],
    cameraTarget: [0, 1.45, 0],
  },
  legpress: {
    id: 'legpress',
    title: '45° Linear Plate-Loaded Leg Press',
    subtitle: 'Quad, Glute & Hamstring Hypertrophy Machine',
    metrics: [
      { label: 'Rail Angle', value: '45 Degrees' },
      { label: 'Sled Capacity', value: '600 kg' },
      { label: 'Bearings', value: 'Linear Rods' },
    ],
    description:
      'Isolates the quadriceps, glutes, and hamstrings without spinal compression. Foot placement high on the diamond plate targets glutes/hamstrings; low placement emphasizes quads.',
    cameraPos: [-3.6, 1.65, 2.5],
    cameraTarget: [-2.15, 0.85, -0.1],
  },
  platform: {
    id: 'platform',
    title: '21 Fitness Shock-Absorbing Platform',
    subtitle: 'Joint Protection · Smoked Oak & High-Density Rubber',
    metrics: [
      { label: 'Shock Damping', value: '-34 dB' },
      { label: 'Thickness', value: '80 mm' },
      { label: 'Center Deck', value: 'Hardwood' },
    ],
    description:
      'Provides rock-solid heel stability for squats and deadlifts while absorbing impact forces on heavy barbell drops.',
    cameraPos: [0.0, 2.8, 4.2],
    cameraTarget: [0, 0.2, 0.3],
  },
  kettlebells: {
    id: 'kettlebells',
    title: 'Cast Iron Kettlebell & Free-Weight Rack',
    subtitle: 'Functional Power · Core, Grip & Metabolic Conditioning',
    metrics: [
      { label: 'Weight Range', value: '8–48 kg' },
      { label: 'Handle', value: '35 mm' },
      { label: 'Construction', value: 'Single-Cast' },
    ],
    description:
      'Ideal for ballistic swings, Turkish get-ups, goblet squats, and unilateral carries to build posterior chain endurance and grip strength.',
    cameraPos: [3.4, 1.5, 2.6],
    cameraTarget: [2.05, 0.75, -0.2],
  },
};

export interface PlateMeshEntry {
  mesh: THREE.Group;
  side: -1 | 1;
  indexOnSleeve: number;
  weightKg: number;
  baseX: number;
  explodedX: number;
  currentScale: number;
}

export interface ExplodablePart {
  obj: THREE.Object3D;
  basePos: THREE.Vector3;
  explodeDelta: THREE.Vector3;
}

export interface GymRigController {
  rootGroup: THREE.Group;
  barbellGroup: THREE.Group;
  plateEntries: PlateMeshEntry[];
  collarEntries: ExplodablePart[];
  explodableParts: ExplodablePart[];
  raycastTargets: THREE.Object3D[];
  rackMaterials: THREE.MeshPhysicalMaterial[];
  accentMaterials: THREE.MeshPhysicalMaterial[];
  barShaftMaterial: THREE.MeshPhysicalMaterial;
  applyFinishTheme: (presetId: FinishPresetId) => void;
  dispose: () => void;
}

function createLathePlateGeometry(radius: number, thickness: number): THREE.LatheGeometry {
  const bore = 0.028;
  const hubR = radius * 0.28;
  const dishInnerR = radius * 0.32;
  const dishOuterR = radius * 0.86;
  const halfT = thickness * 0.5;
  const dishT = halfT * 0.62;

  const points: THREE.Vector2[] = [
    new THREE.Vector2(bore, -halfT),
    new THREE.Vector2(hubR, -halfT),
    new THREE.Vector2(dishInnerR, -dishT),
    new THREE.Vector2(dishOuterR, -dishT),
    new THREE.Vector2(radius * 0.92, -halfT),
    new THREE.Vector2(radius, -halfT * 0.82),
    new THREE.Vector2(radius, halfT * 0.82),
    new THREE.Vector2(radius * 0.92, halfT),
    new THREE.Vector2(dishOuterR, dishT),
    new THREE.Vector2(dishInnerR, dishT),
    new THREE.Vector2(hubR, halfT),
    new THREE.Vector2(bore, halfT),
    new THREE.Vector2(bore, -halfT),
  ];

  const geom = new THREE.LatheGeometry(points, 48);
  geom.rotateZ(Math.PI / 2);
  geom.computeVertexNormals();
  return geom;
}

export function buildGymRig(maxAnisotropy: number): GymRigController {
  const rootGroup = new THREE.Group();
  const geometriesToDispose: THREE.BufferGeometry[] = [];
  const materialsToDispose: THREE.Material[] = [];
  const texturesToDispose: THREE.Texture[] = [];

  const rackMaterials: THREE.MeshPhysicalMaterial[] = [];
  const accentMaterials: THREE.MeshPhysicalMaterial[] = [];
  const explodableParts: ExplodablePart[] = [];
  const collarEntries: ExplodablePart[] = [];
  const plateEntries: PlateMeshEntry[] = [];
  const raycastTargets: THREE.Object3D[] = [];

  const initialTheme = FINISH_THEMES['obsidian-brass'];

  const rackMat = new THREE.MeshPhysicalMaterial({
    color: initialTheme.rackColor,
    roughness: initialTheme.rackRoughness,
    metalness: initialTheme.rackMetalness,
    clearcoat: 0.25,
    clearcoatRoughness: 0.35,
  });
  rackMaterials.push(rackMat);
  materialsToDispose.push(rackMat);

  const accentMat = new THREE.MeshPhysicalMaterial({
    color: initialTheme.accentColor,
    roughness: initialTheme.accentRoughness,
    metalness: initialTheme.accentMetalness,
    anisotropy: 0.8,
    clearcoat: 0.4,
  });
  accentMaterials.push(accentMat);
  materialsToDispose.push(accentMat);

  const knurlTex = createKnurlBumpTexture(maxAnisotropy);
  texturesToDispose.push(knurlTex);

  const barShaftMaterial = new THREE.MeshPhysicalMaterial({
    color: initialTheme.barShaftColor,
    roughness: 0.18,
    metalness: 0.95,
    anisotropy: 0.75,
    bumpMap: knurlTex,
    bumpScale: 0.0018,
  });
  materialsToDispose.push(barShaftMaterial);

  const chromeSleeveMat = new THREE.MeshPhysicalMaterial({
    color: 0xf1f5f9,
    roughness: 0.12,
    metalness: 0.97,
    anisotropy: 0.85,
  });
  materialsToDispose.push(chromeSleeveMat);

  const uhmwMat = new THREE.MeshStandardMaterial({
    color: 0x09090b,
    roughness: 0.78,
    metalness: 0.08,
  });
  materialsToDispose.push(uhmwMat);

  const leatherPadMat = new THREE.MeshPhysicalMaterial({
    color: 0x161413,
    roughness: 0.55,
    metalness: 0.05,
    clearcoat: 0.15,
  });
  materialsToDispose.push(leatherPadMat);

  // 1. Contact Shadow Plane (Y = 0.005)
  const shadowTex = createRadialShadowTexture();
  texturesToDispose.push(shadowTex);
  const shadowPlaneGeo = new THREE.PlaneGeometry(8.5, 5.8);
  geometriesToDispose.push(shadowPlaneGeo);
  const shadowPlaneMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    depthWrite: false,
    opacity: 0.65,
  });
  materialsToDispose.push(shadowPlaneMat);
  const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.set(0, 0.005, 0);
  rootGroup.add(shadowPlane);

  // 2. Studio Floor (Y = 0)
  const studioFloorGeo = new THREE.PlaneGeometry(30, 30);
  geometriesToDispose.push(studioFloorGeo);
  const studioFloorMat = new THREE.MeshStandardMaterial({
    color: 0x09090b,
    roughness: 0.68,
    metalness: 0.15,
  });
  materialsToDispose.push(studioFloorMat);
  const studioFloor = new THREE.Mesh(studioFloorGeo, studioFloorMat);
  studioFloor.rotation.x = -Math.PI / 2;
  studioFloor.position.y = 0;
  studioFloor.receiveShadow = true;
  rootGroup.add(studioFloor);

  // 3. Acoustic Lifting Platform with "21 FITNESS" Deck Inlay
  const platformGroup = new THREE.Group();
  rootGroup.add(platformGroup);

  const baseFrameGeo = new THREE.BoxGeometry(3.15, 0.065, 2.75);
  geometriesToDispose.push(baseFrameGeo);
  const baseFrameMesh = new THREE.Mesh(baseFrameGeo, rackMat);
  baseFrameMesh.position.set(0, 0.035, 0.15);
  baseFrameMesh.castShadow = true;
  baseFrameMesh.receiveShadow = true;
  platformGroup.add(baseFrameMesh);

  const deckTex = createPlatformDeckTexture(maxAnisotropy);
  texturesToDispose.push(deckTex);
  const deckGeo = new THREE.PlaneGeometry(3.05, 2.65);
  geometriesToDispose.push(deckGeo);
  const deckMat = new THREE.MeshStandardMaterial({
    map: deckTex,
    roughness: 0.48,
    metalness: 0.18,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  materialsToDispose.push(deckMat);
  const deckMesh = new THREE.Mesh(deckGeo, deckMat);
  deckMesh.rotation.x = -Math.PI / 2;
  deckMesh.position.set(0, 0.072, 0.15);
  deckMesh.receiveShadow = true;
  platformGroup.add(deckMesh);

  const rampGeo = new THREE.BoxGeometry(3.15, 0.03, 0.08);
  geometriesToDispose.push(rampGeo);
  const rampMesh = new THREE.Mesh(rampGeo, accentMat);
  rampMesh.position.set(0, 0.025, 1.54);
  rampMesh.rotation.x = 0.25;
  rampMesh.castShadow = true;
  platformGroup.add(rampMesh);

  // 4. 4-Post CNC Monolith Power Rack with "21 FITNESS" Header Signplate
  const rackGroup = new THREE.Group();
  rootGroup.add(rackGroup);

  const uprightShape = new THREE.Shape();
  const uSize = 0.078;
  uprightShape.moveTo(-uSize / 2, -uSize / 2);
  uprightShape.lineTo(uSize / 2, -uSize / 2);
  uprightShape.lineTo(uSize / 2, uSize / 2);
  uprightShape.lineTo(-uSize / 2, uSize / 2);
  uprightShape.closePath();

  const uprightGeo = new THREE.ExtrudeGeometry(uprightShape, {
    depth: 2.38,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.005,
    bevelSegments: 2,
  });
  uprightGeo.rotateX(-Math.PI / 2);
  geometriesToDispose.push(uprightGeo);

  const rackWidth = 1.22;
  const rackDepth = 1.08;
  const uprightPositions: [number, number][] = [
    [-rackWidth / 2, -rackDepth / 2],
    [rackWidth / 2, -rackDepth / 2],
    [-rackWidth / 2, rackDepth / 2 - 0.15],
    [rackWidth / 2, rackDepth / 2 - 0.15],
  ];

  const holeGeo = new THREE.CylinderGeometry(0.011, 0.011, uSize + 0.016, 16);
  holeGeo.rotateX(Math.PI / 2);
  geometriesToDispose.push(holeGeo);
  const holeInstances = new THREE.InstancedMesh(holeGeo, accentMat, uprightPositions.length * 18);
  const dummy = new THREE.Object3D();
  let instanceIdx = 0;

  uprightPositions.forEach(([ux, uz]) => {
    const upright = new THREE.Mesh(uprightGeo, rackMat);
    upright.position.set(ux, 0.07, uz);
    upright.castShadow = true;
    upright.receiveShadow = true;
    rackGroup.add(upright);

    const gussetGeo = new THREE.BoxGeometry(0.16, 0.03, 0.16);
    geometriesToDispose.push(gussetGeo);
    const gusset = new THREE.Mesh(gussetGeo, accentMat);
    gusset.position.set(ux, 0.085, uz);
    rackGroup.add(gusset);

    for (let h = 0; h < 18; h++) {
      const hy = 0.42 + h * 0.095;
      dummy.position.set(ux, hy, uz);
      dummy.scale.setScalar(h % 5 === 0 ? 1.12 : 0.92);
      dummy.updateMatrix();
      holeInstances.setMatrixAt(instanceIdx++, dummy.matrix);
    }
  });
  holeInstances.instanceMatrix.needsUpdate = true;
  holeInstances.computeBoundingSphere();
  rackGroup.add(holeInstances);

  const sideBeamGeo = new THREE.BoxGeometry(0.07, 0.07, rackDepth - 0.15);
  geometriesToDispose.push(sideBeamGeo);
  [-rackWidth / 2, rackWidth / 2].forEach((ux) => {
    const topSide = new THREE.Mesh(sideBeamGeo, rackMat);
    topSide.position.set(ux, 2.38, -0.075);
    topSide.castShadow = true;
    rackGroup.add(topSide);

    const botSide = new THREE.Mesh(sideBeamGeo, rackMat);
    botSide.position.set(ux, 0.12, -0.075);
    botSide.castShadow = true;
    rackGroup.add(botSide);
  });

  const crossBeamGeo = new THREE.BoxGeometry(rackWidth + 0.08, 0.15, 0.07);
  geometriesToDispose.push(crossBeamGeo);
  const frontCross = new THREE.Mesh(crossBeamGeo, rackMat);
  frontCross.position.set(0, 2.36, rackDepth / 2 - 0.15);
  frontCross.castShadow = true;
  rackGroup.add(frontCross);

  const brandHeaderTex = createBrandHeaderTexture(initialTheme.plateRingHex, maxAnisotropy);
  texturesToDispose.push(brandHeaderTex);
  const brandPlateMat = new THREE.MeshStandardMaterial({
    map: brandHeaderTex,
    roughness: 0.25,
    metalness: 0.4,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  materialsToDispose.push(brandPlateMat);

  const brandPlateGeo = new THREE.PlaneGeometry(0.86, 0.13);
  geometriesToDispose.push(brandPlateGeo);
  const brandPlateMesh = new THREE.Mesh(brandPlateGeo, brandPlateMat);
  brandPlateMesh.position.set(0, 2.36, rackDepth / 2 - 0.112);
  rackGroup.add(brandPlateMesh);

  const rearCross = new THREE.Mesh(crossBeamGeo, rackMat);
  rearCross.position.set(0, 2.36, -rackDepth / 2);
  rearCross.castShadow = true;
  rackGroup.add(rearCross);

  const pullupCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-rackWidth / 2 + 0.05, 2.43, rackDepth / 2 - 0.15),
    new THREE.Vector3(-0.28, 2.53, rackDepth / 2 - 0.02),
    new THREE.Vector3(0.28, 2.53, rackDepth / 2 - 0.02),
    new THREE.Vector3(rackWidth / 2 - 0.05, 2.43, rackDepth / 2 - 0.15),
  ]);
  const pullupGeo = new THREE.TubeGeometry(pullupCurve, 32, 0.018, 12, false);
  geometriesToDispose.push(pullupGeo);
  const pullupMesh = new THREE.Mesh(pullupGeo, accentMat);
  pullupMesh.castShadow = true;
  rackGroup.add(pullupMesh);

  const barHeightY = 1.32;
  const frontZ = rackDepth / 2 - 0.15;

  [-1, 1].forEach((side) => {
    const ux = (side * rackWidth) / 2;

    const jCupGroup = new THREE.Group();
    const jBracketGeo = new THREE.BoxGeometry(0.095, 0.16, 0.11);
    const jLipGeo = new THREE.BoxGeometry(0.085, 0.08, 0.11);
    const jLinerGeo = new THREE.BoxGeometry(0.08, 0.025, 0.12);
    geometriesToDispose.push(jBracketGeo, jLipGeo, jLinerGeo);

    const jBracket = new THREE.Mesh(jBracketGeo, rackMat);
    const jLip = new THREE.Mesh(jLipGeo, accentMat);
    jLip.position.set(0, -0.04, 0.09);
    const jLiner = new THREE.Mesh(jLinerGeo, uhmwMat);
    jLiner.position.set(0, -0.01, 0.075);

    jCupGroup.add(jBracket, jLip, jLiner);
    const jBasePos = new THREE.Vector3(ux, barHeightY - 0.02, frontZ);
    jCupGroup.position.copy(jBasePos);
    rackGroup.add(jCupGroup);

    explodableParts.push({
      obj: jCupGroup,
      basePos: jBasePos.clone(),
      explodeDelta: new THREE.Vector3(side * 0.28, 0.12, 0.25),
    });

    const spotterGroup = new THREE.Group();
    const spotterBeamGeo = new THREE.BoxGeometry(0.075, 0.065, 0.62);
    const spotterPadGeo = new THREE.BoxGeometry(0.068, 0.018, 0.58);
    const spotterGussetGeo = new THREE.BoxGeometry(0.05, 0.16, 0.18);
    geometriesToDispose.push(spotterBeamGeo, spotterPadGeo, spotterGussetGeo);

    const sBeam = new THREE.Mesh(spotterBeamGeo, rackMat);
    sBeam.position.set(0, 0, 0.32);
    sBeam.castShadow = true;
    const sPad = new THREE.Mesh(spotterPadGeo, uhmwMat);
    sPad.position.set(0, 0.038, 0.32);
    const sGusset = new THREE.Mesh(spotterGussetGeo, accentMat);
    sGusset.position.set(0, -0.07, 0.12);

    spotterGroup.add(sBeam, sPad, sGusset);
    const sBasePos = new THREE.Vector3(ux, 0.84, frontZ);
    spotterGroup.position.copy(sBasePos);
    rackGroup.add(spotterGroup);

    explodableParts.push({
      obj: spotterGroup,
      basePos: sBasePos.clone(),
      explodeDelta: new THREE.Vector3(side * 0.25, -0.1, 0.42),
    });
  });

  // 5. Olympic Calibrated Barbell & Competition Plates Group
  const barbellGroup = new THREE.Group();
  const barZ = frontZ + 0.075;
  barbellGroup.position.set(0, barHeightY, barZ);
  rootGroup.add(barbellGroup);

  const shaftGeo = new THREE.CylinderGeometry(0.014, 0.014, 1.32, 24);
  shaftGeo.rotateZ(Math.PI / 2);
  geometriesToDispose.push(shaftGeo);
  const shaftMesh = new THREE.Mesh(shaftGeo, barShaftMaterial);
  shaftMesh.castShadow = true;
  barbellGroup.add(shaftMesh);

  const sleeveGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.42, 28);
  sleeveGeo.rotateZ(Math.PI / 2);
  const flangeGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.028, 28);
  flangeGeo.rotateZ(Math.PI / 2);
  geometriesToDispose.push(sleeveGeo, flangeGeo);

  [-1, 1].forEach((side) => {
    const flange = new THREE.Mesh(flangeGeo, accentMat);
    flange.position.set(side * 0.665, 0, 0);
    barbellGroup.add(flange);

    const sleeve = new THREE.Mesh(sleeveGeo, chromeSleeveMat);
    sleeve.position.set(side * 0.88, 0, 0);
    sleeve.castShadow = true;
    barbellGroup.add(sleeve);
  });

  const plateConfigs = [
    { weightKg: 25, radius: 0.225, thickness: 0.032, offsetX: 0.715, explodeStep: 0.22 },
    { weightKg: 20, radius: 0.225, thickness: 0.028, offsetX: 0.752, explodeStep: 0.44 },
    { weightKg: 15, radius: 0.202, thickness: 0.025, offsetX: 0.785, explodeStep: 0.66 },
    { weightKg: 10, radius: 0.175, thickness: 0.022, offsetX: 0.815, explodeStep: 0.88 },
  ];

  const plateSideRimMat = new THREE.MeshStandardMaterial({
    color: 0x16161a,
    roughness: 0.35,
    metalness: 0.75,
  });
  materialsToDispose.push(plateSideRimMat);

  const plateFaceMaterials: { weightKg: number; mat: THREE.MeshStandardMaterial }[] = [];

  plateConfigs.forEach((cfg, idx) => {
    const latheGeo = createLathePlateGeometry(cfg.radius, cfg.thickness);
    const facePlaneGeo = new THREE.CircleGeometry(cfg.radius * 0.91, 48);
    geometriesToDispose.push(latheGeo, facePlaneGeo);

    const faceTex = createPlateFaceTexture(
      cfg.weightKg,
      initialTheme.plateRingHex,
      initialTheme.plateBodyHex,
      maxAnisotropy
    );
    texturesToDispose.push(faceTex);

    const faceMat = new THREE.MeshStandardMaterial({
      map: faceTex,
      roughness: 0.32,
      metalness: 0.55,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    materialsToDispose.push(faceMat);
    plateFaceMaterials.push({ weightKg: cfg.weightKg, mat: faceMat });

    ([-1, 1] as const).forEach((side) => {
      const plateGroup = new THREE.Group();

      const bodyMesh = new THREE.Mesh(latheGeo, plateSideRimMat);
      bodyMesh.castShadow = true;
      bodyMesh.receiveShadow = true;
      plateGroup.add(bodyMesh);

      const outerFace = new THREE.Mesh(facePlaneGeo, faceMat);
      outerFace.rotation.y = side === 1 ? Math.PI / 2 : -Math.PI / 2;
      outerFace.position.x = side * (cfg.thickness * 0.5 + 0.001);
      plateGroup.add(outerFace);

      const innerFace = new THREE.Mesh(facePlaneGeo, faceMat);
      innerFace.rotation.y = side === 1 ? -Math.PI / 2 : Math.PI / 2;
      innerFace.position.x = -side * (cfg.thickness * 0.5 + 0.001);
      plateGroup.add(innerFace);

      const baseX = side * cfg.offsetX;
      const explodedX = side * (cfg.offsetX + cfg.explodeStep);
      plateGroup.position.set(baseX, 0, 0);
      barbellGroup.add(plateGroup);

      plateEntries.push({
        mesh: plateGroup,
        side,
        indexOnSleeve: idx,
        weightKg: cfg.weightKg,
        baseX,
        explodedX,
        currentScale: 1,
      });
    });
  });

  const collarBodyGeo = new THREE.CylinderGeometry(0.044, 0.044, 0.045, 28);
  collarBodyGeo.rotateZ(Math.PI / 2);
  const collarLeverGeo = new THREE.BoxGeometry(0.018, 0.065, 0.018);
  geometriesToDispose.push(collarBodyGeo, collarLeverGeo);

  ([-1, 1] as const).forEach((side) => {
    const collarGroup = new THREE.Group();
    const cBody = new THREE.Mesh(collarBodyGeo, accentMat);
    cBody.castShadow = true;
    const cLever = new THREE.Mesh(collarLeverGeo, chromeSleeveMat);
    cLever.position.set(0, 0.045, 0);
    collarGroup.add(cBody, cLever);

    const basePos = new THREE.Vector3(side * 0.865, 0, 0);
    collarGroup.position.copy(basePos);
    barbellGroup.add(collarGroup);

    collarEntries.push({
      obj: collarGroup,
      basePos,
      explodeDelta: new THREE.Vector3(side * 1.12, 0, 0),
    });
  });

  // 6. 45° Linear Plate-Loaded Leg Press Machine (Left Flank X = -2.15, Z = -0.1)
  const legPressGroup = new THREE.Group();
  legPressGroup.position.set(-2.15, 0, -0.1);
  legPressGroup.rotation.y = 0.25;
  rootGroup.add(legPressGroup);

  // Base Skid Frame
  const lpBaseGeo = new THREE.BoxGeometry(0.92, 0.06, 1.85);
  geometriesToDispose.push(lpBaseGeo);
  const lpBase = new THREE.Mesh(lpBaseGeo, rackMat);
  lpBase.position.set(0, 0.03, 0);
  lpBase.castShadow = true;
  lpBase.receiveShadow = true;
  legPressGroup.add(lpBase);

  // Angled 45° Guide Rails (Chrome Linear Rods)
  const railGeo = new THREE.CylinderGeometry(0.018, 0.018, 1.65, 20);
  geometriesToDispose.push(railGeo);
  [-0.32, 0.32].forEach((rx) => {
    const rail = new THREE.Mesh(railGeo, chromeSleeveMat);
    rail.position.set(rx, 0.68, -0.15);
    rail.rotation.x = Math.PI / 4;
    rail.castShadow = true;
    legPressGroup.add(rail);

    const supportPillarGeo = new THREE.BoxGeometry(0.07, 1.18, 0.08);
    geometriesToDispose.push(supportPillarGeo);
    const supportPillar = new THREE.Mesh(supportPillarGeo, rackMat);
    supportPillar.position.set(rx, 0.59, -0.68);
    supportPillar.castShadow = true;
    legPressGroup.add(supportPillar);
  });

  // Sled Carriage & Diamond Footplate
  const sledCarriage = new THREE.Group();
  sledCarriage.position.set(0, 0.82, -0.25);
  sledCarriage.rotation.x = Math.PI / 4;
  legPressGroup.add(sledCarriage);

  const footplateGeo = new THREE.BoxGeometry(0.84, 0.04, 0.58);
  const sledSpineGeo = new THREE.BoxGeometry(0.72, 0.12, 0.45);
  const sledHornGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.36, 24);
  sledHornGeo.rotateZ(Math.PI / 2);
  geometriesToDispose.push(footplateGeo, sledSpineGeo, sledHornGeo);

  const footplate = new THREE.Mesh(footplateGeo, rackMat);
  footplate.position.set(0, -0.12, 0.22);
  footplate.castShadow = true;
  sledCarriage.add(footplate);

  const footTrim = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.015, 0.6), accentMat);
  footTrim.position.set(0, -0.13, 0.22);
  sledCarriage.add(footTrim);

  const sledSpine = new THREE.Mesh(sledSpineGeo, rackMat);
  sledSpine.position.set(0, 0.05, 0);
  sledCarriage.add(sledSpine);

  // Weight horns + Loaded 25kg Plates on the Leg Press Sled
  const lpPlateGeo = createLathePlateGeometry(0.21, 0.032);
  geometriesToDispose.push(lpPlateGeo);
  [-1, 1].forEach((side) => {
    const horn = new THREE.Mesh(sledHornGeo, chromeSleeveMat);
    horn.position.set(side * 0.52, 0.08, 0);
    sledCarriage.add(horn);

    const lpPlate1 = new THREE.Mesh(lpPlateGeo, plateSideRimMat);
    lpPlate1.position.set(side * 0.44, 0.08, 0);
    lpPlate1.castShadow = true;
    sledCarriage.add(lpPlate1);

    const lpPlate2 = new THREE.Mesh(lpPlateGeo, accentMat);
    lpPlate2.position.set(side * 0.48, 0.08, 0);
    lpPlate2.castShadow = true;
    sledCarriage.add(lpPlate2);
  });

  // Ergonomic Angled Back Pad & Seat Pad
  const backPadGeo = new THREE.BoxGeometry(0.46, 0.09, 0.78);
  const seatPadGeo = new THREE.BoxGeometry(0.46, 0.08, 0.42);
  geometriesToDispose.push(backPadGeo, seatPadGeo);

  const backPad = new THREE.Mesh(backPadGeo, leatherPadMat);
  backPad.position.set(0, 0.38, 0.58);
  backPad.rotation.x = -0.62;
  backPad.castShadow = true;
  legPressGroup.add(backPad);

  const seatPad = new THREE.Mesh(seatPadGeo, leatherPadMat);
  seatPad.position.set(0, 0.16, 0.24);
  seatPad.rotation.x = 0.22;
  seatPad.castShadow = true;
  legPressGroup.add(seatPad);

  // 7. Kettlebell Sanctuary Rack (Right Flank X = +2.05)
  const kbRackGroup = new THREE.Group();
  kbRackGroup.position.set(2.05, 0, -0.2);
  kbRackGroup.rotation.y = -0.28;
  rootGroup.add(kbRackGroup);

  const kbLegGeo = new THREE.BoxGeometry(0.06, 0.88, 0.46);
  const kbShelfGeo = new THREE.BoxGeometry(1.18, 0.035, 0.42);
  geometriesToDispose.push(kbLegGeo, kbShelfGeo);

  [-0.56, 0.56].forEach((lx) => {
    const leg = new THREE.Mesh(kbLegGeo, rackMat);
    leg.position.set(lx, 0.44, 0);
    leg.castShadow = true;
    kbRackGroup.add(leg);
  });

  [0.36, 0.78].forEach((sy) => {
    const shelf = new THREE.Mesh(kbShelfGeo, rackMat);
    shelf.position.set(0, sy, 0);
    shelf.castShadow = true;
    shelf.receiveShadow = true;
    kbRackGroup.add(shelf);

    const trim = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.014, 0.015), accentMat);
    trim.position.set(0, sy + 0.012, 0.21);
    kbRackGroup.add(trim);
  });

  const kbPoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.065, 0),
    new THREE.Vector2(0.095, 0.045),
    new THREE.Vector2(0.102, 0.11),
    new THREE.Vector2(0.085, 0.165),
    new THREE.Vector2(0.042, 0.19),
    new THREE.Vector2(0, 0.19),
  ];
  const kbBodyGeo = new THREE.LatheGeometry(kbPoints, 28);
  const kbHandleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.055, 0.17, 0),
    new THREE.Vector3(-0.062, 0.255, 0),
    new THREE.Vector3(0, 0.27, 0),
    new THREE.Vector3(0.062, 0.255, 0),
    new THREE.Vector3(0.055, 0.17, 0),
  ]);
  const kbHandleGeo = new THREE.TubeGeometry(kbHandleCurve, 20, 0.013, 10, false);
  geometriesToDispose.push(kbBodyGeo, kbHandleGeo);

  const kbPositions = [
    { x: -0.34, y: 0.798, scale: 0.92 },
    { x: 0.0, y: 0.798, scale: 1.0 },
    { x: 0.34, y: 0.798, scale: 1.08 },
    { x: -0.34, y: 0.378, scale: 1.12 },
    { x: 0.0, y: 0.378, scale: 1.18 },
    { x: 0.34, y: 0.378, scale: 1.24 },
  ];

  kbPositions.forEach((kp) => {
    const kb = new THREE.Group();
    const bMesh = new THREE.Mesh(kbBodyGeo, rackMat);
    bMesh.castShadow = true;
    const hMesh = new THREE.Mesh(kbHandleGeo, chromeSleeveMat);
    hMesh.castShadow = true;
    const bandGeo = new THREE.CylinderGeometry(0.055, 0.065, 0.018, 24);
    geometriesToDispose.push(bandGeo);
    const bandMesh = new THREE.Mesh(bandGeo, accentMat);
    bandMesh.position.y = 0.175;
    kb.add(bMesh, hMesh, bandMesh);
    kb.position.set(kp.x, kp.y, 0);
    kb.scale.setScalar(kp.scale);
    kbRackGroup.add(kb);
  });

  // 8. Minimalist Architectural Light Portals
  const portalMat = new THREE.MeshStandardMaterial({
    color: 0xfff3d1,
    emissive: 0xd4af37,
    emissiveIntensity: 1.15,
    roughness: 0.2,
  });
  materialsToDispose.push(portalMat);

  [-2.6, 0, 2.6].forEach((px) => {
    const pillarGeo = new THREE.BoxGeometry(0.16, 3.8, 0.16);
    const stripGeo = new THREE.BoxGeometry(0.02, 3.4, 0.02);
    geometriesToDispose.push(pillarGeo, stripGeo);

    const pillar = new THREE.Mesh(pillarGeo, rackMat);
    pillar.position.set(px, 1.9, -2.6);
    rootGroup.add(pillar);

    const strip = new THREE.Mesh(stripGeo, portalMat);
    strip.position.set(px, 1.9, -2.5);
    rootGroup.add(strip);
  });

  // 9. Invisible Raycast Proxies on Layer 1
  const proxyMat = new THREE.MeshBasicMaterial({ visible: false });
  materialsToDispose.push(proxyMat);

  const proxies: { id: HotspotId; size: [number, number, number]; pos: [number, number, number] }[] = [
    { id: 'barbell', size: [2.35, 0.55, 0.55], pos: [0, barHeightY, barZ] },
    { id: 'rack', size: [1.5, 2.5, 1.3], pos: [0, 1.25, -0.05] },
    { id: 'legpress', size: [1.4, 1.35, 1.9], pos: [-2.15, 0.68, -0.1] },
    { id: 'platform', size: [3.2, 0.18, 2.75], pos: [0, 0.08, 0.15] },
    { id: 'kettlebells', size: [1.3, 1.15, 0.65], pos: [2.05, 0.55, -0.2] },
  ];

  proxies.forEach((p) => {
    const pGeo = new THREE.BoxGeometry(...p.size);
    geometriesToDispose.push(pGeo);
    const pMesh = new THREE.Mesh(pGeo, proxyMat);
    pMesh.position.set(...p.pos);
    pMesh.layers.enable(1);
    pMesh.userData.hotspotId = p.id;
    rootGroup.add(pMesh);
    raycastTargets.push(pMesh);
  });

  const applyFinishTheme = (presetId: FinishPresetId) => {
    const theme = FINISH_THEMES[presetId];
    rackMaterials.forEach((m) => {
      m.color.setHex(theme.rackColor);
      m.roughness = theme.rackRoughness;
      m.metalness = theme.rackMetalness;
    });
    accentMaterials.forEach((m) => {
      m.color.setHex(theme.accentColor);
      m.roughness = theme.accentRoughness;
      m.metalness = theme.accentMetalness;
    });
    barShaftMaterial.color.setHex(theme.barShaftColor);

    const oldHeaderMap = brandPlateMat.map;
    const newHeaderTex = createBrandHeaderTexture(theme.plateRingHex, maxAnisotropy);
    texturesToDispose.push(newHeaderTex);
    brandPlateMat.map = newHeaderTex;
    brandPlateMat.needsUpdate = true;
    if (oldHeaderMap) oldHeaderMap.dispose();

    plateFaceMaterials.forEach(({ weightKg, mat }) => {
      const oldMap = mat.map;
      const newTex = createPlateFaceTexture(weightKg, theme.plateRingHex, theme.plateBodyHex, maxAnisotropy);
      texturesToDispose.push(newTex);
      mat.map = newTex;
      mat.needsUpdate = true;
      if (oldMap) oldMap.dispose();
    });
  };

  const dispose = () => {
    geometriesToDispose.forEach((g) => g.dispose());
    materialsToDispose.forEach((m) => m.dispose());
    texturesToDispose.forEach((t) => t.dispose());
  };

  return {
    rootGroup,
    barbellGroup,
    plateEntries,
    collarEntries,
    explodableParts,
    raycastTargets,
    rackMaterials,
    accentMaterials,
    barShaftMaterial,
    applyFinishTheme,
    dispose,
  };
}
