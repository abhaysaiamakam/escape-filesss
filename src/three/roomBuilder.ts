import * as THREE from 'three';
import { RoomObjectId } from '../types/game';
import {
  buildHumanCharacter,
  CharacterRig,
} from './characterBuilder';
import {
  createBookSpineTexture,
  createCalendarTexture,
  createClockTexture,
  createClubLogoTexture,
  createContactShadowTexture,
  createDoorPlateTexture,
  createLetterTexture,
  createPlasterWallTexture,
  createPosterUvLayerTexture,
  createTerrazzoFloorTexture,
  createWallPosterTexture,
  createWoodTexture,
} from './proceduralTextures';

export interface HostelRoomHandles {
  root: THREE.Group;
  hitTargets: THREE.Object3D[];
  objectGroups: Record<RoomObjectId, THREE.Group>;
  ceilingFanPivot: THREE.Group;
  clockHourPivot: THREE.Group;
  clockMinutePivot: THREE.Group;
  clockSecondPivot: THREE.Group;
  deskDrawerPivot: THREE.Group;
  deskDrawerLedMat: THREE.MeshStandardMaterial;
  drawerKeyMesh: THREE.Group;
  drawerPaperMesh: THREE.Mesh;
  bookshelfDoorPivot: THREE.Group;
  bookshelfLedMat: THREE.MeshStandardMaterial;
  bookshelfBooks: Record<'A' | 'B' | 'C' | 'D', THREE.Mesh>;
  uvTorchInShelf: THREE.Group;
  exitDoorPivot: THREE.Group;
  exitDoorLedMat: THREE.MeshStandardMaterial;
  exitHandlePivot: THREE.Group;
  wardrobeDoorPivot: THREE.Group;
  backpackPocketPivot: THREE.Group;
  bedPillowMesh: THREE.Mesh;
  posterUvOverlay: THREE.Mesh;
  uvSpotLight: THREE.SpotLight;
  deskLampLight: THREE.PointLight;
  roomFillLight: THREE.PointLight;
  tubeGlassMat: THREE.MeshStandardMaterial;
  corridorTubeLight: THREE.PointLight;
  wardenUnderDoorShadow: THREE.Mesh;
  wardenCorridorFigure: THREE.Group;
  curtainLeftPivot: THREE.Group;
  curtainRightPivot: THREE.Group;
  rainMesh: THREE.InstancedMesh;
  rainSeeds: Array<{ x: number; y: number; z: number; speed: number }>;
  lightningLight: THREE.PointLight;
  nightBackdropMat: THREE.MeshBasicMaterial;
  studyPhoneGroup: THREE.Group;
  studyPhoneScreenMat: THREE.MeshStandardMaterial;
  hoverRingMesh: THREE.Mesh;
  playerRig: CharacterRig;
  roommateRig: CharacterRig;
  disposables: Array<{ dispose: () => void }>;
}

function addContactShadow(
  parent: THREE.Object3D,
  shadowTex: THREE.Texture,
  width: number,
  depth: number,
  x = 0,
  z = 0,
  opacity = 0.48
): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(width, depth);
  const mat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, 0.008, z);
  parent.add(mesh);
  return mesh;
}

function registerHitTarget(
  hitTargets: THREE.Object3D[],
  objectId: RoomObjectId,
  parent: THREE.Object3D,
  size: [number, number, number],
  offset: [number, number, number] = [0, 0, 0]
): THREE.Mesh {
  const geo = new THREE.BoxGeometry(size[0], size[1], size[2]);
  const mat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const box = new THREE.Mesh(geo, mat);
  box.position.set(offset[0], offset[1], offset[2]);
  box.userData.objectId = objectId;
  box.layers.set(1);
  parent.add(box);
  hitTargets.push(box);
  return box;
}

export function buildHostelRoom(
  scene: THREE.Scene,
  maxAnisotropy: number,
  isSoftwareGl: boolean
): HostelRoomHandles {
  const disposables: Array<{ dispose: () => void }> = [];
  const track = <T extends { dispose: () => void }>(item: T): T => {
    disposables.push(item);
    return item;
  };

  const root = new THREE.Group();
  scene.add(root);

  const hitTargets: THREE.Object3D[] = [];
  const objectGroups = {} as Record<RoomObjectId, THREE.Group>;

  // Textures
  const floorTex = createTerrazzoFloorTexture(maxAnisotropy);
  track(floorTex.map);
  track(floorTex.roughnessMap);

  const wallTex = track(createPlasterWallTexture(maxAnisotropy));
  const darkWoodTex = track(createWoodTexture('#4a3121', '#352115', maxAnisotropy));
  const teakWoodTex = track(createWoodTexture('#6b462b', '#4d311d', maxAnisotropy));
  const clockTex = track(createClockTexture(maxAnisotropy));
  const posterTex = track(createWallPosterTexture(maxAnisotropy));
  const posterUvTex = track(createPosterUvLayerTexture(maxAnisotropy));
  const calendarTex = track(createCalendarTexture(maxAnisotropy));
  const letterTex = track(createLetterTexture(maxAnisotropy));
  const doorPlateTex = track(createDoorPlateTexture(maxAnisotropy));
  const clubLogoTex = track(createClubLogoTexture(maxAnisotropy));
  const contactShadowTex = track(createContactShadowTexture());

  // Shared Materials
  const floorMat = track(
    new THREE.MeshStandardMaterial({
      map: floorTex.map,
      roughnessMap: floorTex.roughnessMap,
      roughness: 0.78,
      metalness: 0.05,
    })
  );
  const wallMat = track(
    new THREE.MeshStandardMaterial({
      map: wallTex,
      roughness: 0.92,
      metalness: 0.02,
    })
  );
  const ceilingMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x3b4048,
      roughness: 0.95,
      metalness: 0.0,
    })
  );
  const darkWoodMat = track(
    new THREE.MeshStandardMaterial({
      map: darkWoodTex,
      roughness: 0.68,
      metalness: 0.04,
    })
  );
  const teakWoodMat = track(
    new THREE.MeshStandardMaterial({
      map: teakWoodTex,
      roughness: 0.62,
      metalness: 0.05,
    })
  );
  const blackSteelMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x1d222b,
      roughness: 0.38,
      metalness: 0.82,
    })
  );
  const brassMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xc89d46,
      roughness: 0.28,
      metalness: 0.88,
    })
  );
  const chromeMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      roughness: 0.2,
      metalness: 0.92,
    })
  );
  const almirahSteelMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x4b5c58,
      roughness: 0.45,
      metalness: 0.65,
    })
  );

  // Room Shell (6.0m wide x 5.4m deep x 3.2m high)
  const roomW = 6.0;
  const roomD = 5.4;
  const roomH = 3.2;

  const floor = new THREE.Mesh(track(new THREE.PlaneGeometry(roomW, roomD)), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  root.add(floor);

  const ceiling = new THREE.Mesh(track(new THREE.PlaneGeometry(roomW, roomD)), ceilingMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = roomH;
  root.add(ceiling);

  // Back wall (z = -2.7) with window cutout composed from wall segments
  const backWallLeft = new THREE.Mesh(track(new THREE.BoxGeometry(3.8, roomH, 0.14)), wallMat);
  backWallLeft.position.set(-1.1, roomH / 2, -2.7);
  backWallLeft.receiveShadow = true;
  root.add(backWallLeft);

  const backWallRight = new THREE.Mesh(track(new THREE.BoxGeometry(0.8, roomH, 0.14)), wallMat);
  backWallRight.position.set(2.6, roomH / 2, -2.7);
  backWallRight.receiveShadow = true;
  root.add(backWallRight);

  const backWallUnderWin = new THREE.Mesh(track(new THREE.BoxGeometry(1.4, 1.05, 0.14)), wallMat);
  backWallUnderWin.position.set(1.5, 0.525, -2.7);
  backWallUnderWin.receiveShadow = true;
  root.add(backWallUnderWin);

  const backWallAboveWin = new THREE.Mesh(track(new THREE.BoxGeometry(1.4, 0.85, 0.14)), wallMat);
  backWallAboveWin.position.set(1.5, 2.775, -2.7);
  backWallAboveWin.receiveShadow = true;
  root.add(backWallAboveWin);

  // Left wall (x = -3.0)
  const leftWall = new THREE.Mesh(track(new THREE.BoxGeometry(0.14, roomH, roomD)), wallMat);
  leftWall.position.set(-3.0, roomH / 2, 0);
  leftWall.receiveShadow = true;
  root.add(leftWall);

  // Right wall (x = +3.0)
  const rightWall = new THREE.Mesh(track(new THREE.BoxGeometry(0.14, roomH, roomD)), wallMat);
  rightWall.position.set(3.0, roomH / 2, 0);
  rightWall.receiveShadow = true;
  root.add(rightWall);

  // Front wall (z = +2.7) with doorway opening (x from -0.05 to +0.95, y from 0 to 2.2)
  const frontLeft = new THREE.Mesh(track(new THREE.BoxGeometry(2.95, roomH, 0.14)), wallMat);
  frontLeft.position.set(-1.525, roomH / 2, 2.7);
  frontLeft.receiveShadow = true;
  root.add(frontLeft);

  const frontRight = new THREE.Mesh(track(new THREE.BoxGeometry(2.05, roomH, 0.14)), wallMat);
  frontRight.position.set(1.975, roomH / 2, 2.7);
  frontRight.receiveShadow = true;
  root.add(frontRight);

  const frontHeader = new THREE.Mesh(track(new THREE.BoxGeometry(1.0, 1.0, 0.14)), wallMat);
  frontHeader.position.set(0.45, 2.7, 2.7);
  frontHeader.receiveShadow = true;
  root.add(frontHeader);

  // Skirting boards around walls
  const baseboardMat = track(new THREE.MeshStandardMaterial({ color: 0x20252e, roughness: 0.7 }));
  const baseboardBack = new THREE.Mesh(track(new THREE.BoxGeometry(roomW, 0.1, 0.04)), baseboardMat);
  baseboardBack.position.set(0, 0.05, -2.62);
  root.add(baseboardBack);
  const baseboardLeft = new THREE.Mesh(track(new THREE.BoxGeometry(0.04, 0.1, roomD)), baseboardMat);
  baseboardLeft.position.set(-2.92, 0.05, 0);
  root.add(baseboardLeft);
  const baseboardRight = new THREE.Mesh(track(new THREE.BoxGeometry(0.04, 0.1, roomD)), baseboardMat);
  baseboardRight.position.set(2.92, 0.05, 0);
  root.add(baseboardRight);

  // Barred Window + Night Sky Backdrop (x = 1.5, y = 1.7, z = -2.7)
  const windowGroup = new THREE.Group();
  windowGroup.position.set(1.5, 1.7, -2.7);
  const sill = new THREE.Mesh(track(new THREE.BoxGeometry(1.5, 0.06, 0.24)), teakWoodMat);
  sill.position.set(0, -0.65, 0.02);
  windowGroup.add(sill);
  const topFrame = new THREE.Mesh(track(new THREE.BoxGeometry(1.46, 0.06, 0.18)), darkWoodMat);
  topFrame.position.set(0, 0.65, 0);
  windowGroup.add(topFrame);
  for (let b = -2; b <= 2; b++) {
    const bar = new THREE.Mesh(track(new THREE.CylinderGeometry(0.014, 0.014, 1.28, 8)), blackSteelMat);
    bar.position.set(b * 0.26, 0, 0.02);
    bar.castShadow = true;
    windowGroup.add(bar);
  }
  const glassPane = new THREE.Mesh(
    track(new THREE.PlaneGeometry(1.36, 1.24)),
    track(
      new THREE.MeshPhysicalMaterial({
        color: 0x8fb4ff,
        roughness: 0.08,
        metalness: 0.05,
        transparent: true,
        opacity: 0.18,
      })
    )
  );
  glassPane.position.set(0, 0, -0.02);
  windowGroup.add(glassPane);

  // Distant Night Sky + Moon + Rain + Lightning outside window
  const nightBackdropMat = track(new THREE.MeshBasicMaterial({ color: 0x070d1e }));
  const nightBackdrop = new THREE.Mesh(
    track(new THREE.PlaneGeometry(4.5, 3.5)),
    nightBackdropMat
  );
  nightBackdrop.position.set(0, 0.1, -2.5);
  windowGroup.add(nightBackdrop);

  const moonMesh = new THREE.Mesh(
    track(new THREE.CircleGeometry(0.28, 24)),
    track(new THREE.MeshBasicMaterial({ color: 0xdbeafe }))
  );
  moonMesh.position.set(0.32, 0.45, -2.45);
  windowGroup.add(moonMesh);

  // Opposite hostel wing silhouette
  const distantBlock = new THREE.Mesh(
    track(new THREE.BoxGeometry(3.8, 1.8, 0.4)),
    track(new THREE.MeshBasicMaterial({ color: 0x0d1426 }))
  );
  distantBlock.position.set(-0.2, -0.75, -2.1);
  windowGroup.add(distantBlock);

  // Instanced falling raindrops outside window
  const rainCount = 84;
  const rainGeo = track(new THREE.BoxGeometry(0.006, 0.11, 0.006));
  const rainMat = track(
    new THREE.MeshBasicMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.48,
      depthWrite: false,
    })
  );
  const rainMesh = new THREE.InstancedMesh(rainGeo, rainMat, rainCount);
  rainMesh.frustumCulled = false;
  const rainSeeds: Array<{ x: number; y: number; z: number; speed: number }> = [];
  const rainDummy = new THREE.Object3D();
  for (let i = 0; i < rainCount; i++) {
    const sx = ((i * 37) % 100) / 100 * 1.4 - 0.7;
    const sy = ((i * 53) % 100) / 100 * 1.4 - 0.7;
    const sz = -0.18 - ((i * 19) % 100) / 100 * 1.4;
    const speed = 2.1 + ((i * 13) % 10) * 0.14;
    rainSeeds.push({ x: sx, y: sy, z: sz, speed });
    rainDummy.position.set(sx, sy, sz);
    rainDummy.rotation.z = 0.08;
    rainDummy.updateMatrix();
    rainMesh.setMatrixAt(i, rainDummy.matrix);
  }
  rainMesh.instanceMatrix.needsUpdate = true;
  rainMesh.computeBoundingSphere();
  windowGroup.add(rainMesh);

  // Curtain rod + swaying hostel cotton curtains
  const curtainRod = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.012, 0.012, 1.66, 8)),
    blackSteelMat
  );
  curtainRod.rotation.z = Math.PI / 2;
  curtainRod.position.set(0, 0.74, 0.12);
  windowGroup.add(curtainRod);

  const curtainMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x3b485e,
      roughness: 0.92,
      side: THREE.DoubleSide,
    })
  );
  const curtainLeftPivot = new THREE.Group();
  curtainLeftPivot.position.set(-0.66, 0.74, 0.12);
  const curtainLeftCloth = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.32, 1.45, 0.025)),
    curtainMat
  );
  curtainLeftCloth.position.set(0.14, -0.72, 0);
  curtainLeftPivot.add(curtainLeftCloth);
  windowGroup.add(curtainLeftPivot);

  const curtainRightPivot = new THREE.Group();
  curtainRightPivot.position.set(0.66, 0.74, 0.12);
  const curtainRightCloth = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.32, 1.45, 0.025)),
    curtainMat
  );
  curtainRightCloth.position.set(-0.14, -0.72, 0);
  curtainRightPivot.add(curtainRightCloth);
  windowGroup.add(curtainRightPivot);

  // Lightning exterior flash light
  const lightningLight = new THREE.PointLight(0xbfdbfe, 0, 12, 1.2);
  lightningLight.position.set(0.2, 0.6, -1.3);
  windowGroup.add(lightningLight);

  root.add(windowGroup);

  // =====================================================
  // CEILING FAN (Animated 3-blade hostel fan) & TUBE LIGHT
  // =====================================================
  const fanGroup = new THREE.Group();
  fanGroup.position.set(0, roomH, -0.15);

  const fanCanopy = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.08, 0.11, 0.06, 16)),
    track(new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.4, metalness: 0.5 }))
  );
  fanCanopy.position.y = -0.03;
  fanGroup.add(fanCanopy);

  const fanRod = new THREE.Mesh(track(new THREE.CylinderGeometry(0.016, 0.016, 0.34, 10)), blackSteelMat);
  fanRod.position.y = -0.2;
  fanGroup.add(fanRod);

  const ceilingFanPivot = new THREE.Group();
  ceilingFanPivot.position.y = -0.38;

  const motorBody = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.14, 0.14, 0.09, 20)),
    track(new THREE.MeshStandardMaterial({ color: 0x3b2a1e, roughness: 0.35, metalness: 0.6 }))
  );
  const motorTrim = new THREE.Mesh(track(new THREE.TorusGeometry(0.14, 0.012, 8, 24)), brassMat);
  motorTrim.rotation.x = Math.PI / 2;
  motorTrim.position.y = -0.03;
  ceilingFanPivot.add(motorBody, motorTrim);

  const bladeMat = track(new THREE.MeshStandardMaterial({ color: 0x4b3424, roughness: 0.42, metalness: 0.35 }));
  for (let i = 0; i < 3; i++) {
    const bladeArm = new THREE.Group();
    bladeArm.rotation.y = (i * Math.PI * 2) / 3;

    const bracket = new THREE.Mesh(track(new THREE.BoxGeometry(0.05, 0.014, 0.14)), brassMat);
    bracket.position.set(0, 0, 0.17);
    const blade = new THREE.Mesh(track(new THREE.BoxGeometry(0.14, 0.012, 0.56)), bladeMat);
    blade.position.set(0, 0.005, 0.46);
    blade.rotation.z = 0.14; // Aerodynamic pitch
    blade.castShadow = true;

    bladeArm.add(bracket, blade);
    ceilingFanPivot.add(bladeArm);
  }
  fanGroup.add(ceilingFanPivot);
  root.add(fanGroup);

  // Fluorescent tube light mounted on ceiling above doorway side
  const tubeHousing = new THREE.Mesh(track(new THREE.BoxGeometry(1.15, 0.05, 0.09)), chromeMat);
  tubeHousing.position.set(0.2, roomH - 0.03, 1.55);
  root.add(tubeHousing);
  const tubeGlassMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      emissive: 0x4b6391,
      emissiveIntensity: 0.55,
      roughness: 0.25,
    })
  );
  const tubeGlass = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.018, 0.018, 1.05, 10)),
    tubeGlassMat
  );
  tubeGlass.rotation.z = Math.PI / 2;
  tubeGlass.position.set(0.2, roomH - 0.07, 1.55);
  root.add(tubeGlass);

  // =====================================================
  // 1. STUDY TABLE (`study_table`) - 7 composite parts
  // =====================================================
  const studyTableGroup = new THREE.Group();
  studyTableGroup.position.set(-2.05, 0, -1.75);
  addContactShadow(studyTableGroup, contactShadowTex, 1.75, 1.05, 0, 0, 0.55);

  const tableTop = new THREE.Mesh(track(new THREE.BoxGeometry(1.5, 0.055, 0.82)), teakWoodMat);
  tableTop.position.set(0, 0.76, 0);
  tableTop.castShadow = true;
  tableTop.receiveShadow = true;
  studyTableGroup.add(tableTop);

  // 4 tubular steel legs
  const legOffsets: [number, number][] = [
    [-0.68, -0.35],
    [0.68, -0.35],
    [-0.68, 0.35],
    [0.68, 0.35],
  ];
  legOffsets.forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(track(new THREE.CylinderGeometry(0.022, 0.02, 0.74, 10)), blackSteelMat);
    leg.position.set(lx, 0.37, lz);
    leg.castShadow = true;
    studyTableGroup.add(leg);
  });

  // Articulated Warm Desk Lamp (composite 4 parts)
  const lampBase = new THREE.Mesh(track(new THREE.CylinderGeometry(0.09, 0.1, 0.025, 16)), brassMat);
  lampBase.position.set(-0.5, 0.8, -0.22);
  studyTableGroup.add(lampBase);

  const neckCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.5, 0.81, -0.22),
    new THREE.Vector3(-0.52, 1.08, -0.24),
    new THREE.Vector3(-0.38, 1.24, -0.14),
    new THREE.Vector3(-0.28, 1.18, -0.08),
  ]);
  const lampNeck = new THREE.Mesh(track(new THREE.TubeGeometry(neckCurve, 16, 0.012, 8, false)), brassMat);
  lampNeck.castShadow = true;
  studyTableGroup.add(lampNeck);

  const lampShade = new THREE.Mesh(
    track(new THREE.ConeGeometry(0.11, 0.14, 16, 1, true)),
    track(new THREE.MeshStandardMaterial({ color: 0x1e3a2f, roughness: 0.4, metalness: 0.35, side: THREE.DoubleSide }))
  );
  lampShade.position.set(-0.26, 1.13, -0.07);
  lampShade.rotation.z = -0.35;
  lampShade.rotation.x = 0.25;
  studyTableGroup.add(lampShade);

  const lampBulb = new THREE.Mesh(
    track(new THREE.SphereGeometry(0.032, 12, 12)),
    track(new THREE.MeshStandardMaterial({ color: 0xffe4b5, emissive: 0xffa94d, emissiveIntensity: 3.2 }))
  );
  lampBulb.position.set(-0.25, 1.09, -0.05);
  studyTableGroup.add(lampBulb);

  // Stainless Steel Chai Mug + Notebook + Mystery Note + Calculator + Smartphone
  const chaiMug = new THREE.Mesh(track(new THREE.CylinderGeometry(0.042, 0.038, 0.095, 14)), chromeMat);
  chaiMug.position.set(0.12, 0.835, -0.18);
  chaiMug.castShadow = true;
  studyTableGroup.add(chaiMug);

  const notebook = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.24, 0.018, 0.32)),
    track(new THREE.MeshStandardMaterial({ color: 0x263959, roughness: 0.85 }))
  );
  notebook.position.set(-0.28, 0.797, 0.08);
  notebook.rotation.y = 0.14;
  studyTableGroup.add(notebook);

  const mysteryLetter = new THREE.Mesh(
    track(new THREE.PlaneGeometry(0.22, 0.28)),
    track(new THREE.MeshStandardMaterial({ map: letterTex, roughness: 0.88 }))
  );
  mysteryLetter.rotation.x = -Math.PI / 2;
  mysteryLetter.rotation.z = -0.08;
  mysteryLetter.position.set(0.02, 0.79, 0.12);
  studyTableGroup.add(mysteryLetter);

  // Scientific calculator on right desk edge
  const calcBody = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.09, 0.014, 0.15)),
    track(new THREE.MeshStandardMaterial({ color: 0x1e2430, roughness: 0.5 }))
  );
  calcBody.position.set(0.35, 0.795, -0.06);
  calcBody.rotation.y = -0.18;
  studyTableGroup.add(calcBody);

  // Vibrating Smartphone sitting beside letter
  const studyPhoneGroup = new THREE.Group();
  studyPhoneGroup.position.set(0.28, 0.796, 0.22);
  studyPhoneGroup.rotation.y = 0.25;
  const phoneChassis = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.075, 0.01, 0.145)),
    blackSteelMat
  );
  const studyPhoneScreenMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.35,
      roughness: 0.2,
    })
  );
  const phoneScreen = new THREE.Mesh(
    track(new THREE.PlaneGeometry(0.065, 0.132)),
    studyPhoneScreenMat
  );
  phoneScreen.rotation.x = -Math.PI / 2;
  phoneScreen.position.y = 0.006;
  studyPhoneGroup.add(phoneChassis, phoneScreen);
  studyTableGroup.add(studyPhoneGroup);

  // Study chair positioned cleanly for the studying roommate
  const chairGroup = new THREE.Group();
  chairGroup.position.set(-0.23, 0, 0.71);
  chairGroup.rotation.y = 0;
  const chairSeat = new THREE.Mesh(track(new THREE.BoxGeometry(0.46, 0.04, 0.46)), darkWoodMat);
  chairSeat.position.y = 0.45;
  chairSeat.castShadow = true;
  chairGroup.add(chairSeat);
  const chairBack = new THREE.Mesh(track(new THREE.BoxGeometry(0.46, 0.44, 0.035)), darkWoodMat);
  chairBack.position.set(0, 0.72, 0.21);
  chairGroup.add(chairBack);
  [
    [-0.19, -0.19],
    [0.19, -0.19],
    [-0.19, 0.19],
    [0.19, 0.19],
  ].forEach(([cx, cz]) => {
    const cLeg = new THREE.Mesh(track(new THREE.CylinderGeometry(0.014, 0.014, 0.45, 8)), blackSteelMat);
    cLeg.position.set(cx, 0.225, cz);
    chairGroup.add(cLeg);
  });
  studyTableGroup.add(chairGroup);

  registerHitTarget(hitTargets, 'study_table', studyTableGroup, [1.55, 0.9, 0.85], [-0.08, 0.95, 0]);
  objectGroups.study_table = studyTableGroup;
  root.add(studyTableGroup);

  // =====================================================
  // 2. DESK DRAWER (`desk_drawer`) - Animated + Brass Keypad
  // =====================================================
  const drawerUnitGroup = new THREE.Group();
  drawerUnitGroup.position.set(-1.68, 0, -1.75);

  const drawerCabinet = new THREE.Mesh(track(new THREE.BoxGeometry(0.56, 0.24, 0.7)), darkWoodMat);
  drawerCabinet.position.set(0, 0.62, 0);
  drawerCabinet.castShadow = true;
  drawerUnitGroup.add(drawerCabinet);

  const deskDrawerPivot = new THREE.Group();
  deskDrawerPivot.position.set(0, 0.62, 0.02);

  const drawerFront = new THREE.Mesh(track(new THREE.BoxGeometry(0.52, 0.19, 0.035)), teakWoodMat);
  drawerFront.position.set(0, 0, 0.35);
  deskDrawerPivot.add(drawerFront);

  const drawerTray = new THREE.Mesh(track(new THREE.BoxGeometry(0.46, 0.09, 0.62)), darkWoodMat);
  drawerTray.position.set(0, -0.04, 0.03);
  deskDrawerPivot.add(drawerTray);

  // Brass handle + 3-digit keypad plate
  const drawerHandle = new THREE.Mesh(track(new THREE.BoxGeometry(0.14, 0.02, 0.03)), brassMat);
  drawerHandle.position.set(0, 0.02, 0.38);
  deskDrawerPivot.add(drawerHandle);

  const keypadPlate = new THREE.Mesh(track(new THREE.BoxGeometry(0.11, 0.075, 0.02)), blackSteelMat);
  keypadPlate.position.set(0.16, 0.01, 0.372);
  deskDrawerPivot.add(keypadPlate);

  const deskDrawerLedMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.35,
      roughness: 0.3,
    })
  );
  const deskDrawerLed = new THREE.Mesh(track(new THREE.SphereGeometry(0.01, 10, 10)), deskDrawerLedMat);
  deskDrawerLed.position.set(0.16, 0.056, 0.382);
  deskDrawerPivot.add(deskDrawerLed);

  // Brass Key & Mysterious Paper nested inside drawer
  const drawerKeyMesh = new THREE.Group();
  drawerKeyMesh.position.set(-0.08, 0.015, 0.14);
  const keyRing = new THREE.Mesh(track(new THREE.TorusGeometry(0.024, 0.006, 8, 16)), brassMat);
  keyRing.rotation.x = Math.PI / 2;
  const keyShaft = new THREE.Mesh(track(new THREE.CylinderGeometry(0.005, 0.005, 0.07, 8)), brassMat);
  keyShaft.rotation.z = Math.PI / 2;
  keyShaft.position.x = 0.05;
  const keyBit = new THREE.Mesh(track(new THREE.BoxGeometry(0.016, 0.006, 0.016)), brassMat);
  keyBit.position.set(0.075, 0, 0.01);
  drawerKeyMesh.add(keyRing, keyShaft, keyBit);
  deskDrawerPivot.add(drawerKeyMesh);

  const drawerPaperMesh = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.15, 0.005, 0.2)),
    track(new THREE.MeshStandardMaterial({ color: 0xf4ecd8, roughness: 0.9 }))
  );
  drawerPaperMesh.position.set(0.09, 0.012, 0.12);
  drawerPaperMesh.rotation.y = 0.22;
  deskDrawerPivot.add(drawerPaperMesh);

  drawerUnitGroup.add(deskDrawerPivot);
  registerHitTarget(hitTargets, 'desk_drawer', drawerUnitGroup, [0.62, 0.34, 0.5], [0, 0.62, 0.28]);
  objectGroups.desk_drawer = drawerUnitGroup;
  root.add(drawerUnitGroup);

  // =====================================================
  // 3. BOOKSHELF (`bookshelf`) - 4 Books + Hidden Compartment
  // =====================================================
  const bookshelfGroup = new THREE.Group();
  bookshelfGroup.position.set(-0.45, 0, -2.42);
  addContactShadow(bookshelfGroup, contactShadowTex, 1.1, 0.58, 0, 0, 0.52);

  // Frame: left, right, back, top, bottom, and 3 middle shelves
  const shelfSideL = new THREE.Mesh(track(new THREE.BoxGeometry(0.04, 1.92, 0.36)), darkWoodMat);
  shelfSideL.position.set(-0.46, 0.96, 0);
  shelfSideL.castShadow = true;
  const shelfSideR = new THREE.Mesh(track(new THREE.BoxGeometry(0.04, 1.92, 0.36)), darkWoodMat);
  shelfSideR.position.set(0.46, 0.96, 0);
  shelfSideR.castShadow = true;
  const shelfBack = new THREE.Mesh(track(new THREE.BoxGeometry(0.92, 1.92, 0.03)), darkWoodMat);
  shelfBack.position.set(0, 0.96, -0.17);
  bookshelfGroup.add(shelfSideL, shelfSideR, shelfBack);

  [0.06, 0.56, 1.06, 1.48, 1.9].forEach((sy) => {
    const plank = new THREE.Mesh(track(new THREE.BoxGeometry(0.92, 0.035, 0.36)), teakWoodMat);
    plank.position.set(0, sy, 0);
    plank.receiveShadow = true;
    bookshelfGroup.add(plank);
  });

  // Exactly FOUR interactive books on the eye-level shelf (y = 1.48)
  const bookSpecs = [
    { label: 'C' as const, year: 2015, color: '#3f6a4e', x: -0.26, h: 0.29 },
    { label: 'A' as const, year: 2018, color: '#9f3a2f', x: -0.12, h: 0.31 },
    { label: 'D' as const, year: 2020, color: '#8a6b2e', x: 0.02, h: 0.28 },
    { label: 'B' as const, year: 2022, color: '#2d5a7b', x: 0.16, h: 0.32 },
  ];
  const bookshelfBooks = {} as Record<'A' | 'B' | 'C' | 'D', THREE.Mesh>;
  bookSpecs.forEach((b) => {
    const spineTex = track(createBookSpineTexture(b.color, b.label, b.year, maxAnisotropy));
    const bookMesh = new THREE.Mesh(
      track(new THREE.BoxGeometry(0.065, b.h, 0.22)),
      [
        track(new THREE.MeshStandardMaterial({ color: b.color, roughness: 0.72 })),
        track(new THREE.MeshStandardMaterial({ color: b.color, roughness: 0.72 })),
        track(new THREE.MeshStandardMaterial({ color: 0xe7dfd0, roughness: 0.88 })),
        track(new THREE.MeshStandardMaterial({ color: 0xe7dfd0, roughness: 0.88 })),
        track(new THREE.MeshStandardMaterial({ map: spineTex, roughness: 0.65 })),
        track(new THREE.MeshStandardMaterial({ color: b.color, roughness: 0.72 })),
      ]
    );
    bookMesh.position.set(b.x, 1.498 + b.h / 2, 0.02);
    bookMesh.castShadow = true;
    bookshelfBooks[b.label] = bookMesh;
    bookshelfGroup.add(bookMesh);
  });

  // Hidden Secret Compartment Door on middle shelf (y = 1.06 -> 1.48)
  const bookshelfDoorPivot = new THREE.Group();
  bookshelfDoorPivot.position.set(-0.43, 1.27, 0.16);
  const compDoor = new THREE.Mesh(track(new THREE.BoxGeometry(0.86, 0.38, 0.028)), teakWoodMat);
  compDoor.position.set(0.43, 0, 0);
  const keyholePlate = new THREE.Mesh(track(new THREE.CylinderGeometry(0.024, 0.024, 0.015, 16)), brassMat);
  keyholePlate.rotation.x = Math.PI / 2;
  keyholePlate.position.set(0.75, 0, 0.018);
  const bookshelfLedMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.25,
      roughness: 0.3,
    })
  );
  const bookshelfLed = new THREE.Mesh(track(new THREE.SphereGeometry(0.011, 10, 10)), bookshelfLedMat);
  bookshelfLed.position.set(0.75, 0.048, 0.02);
  bookshelfDoorPivot.add(compDoor, keyholePlate, bookshelfLed);
  bookshelfGroup.add(bookshelfDoorPivot);

  // UV Torch resting inside hidden shelf compartment
  const uvTorchInShelf = new THREE.Group();
  uvTorchInShelf.position.set(0, 1.13, 0.02);
  const torchBody = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.024, 0.022, 0.18, 12)),
    track(new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35, metalness: 0.8 }))
  );
  torchBody.rotation.z = Math.PI / 2;
  const torchHead = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.032, 0.024, 0.04, 12)),
    track(new THREE.MeshStandardMaterial({ color: 0x7e22ce, emissive: 0x9333ea, emissiveIntensity: 1.4 }))
  );
  torchHead.rotation.z = Math.PI / 2;
  torchHead.position.x = 0.1;
  uvTorchInShelf.add(torchBody, torchHead);
  bookshelfGroup.add(uvTorchInShelf);

  registerHitTarget(hitTargets, 'bookshelf', bookshelfGroup, [1.02, 1.95, 0.5], [0, 0.98, 0]);
  objectGroups.bookshelf = bookshelfGroup;
  root.add(bookshelfGroup);

  // =====================================================
  // 4. WALL CLOCK (`wall_clock`) - Real-Time Hands + 7:00 Alarm
  // =====================================================
  const clockGroup = new THREE.Group();
  clockGroup.position.set(-1.85, 2.28, -2.61);
  const clockRim = new THREE.Mesh(track(new THREE.TorusGeometry(0.24, 0.026, 12, 32)), brassMat);
  const clockFace = new THREE.Mesh(
    track(new THREE.CircleGeometry(0.23, 32)),
    track(new THREE.MeshStandardMaterial({ map: clockTex, roughness: 0.5 }))
  );
  clockFace.position.z = 0.008;

  // Fixed red alarm marker pointing squarely at 7:00
  const alarmPivot = new THREE.Group();
  alarmPivot.position.z = 0.013;
  alarmPivot.rotation.z = -(7 / 12) * Math.PI * 2;
  const alarmArm = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.009, 0.125, 0.004)),
    track(new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 }))
  );
  alarmArm.position.y = 0.055;
  alarmPivot.add(alarmArm);

  // Real-time Hour, Minute, Second Pivots
  const clockHourPivot = new THREE.Group();
  clockHourPivot.position.z = 0.016;
  const hourMesh = new THREE.Mesh(track(new THREE.BoxGeometry(0.016, 0.115, 0.005)), blackSteelMat);
  hourMesh.position.y = 0.048;
  clockHourPivot.add(hourMesh);

  const clockMinutePivot = new THREE.Group();
  clockMinutePivot.position.z = 0.019;
  const minuteMesh = new THREE.Mesh(track(new THREE.BoxGeometry(0.011, 0.155, 0.005)), blackSteelMat);
  minuteMesh.position.y = 0.068;
  clockMinutePivot.add(minuteMesh);

  const clockSecondPivot = new THREE.Group();
  clockSecondPivot.position.z = 0.022;
  const secondMesh = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.005, 0.175, 0.004)),
    track(new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0x7f1d1d, emissiveIntensity: 0.5 }))
  );
  secondMesh.position.y = 0.072;
  clockSecondPivot.add(secondMesh);

  const clockCenterPin = new THREE.Mesh(track(new THREE.CylinderGeometry(0.014, 0.014, 0.015, 12)), brassMat);
  clockCenterPin.rotation.x = Math.PI / 2;
  clockCenterPin.position.z = 0.024;

  const clockGlass = new THREE.Mesh(
    track(new THREE.CircleGeometry(0.228, 32)),
    track(
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        roughness: 0.05,
        transparent: true,
        opacity: 0.14,
      })
    )
  );
  clockGlass.position.z = 0.029;
  clockGroup.add(
    clockRim,
    clockFace,
    alarmPivot,
    clockHourPivot,
    clockMinutePivot,
    clockSecondPivot,
    clockCenterPin,
    clockGlass
  );
  registerHitTarget(hitTargets, 'wall_clock', clockGroup, [0.58, 0.58, 0.16], [0, 0, 0.04]);
  objectGroups.wall_clock = clockGroup;
  root.add(clockGroup);

  // =====================================================
  // FRAMED CLUB LOGO PLAQUES ON ROOM WALLS
  // =====================================================
  const buildLogoPlaque = (size: number) => {
    const g = new THREE.Group();
    const frame = new THREE.Mesh(
      track(new THREE.BoxGeometry(size + 0.06, size + 0.06, 0.024)),
      blackSteelMat
    );
    const face = new THREE.Mesh(
      track(new THREE.PlaneGeometry(size, size)),
      track(
        new THREE.MeshStandardMaterial({
          map: clubLogoTex,
          roughness: 0.35,
          metalness: 0.08,
        })
      )
    );
    face.position.z = 0.014;
    g.add(frame, face);
    return g;
  };

  // Large framed logo on the right wall above the hostel bed
  const wallLogoRight = buildLogoPlaque(0.76);
  wallLogoRight.position.set(2.91, 1.72, 0.72);
  wallLogoRight.rotation.y = -Math.PI / 2;
  root.add(wallLogoRight);

  // Secondary logo crest on back wall beside the clock
  const wallLogoBack = buildLogoPlaque(0.46);
  wallLogoBack.position.set(-1.18, 2.28, -2.61);
  root.add(wallLogoBack);

  // =====================================================
  // 5. WALL POSTER (`wall_poster`) - 2 Stars + Hidden UV Layer
  // =====================================================
  const posterGroup = new THREE.Group();
  posterGroup.position.set(-2.91, 1.75, -0.4);
  posterGroup.rotation.y = Math.PI / 2;

  const posterBoard = new THREE.Mesh(
    track(new THREE.PlaneGeometry(0.86, 1.14)),
    track(new THREE.MeshStandardMaterial({ map: posterTex, roughness: 0.78 }))
  );
  posterGroup.add(posterBoard);

  // Corner tape strips
  const tapeMat = track(new THREE.MeshStandardMaterial({ color: 0xd6c7a9, roughness: 0.85 }));
  [
    [-0.38, 0.52, 0.5],
    [0.38, 0.52, -0.5],
    [-0.38, -0.52, -0.5],
    [0.38, -0.52, 0.5],
  ].forEach(([tx, ty, rot]) => {
    const tape = new THREE.Mesh(track(new THREE.PlaneGeometry(0.11, 0.032)), tapeMat);
    tape.position.set(tx, ty, 0.005);
    tape.rotation.z = rot;
    posterGroup.add(tape);
  });

  // Hidden UV layer — invisible until uvTorchActive is toggled ON
  const posterUvOverlay = new THREE.Mesh(
    track(new THREE.PlaneGeometry(0.86, 1.14)),
    track(
      new THREE.MeshBasicMaterial({
        map: posterUvTex,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      })
    )
  );
  posterUvOverlay.position.z = 0.008;
  posterGroup.add(posterUvOverlay);

  registerHitTarget(hitTargets, 'wall_poster', posterGroup, [0.95, 1.24, 0.16], [0, 0, 0.05]);
  objectGroups.wall_poster = posterGroup;
  root.add(posterGroup);

  // =====================================================
  // 6. CALENDAR (`calendar`)
  // =====================================================
  const calendarGroup = new THREE.Group();
  calendarGroup.position.set(0.65, 1.72, -2.61);

  const calSheet = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.46, 0.54, 0.015)),
    track(new THREE.MeshStandardMaterial({ map: calendarTex, roughness: 0.85 }))
  );
  calendarGroup.add(calSheet);
  for (let i = -3; i <= 3; i++) {
    const ring = new THREE.Mesh(track(new THREE.TorusGeometry(0.016, 0.003, 6, 12)), chromeMat);
    ring.position.set(i * 0.055, 0.275, 0.008);
    calendarGroup.add(ring);
  }
  registerHitTarget(hitTargets, 'calendar', calendarGroup, [0.56, 0.64, 0.16], [0, 0, 0.04]);
  objectGroups.calendar = calendarGroup;
  root.add(calendarGroup);

  // =====================================================
  // 7. BACKPACK (`backpack`) - Slumped 5-part canvas bag
  // =====================================================
  const backpackGroup = new THREE.Group();
  backpackGroup.position.set(-1.35, 0, -0.95);
  backpackGroup.rotation.y = 0.45;
  addContactShadow(backpackGroup, contactShadowTex, 0.6, 0.55, 0, 0, 0.5);

  const bagCanvasMat = track(new THREE.MeshStandardMaterial({ color: 0x1e3557, roughness: 0.88, metalness: 0.02 }));
  const bagTrimMat = track(new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.78 }));

  const packBody = new THREE.Mesh(track(new THREE.BoxGeometry(0.36, 0.42, 0.2)), bagCanvasMat);
  packBody.position.set(0, 0.21, 0);
  packBody.rotation.x = -0.14;
  packBody.castShadow = true;

  const backpackPocketPivot = new THREE.Group();
  backpackPocketPivot.position.set(0, 0.04, 0.11);
  const packPocket = new THREE.Mesh(track(new THREE.BoxGeometry(0.28, 0.22, 0.08)), bagTrimMat);
  packPocket.position.set(0, 0.1, 0.01);
  packPocket.rotation.x = -0.14;
  const zipPull = new THREE.Mesh(track(new THREE.BoxGeometry(0.03, 0.015, 0.015)), brassMat);
  zipPull.position.set(0.08, 0.2, 0.055);
  backpackPocketPivot.add(packPocket, zipPull);

  const packHandle = new THREE.Mesh(track(new THREE.TorusGeometry(0.055, 0.012, 8, 16, Math.PI)), bagTrimMat);
  packHandle.position.set(0, 0.43, -0.02);
  backpackGroup.add(packBody, backpackPocketPivot, packHandle);

  registerHitTarget(hitTargets, 'backpack', backpackGroup, [0.5, 0.52, 0.45], [0, 0.24, 0.02]);
  objectGroups.backpack = backpackGroup;
  root.add(backpackGroup);

  // =====================================================
  // 8. WARDROBE (`wardrobe`) - Steel Hostel Almirah
  // =====================================================
  const wardrobeGroup = new THREE.Group();
  wardrobeGroup.position.set(2.35, 0, -2.12);
  wardrobeGroup.rotation.y = -0.18;
  addContactShadow(wardrobeGroup, contactShadowTex, 1.25, 0.75, 0, 0, 0.58);

  const almirahBody = new THREE.Mesh(track(new THREE.BoxGeometry(1.02, 1.98, 0.52)), almirahSteelMat);
  almirahBody.position.set(0, 1.02, 0);
  almirahBody.castShadow = true;
  almirahBody.receiveShadow = true;
  wardrobeGroup.add(almirahBody);

  const almirahDoorL = new THREE.Mesh(track(new THREE.BoxGeometry(0.49, 1.88, 0.03)), almirahSteelMat);
  almirahDoorL.position.set(-0.25, 1.02, 0.265);
  wardrobeGroup.add(almirahDoorL);

  const wardrobeDoorPivot = new THREE.Group();
  wardrobeDoorPivot.position.set(0.5, 1.02, 0.265);
  const almirahDoorR = new THREE.Mesh(track(new THREE.BoxGeometry(0.49, 1.88, 0.03)), almirahSteelMat);
  almirahDoorR.position.set(-0.245, 0, 0);
  const almirahHandle = new THREE.Mesh(track(new THREE.BoxGeometry(0.03, 0.14, 0.04)), chromeMat);
  almirahHandle.position.set(-0.42, 0.04, 0.025);
  wardrobeDoorPivot.add(almirahDoorR, almirahHandle);
  wardrobeGroup.add(wardrobeDoorPivot);

  registerHitTarget(hitTargets, 'wardrobe', wardrobeGroup, [1.12, 2.05, 0.65], [0, 1.02, 0.02]);
  objectGroups.wardrobe = wardrobeGroup;
  root.add(wardrobeGroup);

  // =====================================================
  // 9. HOSTEL BED (`bed`) - Iron Cot + Checked Blanket
  // =====================================================
  const bedGroup = new THREE.Group();
  bedGroup.position.set(2.05, 0, 0.85);
  addContactShadow(bedGroup, contactShadowTex, 1.45, 2.25, 0, 0, 0.55);

  const cotFrame = new THREE.Mesh(track(new THREE.BoxGeometry(1.12, 0.07, 1.98)), blackSteelMat);
  cotFrame.position.set(0, 0.36, 0);
  cotFrame.castShadow = true;
  bedGroup.add(cotFrame);

  [
    [-0.53, -0.96],
    [0.53, -0.96],
    [-0.53, 0.96],
    [0.53, 0.96],
  ].forEach(([bx, bz]) => {
    const post = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.022, 0.022, bz < 0 ? 0.92 : 0.58, 10)),
      blackSteelMat
    );
    post.position.set(bx, bz < 0 ? 0.46 : 0.29, bz);
    bedGroup.add(post);
  });

  const headboardBar = new THREE.Mesh(track(new THREE.CylinderGeometry(0.018, 0.018, 1.08, 10)), blackSteelMat);
  headboardBar.rotation.z = Math.PI / 2;
  headboardBar.position.set(0, 0.84, -0.96);
  bedGroup.add(headboardBar);

  const mattress = new THREE.Mesh(
    track(new THREE.BoxGeometry(1.04, 0.14, 1.9)),
    track(new THREE.MeshStandardMaterial({ color: 0x3b4d63, roughness: 0.92 }))
  );
  mattress.position.set(0, 0.46, 0);
  mattress.receiveShadow = true;
  bedGroup.add(mattress);

  const blanket = new THREE.Mesh(
    track(new THREE.BoxGeometry(1.06, 0.05, 1.15)),
    track(new THREE.MeshStandardMaterial({ color: 0x6c3232, roughness: 0.95 }))
  );
  blanket.position.set(0, 0.54, 0.34);
  bedGroup.add(blanket);

  const bedPillowMesh = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.58, 0.11, 0.36)),
    track(new THREE.MeshStandardMaterial({ color: 0xd6d9df, roughness: 0.9 }))
  );
  bedPillowMesh.position.set(0, 0.57, -0.68);
  bedPillowMesh.rotation.x = 0.08;
  bedGroup.add(bedPillowMesh);

  registerHitTarget(hitTargets, 'bed', bedGroup, [1.22, 0.98, 2.08], [0, 0.48, 0]);
  objectGroups.bed = bedGroup;
  root.add(bedGroup);

  // =====================================================
  // 10. HOSTEL EXIT DOOR (`exit_door`) + CORRIDOR + WARDEN
  // =====================================================
  const exitDoorGroup = new THREE.Group();
  exitDoorGroup.position.set(0.45, 0, 2.66);

  // Door frame casing
  const frameL = new THREE.Mesh(track(new THREE.BoxGeometry(0.08, 2.24, 0.18)), darkWoodMat);
  frameL.position.set(-0.5, 1.12, 0);
  const frameR = new THREE.Mesh(track(new THREE.BoxGeometry(0.08, 2.24, 0.18)), darkWoodMat);
  frameR.position.set(0.5, 1.12, 0);
  const frameTop = new THREE.Mesh(track(new THREE.BoxGeometry(1.08, 0.08, 0.18)), darkWoodMat);
  frameTop.position.set(0, 2.22, 0);
  exitDoorGroup.add(frameL, frameR, frameTop);

  // Hinged Door Pivot on left edge
  const exitDoorPivot = new THREE.Group();
  exitDoorPivot.position.set(-0.46, 0, 0);

  const doorSlab = new THREE.Mesh(track(new THREE.BoxGeometry(0.92, 2.18, 0.06)), teakWoodMat);
  doorSlab.position.set(0.46, 1.09, 0);
  doorSlab.castShadow = true;
  doorSlab.receiveShadow = true;
  exitDoorPivot.add(doorSlab);

  // Room 307 plate (visible inside & outside)
  const roomPlate = new THREE.Mesh(
    track(new THREE.PlaneGeometry(0.24, 0.12)),
    track(new THREE.MeshStandardMaterial({ map: doorPlateTex, roughness: 0.35, metalness: 0.65 }))
  );
  roomPlate.rotation.y = Math.PI;
  roomPlate.position.set(0.46, 1.66, -0.034);
  exitDoorPivot.add(roomPlate);

  const roomPlateOut = new THREE.Mesh(
    track(new THREE.PlaneGeometry(0.24, 0.12)),
    track(new THREE.MeshStandardMaterial({ map: doorPlateTex, roughness: 0.35, metalness: 0.65 }))
  );
  roomPlateOut.position.set(0.46, 1.66, 0.034);
  exitDoorPivot.add(roomPlateOut);

  // Club Logo Crest mounted on Exit Door (both interior and corridor side)
  const doorLogoMat = track(new THREE.MeshStandardMaterial({ map: clubLogoTex, roughness: 0.35 }));
  const doorLogoIn = new THREE.Mesh(track(new THREE.PlaneGeometry(0.32, 0.32)), doorLogoMat);
  doorLogoIn.rotation.y = Math.PI;
  doorLogoIn.position.set(0.46, 1.32, -0.035);
  exitDoorPivot.add(doorLogoIn);

  const doorLogoOut = new THREE.Mesh(track(new THREE.PlaneGeometry(0.32, 0.32)), doorLogoMat);
  doorLogoOut.position.set(0.46, 1.32, 0.035);
  exitDoorPivot.add(doorLogoOut);

  // Exterior cliffhanger paper note taped below the 307 plate on outside of door
  const doorNoteOut = new THREE.Mesh(
    track(new THREE.PlaneGeometry(0.18, 0.22)),
    track(new THREE.MeshStandardMaterial({ map: letterTex, roughness: 0.85 }))
  );
  doorNoteOut.position.set(0.46, 1.0, 0.036);
  doorNoteOut.rotation.z = -0.04;
  exitDoorPivot.add(doorNoteOut);

  // Directional Deadbolt Keypad Box + Status LED
  const lockBox = new THREE.Mesh(track(new THREE.BoxGeometry(0.16, 0.22, 0.04)), blackSteelMat);
  lockBox.position.set(0.76, 1.24, -0.045);
  exitDoorPivot.add(lockBox);

  const exitDoorLedMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 1.5,
      roughness: 0.25,
    })
  );
  const exitDoorLed = new THREE.Mesh(track(new THREE.SphereGeometry(0.013, 10, 10)), exitDoorLedMat);
  exitDoorLed.position.set(0.76, 1.32, -0.068);
  exitDoorPivot.add(exitDoorLed);

  // Door lever handle pivot
  const exitHandlePivot = new THREE.Group();
  exitHandlePivot.position.set(0.78, 1.02, -0.045);
  const handleBar = new THREE.Mesh(track(new THREE.BoxGeometry(0.14, 0.022, 0.03)), brassMat);
  handleBar.position.set(-0.05, 0, -0.02);
  exitHandlePivot.add(handleBar);
  exitDoorPivot.add(exitHandlePivot);

  exitDoorGroup.add(exitDoorPivot);

  // Warden shadow strip underneath door (for Failure ending)
  const wardenUnderDoorShadow = new THREE.Mesh(
    track(new THREE.PlaneGeometry(0.84, 0.36)),
    track(
      new THREE.MeshBasicMaterial({
        color: 0x020305,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      })
    )
  );
  wardenUnderDoorShadow.rotation.x = -Math.PI / 2;
  wardenUnderDoorShadow.position.set(0, 0.012, -0.2);
  exitDoorGroup.add(wardenUnderDoorShadow);

  registerHitTarget(hitTargets, 'exit_door', exitDoorGroup, [1.05, 2.25, 0.3], [0, 1.12, -0.06]);
  objectGroups.exit_door = exitDoorGroup;
  root.add(exitDoorGroup);

  // =====================================================
  // EXPANDED HOSTEL BLOCK C CORRIDOR (Intro + Victory Escape)
  // =====================================================
  const corridorGroup = new THREE.Group();
  corridorGroup.position.set(0.45, 0, 2.75);
  const corrFloor = new THREE.Mesh(track(new THREE.PlaneGeometry(2.6, 11.0)), floorMat);
  corrFloor.rotation.x = -Math.PI / 2;
  corrFloor.position.set(0, 0, 5.5);
  const corrCeil = new THREE.Mesh(track(new THREE.PlaneGeometry(2.6, 11.0)), ceilingMat);
  corrCeil.rotation.x = Math.PI / 2;
  corrCeil.position.set(0, roomH, 5.5);
  const corrWallL = new THREE.Mesh(track(new THREE.BoxGeometry(0.12, roomH, 11.0)), wallMat);
  corrWallL.position.set(-1.24, roomH / 2, 5.5);
  const corrWallR = new THREE.Mesh(track(new THREE.BoxGeometry(0.12, roomH, 11.0)), wallMat);
  corrWallR.position.set(1.24, roomH / 2, 5.5);
  const corrEnd = new THREE.Mesh(track(new THREE.BoxGeometry(2.6, roomH, 0.12)), wallMat);
  corrEnd.position.set(0, roomH / 2, 11.0);
  corridorGroup.add(corrFloor, corrCeil, corrWallL, corrWallR, corrEnd);

  // Neighboring Hostel Doors along corridor (Rooms 306 & 308)
  const addCorridorDoor = (x: number, z: number, rotY: number) => {
    const d = new THREE.Mesh(track(new THREE.BoxGeometry(0.9, 2.15, 0.05)), darkWoodMat);
    d.position.set(x, 1.075, z);
    d.rotation.y = rotY;
    corridorGroup.add(d);
  };
  addCorridorDoor(-1.17, 2.6, Math.PI / 2);
  addCorridorDoor(1.17, 4.4, -Math.PI / 2);
  addCorridorDoor(-1.17, 6.6, Math.PI / 2);

  // Corridor ceiling tube fixtures
  [2.2, 5.4, 8.6].forEach((cz) => {
    const bar = new THREE.Mesh(
      track(new THREE.BoxGeometry(0.85, 0.04, 0.08)),
      track(
        new THREE.MeshStandardMaterial({
          color: 0xe2e8f0,
          emissive: 0x93c5fd,
          emissiveIntensity: 1.1,
        })
      )
    );
    bar.position.set(0, roomH - 0.04, cz);
    corridorGroup.add(bar);
  });

  // Approaching Warden Silhouette in Corridor
  const wardenCorridorFigure = new THREE.Group();
  wardenCorridorFigure.position.set(0, 0, 8.8);
  const wardenCoat = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.22, 0.3, 1.35, 12)),
    track(new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 }))
  );
  wardenCoat.position.y = 0.72;
  const wardenHead = new THREE.Mesh(
    track(new THREE.SphereGeometry(0.14, 14, 14)),
    track(new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 }))
  );
  wardenHead.position.y = 1.58;
  const wardenTorch = new THREE.Mesh(
    track(new THREE.SphereGeometry(0.04, 10, 10)),
    track(new THREE.MeshBasicMaterial({ color: 0xfef08a }))
  );
  wardenTorch.position.set(0.24, 1.02, -0.2);
  wardenCorridorFigure.add(wardenCoat, wardenHead, wardenTorch);
  corridorGroup.add(wardenCorridorFigure);

  const corridorTubeLight = new THREE.PointLight(0xdbeafe, 1.9, 10.5, 1.3);
  corridorTubeLight.position.set(0, 2.9, 5.2);
  corridorGroup.add(corridorTubeLight);
  root.add(corridorGroup);

  // =====================================================
  // ANIMATED HUMAN CHARACTERS
  // =====================================================
  // 1. Player Character (OWASP shirt, controllable with Arrow Keys / WASD)
  const playerRig = buildHumanCharacter({
    shirtVariant: 'owasp',
    pantsColorHex: 0x1b2436,
    skinColorHex: 0xc88d68,
    hairColorHex: 0x14161e,
    maxAnisotropy,
    contactShadowTex,
  });
  playerRig.root.position.set(-0.25, 0, 0.38);
  playerRig.root.rotation.y = Math.PI;
  root.add(playerRig.root);
  playerRig.disposables.forEach((d) => disposables.push(d));

  // 2. Roommate Character (Sitting on chair at Study Table studying)
  const roommateRig = buildHumanCharacter({
    shirtVariant: 'roommate',
    shirtColorHex: 0x7c2d36,
    pantsColorHex: 0x262e3d,
    skinColorHex: 0xb97c56,
    hairColorHex: 0x11131a,
    maxAnisotropy,
    contactShadowTex,
  });
  roommateRig.penHeld.visible = true;
  roommateRig.root.position.set(-2.28, 0, -1.04);
  roommateRig.root.rotation.y = Math.PI; // Faces -Z directly into study table & notebook
  root.add(roommateRig.root);
  roommateRig.disposables.forEach((d) => disposables.push(d));

  // =====================================================
  // STUDIO PBR WARM / COOL LIGHTING RIG
  // =====================================================
  const hemiFill = new THREE.HemisphereLight(0x5274b8, 0x261d17, 0.72);
  root.add(hemiFill);

  // Cool moonlight streaming through barred window
  const moonDirLight = new THREE.DirectionalLight(0x7aa2f7, 1.45);
  moonDirLight.position.set(2.2, 2.7, -4.4);
  moonDirLight.target.position.set(-0.4, 0.3, 0.2);
  if (!isSoftwareGl) {
    moonDirLight.castShadow = true;
    moonDirLight.shadow.mapSize.set(1024, 1024);
    moonDirLight.shadow.camera.near = 0.5;
    moonDirLight.shadow.camera.far = 12;
    moonDirLight.shadow.camera.left = -4;
    moonDirLight.shadow.camera.right = 4;
    moonDirLight.shadow.camera.top = 4;
    moonDirLight.shadow.camera.bottom = -4;
    moonDirLight.shadow.bias = -0.0005;
    moonDirLight.shadow.normalBias = 0.02;
  }
  root.add(moonDirLight, moonDirLight.target);

  // Warm tungsten desk lamp point light
  const deskLampLight = new THREE.PointLight(0xffad5c, 2.6, 6.2, 1.35);
  deskLampLight.position.set(-2.22, 1.15, -1.78);
  if (!isSoftwareGl) {
    deskLampLight.castShadow = true;
    deskLampLight.shadow.mapSize.set(1024, 1024);
    deskLampLight.shadow.bias = -0.001;
  }
  root.add(deskLampLight);

  // Soft ceiling fill so back corners & books stay readable
  const roomFillLight = new THREE.PointLight(0x8aa4d6, 1.05, 8.5, 1.1);
  roomFillLight.position.set(0.2, 2.85, 0.2);
  root.add(roomFillLight);

  // Dedicated UV Spotlight pointing at Wall Poster (intensity = 0 unless UV torch active!)
  const uvSpotLight = new THREE.SpotLight(0xa855f7, 0, 4.5, Math.PI / 5, 0.55, 1.2);
  uvSpotLight.position.set(-1.35, 1.8, -0.4);
  uvSpotLight.target.position.set(-2.9, 1.75, -0.4);
  root.add(uvSpotLight, uvSpotLight.target);

  // Hover focus floor ring highlight
  const hoverRingMesh = new THREE.Mesh(
    track(new THREE.RingGeometry(0.36, 0.43, 32)),
    track(
      new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    )
  );
  hoverRingMesh.rotation.x = -Math.PI / 2;
  hoverRingMesh.position.set(0, 0.022, 0);
  root.add(hoverRingMesh);

  return {
    root,
    hitTargets,
    objectGroups,
    ceilingFanPivot,
    clockHourPivot,
    clockMinutePivot,
    clockSecondPivot,
    deskDrawerPivot,
    deskDrawerLedMat,
    drawerKeyMesh,
    drawerPaperMesh,
    bookshelfDoorPivot,
    bookshelfLedMat,
    bookshelfBooks,
    uvTorchInShelf,
    exitDoorPivot,
    exitDoorLedMat,
    exitHandlePivot,
    wardrobeDoorPivot,
    backpackPocketPivot,
    bedPillowMesh,
    posterUvOverlay,
    uvSpotLight,
    deskLampLight,
    roomFillLight,
    tubeGlassMat,
    corridorTubeLight,
    wardenUnderDoorShadow,
    wardenCorridorFigure,
    curtainLeftPivot,
    curtainRightPivot,
    rainMesh,
    rainSeeds,
    lightningLight,
    nightBackdropMat,
    studyPhoneGroup,
    studyPhoneScreenMat,
    hoverRingMesh,
    playerRig,
    roommateRig,
    disposables,
  };
}
