import * as THREE from 'three';

export type RadioObjectId =
  | 'transmitter_rack'
  | 'circuit_board'
  | 'oscilloscope'
  | 'frequency_dial'
  | 'audio_recorder'
  | 'headphones'
  | 'wiring_diagram'
  | 'filing_cabinet'
  | 'emergency_light'
  | 'transmission_door';

export interface Scene3DObjectPreset {
  id: string;
  name: string;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  hotspotAnchor: [number, number, number];
}

export interface RadioStationHandles {
  hitTargets: THREE.Object3D[];
  disposables: Array<{ dispose: () => void }>;
  reelLeft: THREE.Object3D;
  reelRight: THREE.Object3D;
  beaconPivot: THREE.Object3D;
  beaconLight: THREE.PointLight;
  tubeLight: THREE.PointLight;
  tubeMat: THREE.MeshStandardMaterial;
  oscilloscopeMat: THREE.MeshStandardMaterial;
  circuitLedMat: THREE.MeshStandardMaterial;
  dialNeedle: THREE.Object3D;
  exitDoorPivot: THREE.Object3D;
  exitHandlePivot: THREE.Object3D;
  doorLedMat: THREE.MeshStandardMaterial;
  stairShadowPlaneMat: THREE.MeshBasicMaterial;
  hoverRing: THREE.Mesh;
}

function makeCanvasTex(
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D) => void
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  draw(ctx);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function buildRadioStationRoom(
  scene: THREE.Scene,
  isSoftwareGl: boolean
): RadioStationHandles {
  const disposables: Array<{ dispose: () => void }> = [];
  const hitTargets: THREE.Object3D[] = [];

  const track = <T extends { dispose: () => void }>(d: T): T => {
    disposables.push(d);
    return d;
  };

  const addHitbox = (
    id: RadioObjectId,
    w: number,
    h: number,
    d: number,
    pos: [number, number, number]
  ) => {
    const geom = track(new THREE.BoxGeometry(w, h, d));
    const mat = track(new THREE.MeshBasicMaterial({ visible: false }));
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(...pos);
    mesh.layers.set(1);
    mesh.userData.objectId = id;
    scene.add(mesh);
    hitTargets.push(mesh);
  };

  // Floor (damp concrete bunker slab)
  const floorTex = track(
    makeCanvasTex(512, 512, (ctx) => {
      ctx.fillStyle = '#1e2530';
      ctx.fillRect(0, 0, 512, 512);
      ctx.strokeStyle = 'rgba(10,14,20,0.65)';
      ctx.lineWidth = 4;
      for (let i = 0; i <= 4; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 128, 0);
        ctx.lineTo(i * 128, 512);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * 128);
        ctx.lineTo(512, i * 128);
        ctx.stroke();
      }
      for (let i = 0; i < 600; i++) {
        ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.06)';
        ctx.fillRect((i * 89) % 512, (i * 173) % 512, 8, 8);
      }
    })
  );
  floorTex.wrapS = THREE.RepeatWrapping;
  floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.repeat.set(3, 3);

  const floorMat = track(
    new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.85, metalness: 0.08 })
  );
  const floor = new THREE.Mesh(track(new THREE.PlaneGeometry(6.6, 6.2)), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = !isSoftwareGl;
  scene.add(floor);

  // Basement brick/concrete walls
  const wallTex = track(
    makeCanvasTex(512, 512, (ctx) => {
      ctx.fillStyle = '#252e3a';
      ctx.fillRect(0, 0, 512, 512);
      ctx.strokeStyle = 'rgba(12,16,22,0.55)';
      ctx.lineWidth = 3;
      for (let y = 0; y < 512; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(512, y);
        ctx.stroke();
        const offset = (y / 32) % 2 === 0 ? 0 : 48;
        for (let x = offset; x < 512; x += 96) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + 32);
          ctx.stroke();
        }
      }
    })
  );
  wallTex.wrapS = THREE.RepeatWrapping;
  wallTex.wrapT = THREE.RepeatWrapping;
  wallTex.repeat.set(2, 1);

  const wallMat = track(
    new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.9, metalness: 0.04 })
  );
  const ceilingMat = track(new THREE.MeshStandardMaterial({ color: '#131922', roughness: 0.95 }));

  const backWall = new THREE.Mesh(track(new THREE.PlaneGeometry(6.6, 3.3)), wallMat);
  backWall.position.set(0, 1.65, -2.7);
  scene.add(backWall);

  const leftWall = new THREE.Mesh(track(new THREE.PlaneGeometry(6.2, 3.3)), wallMat);
  leftWall.position.set(-3.1, 1.65, 0.2);
  leftWall.rotation.y = Math.PI / 2;
  scene.add(leftWall);

  const rightWall = new THREE.Mesh(track(new THREE.PlaneGeometry(6.2, 3.3)), wallMat);
  rightWall.position.set(3.1, 1.65, 0.2);
  rightWall.rotation.y = -Math.PI / 2;
  scene.add(rightWall);

  // Front wall with doorway opening on the right-center (x = 0.55)
  const frontLeft = new THREE.Mesh(track(new THREE.PlaneGeometry(3.15, 3.3)), wallMat);
  frontLeft.position.set(-1.52, 1.65, 2.85);
  frontLeft.rotation.y = Math.PI;
  scene.add(frontLeft);

  const frontRight = new THREE.Mesh(track(new THREE.PlaneGeometry(2.05, 3.3)), wallMat);
  frontRight.position.set(2.08, 1.65, 2.85);
  frontRight.rotation.y = Math.PI;
  scene.add(frontRight);

  const frontHeader = new THREE.Mesh(track(new THREE.PlaneGeometry(1.1, 1.0)), wallMat);
  frontHeader.position.set(0.55, 2.8, 2.85);
  frontHeader.rotation.y = Math.PI;
  scene.add(frontHeader);

  const ceiling = new THREE.Mesh(track(new THREE.PlaneGeometry(6.6, 6.2)), ceilingMat);
  ceiling.position.set(0, 3.3, 0.2);
  ceiling.rotation.x = Math.PI / 2;
  scene.add(ceiling);

  // Dark concrete exterior stairwell corridor beyond exit door
  const stairFloor = new THREE.Mesh(
    track(new THREE.PlaneGeometry(2.6, 4.5)),
    track(new THREE.MeshStandardMaterial({ color: '#10151d', roughness: 0.9 }))
  );
  stairFloor.rotation.x = -Math.PI / 2;
  stairFloor.position.set(0.55, 0.01, 5.1);
  scene.add(stairFloor);

  // Overhead industrial steel pipes
  const pipeMat = track(
    new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.45, metalness: 0.72 })
  );
  [-1.9, 1.7].forEach((px) => {
    const pipe = new THREE.Mesh(track(new THREE.CylinderGeometry(0.06, 0.06, 5.4, 10)), pipeMat);
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(px, 3.08, 0.1);
    scene.add(pipe);
  });

  // Main industrial console desk (back-left)
  const metalDeskMat = track(
    new THREE.MeshStandardMaterial({ color: '#2b3441', roughness: 0.55, metalness: 0.45 })
  );
  const consoleTop = new THREE.Mesh(track(new THREE.BoxGeometry(3.4, 0.08, 1.1)), metalDeskMat);
  consoleTop.position.set(-0.6, 0.88, -2.05);
  scene.add(consoleTop);

  [-2.15, 0.95].forEach((lx) => {
    [-2.48, -1.62].forEach((lz) => {
      const leg = new THREE.Mesh(track(new THREE.BoxGeometry(0.08, 0.88, 0.08)), metalDeskMat);
      leg.position.set(lx, 0.44, lz);
      scene.add(leg);
    });
  });

  // 1. Transmitter Rack (tall left rack with VU needles)
  const rackMat = track(
    new THREE.MeshStandardMaterial({ color: '#19202a', roughness: 0.5, metalness: 0.6 })
  );
  const rack = new THREE.Mesh(track(new THREE.BoxGeometry(0.82, 1.78, 0.62)), rackMat);
  rack.position.set(-2.45, 0.89, -2.18);
  scene.add(rack);
  const vuTex = track(
    makeCanvasTex(256, 128, (ctx) => {
      ctx.fillStyle = '#0c1622';
      ctx.fillRect(0, 0, 256, 128);
      ctx.fillStyle = '#bae6fd';
      ctx.font = 'bold 20px monospace';
      ctx.fillText('TX-1998 CARRIER', 24, 34);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 50, 216, 52);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(32, 68, 120, 14);
    })
  );
  const vuFace = new THREE.Mesh(
    track(new THREE.PlaneGeometry(0.68, 0.34)),
    track(new THREE.MeshBasicMaterial({ map: vuTex }))
  );
  vuFace.position.set(-2.45, 1.42, -1.86);
  scene.add(vuFace);
  addHitbox('transmitter_rack', 0.95, 1.85, 0.85, [-2.45, 0.95, -2.15]);

  // 2. Circuit Board Panel (mounted on left wall beside transmitter)
  const cbMat = track(new THREE.MeshStandardMaterial({ color: '#14532d', roughness: 0.65 }));
  const circuitPanel = new THREE.Mesh(track(new THREE.BoxGeometry(0.12, 0.86, 1.05)), cbMat);
  circuitPanel.position.set(-3.02, 1.55, -1.15);
  scene.add(circuitPanel);
  const circuitLedMat = track(
    new THREE.MeshStandardMaterial({
      color: '#ef4444',
      emissive: '#ef4444',
      emissiveIntensity: 1.4,
    })
  );
  const circuitLed = new THREE.Mesh(track(new THREE.SphereGeometry(0.038, 10, 10)), circuitLedMat);
  circuitLed.position.set(-2.94, 1.85, -1.15);
  scene.add(circuitLed);
  addHitbox('circuit_board', 0.45, 1.0, 1.15, [-2.95, 1.55, -1.15]);

  // 3. Oscilloscope (on console left)
  const scopeBox = new THREE.Mesh(track(new THREE.BoxGeometry(0.55, 0.46, 0.48)), metalDeskMat);
  scopeBox.position.set(-1.55, 1.15, -2.08);
  scene.add(scopeBox);
  const scopeTex = track(
    makeCanvasTex(256, 192, (ctx) => {
      ctx.fillStyle = '#041f14';
      ctx.fillRect(0, 0, 256, 192);
      ctx.strokeStyle = 'rgba(16,185,129,0.22)';
      ctx.lineWidth = 1.5;
      for (let x = 0; x <= 256; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 192);
        ctx.stroke();
      }
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (let x = 0; x <= 256; x += 4) {
        const y = 96 + Math.sin(x * 0.1) * 42;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    })
  );
  const oscilloscopeMat = track(
    new THREE.MeshStandardMaterial({
      map: scopeTex,
      emissiveMap: scopeTex,
      emissive: '#10b981',
      emissiveIntensity: 0.75,
    })
  );
  const scopeScreen = new THREE.Mesh(track(new THREE.PlaneGeometry(0.38, 0.28)), oscilloscopeMat);
  scopeScreen.position.set(-1.55, 1.18, -1.83);
  scene.add(scopeScreen);
  addHitbox('oscilloscope', 0.65, 0.56, 0.62, [-1.55, 1.15, -2.05]);

  // 4. Analog Frequency Dial Console (center console)
  const tunerBody = new THREE.Mesh(track(new THREE.BoxGeometry(0.84, 0.34, 0.48)), rackMat);
  tunerBody.position.set(-0.62, 1.09, -2.02);
  scene.add(tunerBody);
  const dialFaceTex = track(
    makeCanvasTex(384, 128, (ctx) => {
      ctx.fillStyle = '#0c1322';
      ctx.fillRect(0, 0, 384, 128);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, 364, 108);
      ctx.fillStyle = '#e0f2fe';
      ctx.font = 'bold 20px monospace';
      ctx.fillText('88   92   96  100  104 MHz', 22, 58);
      for (let x = 28; x <= 356; x += 14) {
        ctx.fillRect(x, 78, 2, x % 28 === 0 ? 18 : 10);
      }
    })
  );
  const dialFace = new THREE.Mesh(
    track(new THREE.PlaneGeometry(0.68, 0.22)),
    track(new THREE.MeshBasicMaterial({ map: dialFaceTex }))
  );
  dialFace.position.set(-0.62, 1.12, -1.775);
  scene.add(dialFace);
  const dialNeedle = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.018, 0.19, 0.015)),
    track(new THREE.MeshBasicMaterial({ color: '#f97316' }))
  );
  dialNeedle.position.set(-0.85, 1.12, -1.765);
  scene.add(dialNeedle);
  addHitbox('frequency_dial', 0.92, 0.45, 0.6, [-0.62, 1.1, -2.0]);

  // 5. Reel-to-Reel Audio Recorder (console right)
  const deckBody = new THREE.Mesh(track(new THREE.BoxGeometry(0.66, 0.14, 0.46)), rackMat);
  deckBody.position.set(0.38, 0.99, -2.04);
  scene.add(deckBody);
  const reelMat = track(new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.75, roughness: 0.3 }));
  const reelLeft = new THREE.Mesh(track(new THREE.CylinderGeometry(0.11, 0.11, 0.03, 18)), reelMat);
  reelLeft.position.set(0.22, 1.075, -2.04);
  scene.add(reelLeft);
  const reelRight = new THREE.Mesh(track(new THREE.CylinderGeometry(0.11, 0.11, 0.03, 18)), reelMat);
  reelRight.position.set(0.54, 1.075, -2.04);
  scene.add(reelRight);
  addHitbox('audio_recorder', 0.74, 0.35, 0.56, [0.38, 1.05, -2.04]);

  // 6. Studio Headphones resting on desk front-right
  const hpMat = track(new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.5 }));
  const hpBand = new THREE.Mesh(
    track(new THREE.TorusGeometry(0.11, 0.018, 8, 20, Math.PI)),
    hpMat
  );
  hpBand.position.set(0.52, 0.99, -1.68);
  hpBand.rotation.x = Math.PI / 2;
  scene.add(hpBand);
  addHitbox('headphones', 0.4, 0.32, 0.38, [0.52, 0.99, -1.68]);

  // 7. Wiring Diagram pinned on Back Wall above frequency console
  const diagramTex = track(
    makeCanvasTex(512, 384, (ctx) => {
      ctx.fillStyle = '#0c2340';
      ctx.fillRect(0, 0, 512, 384);
      ctx.strokeStyle = 'rgba(186,230,253,0.45)';
      ctx.lineWidth = 4;
      ctx.strokeRect(16, 16, 480, 352);
      ctx.fillStyle = '#e0f2fe';
      ctx.font = 'bold 22px monospace';
      ctx.fillText('BASEMENT TX RELAY SCHEMATIC', 52, 58);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 5;
      ctx.strokeRect(54, 110, 110, 62);
      ctx.strokeRect(202, 110, 110, 62);
      ctx.strokeRect(350, 110, 110, 62);
      ctx.beginPath();
      ctx.moveTo(164, 141);
      ctx.lineTo(202, 141);
      ctx.moveTo(312, 141);
      ctx.lineTo(350, 141);
      ctx.stroke();
      ctx.font = 'bold 16px monospace';
      ctx.fillText('PWR-A -> COIL-B -> TX', 110, 270);
    })
  );
  const wiringBoard = new THREE.Mesh(
    track(new THREE.PlaneGeometry(1.15, 0.85)),
    track(new THREE.MeshBasicMaterial({ map: diagramTex }))
  );
  wiringBoard.position.set(-0.55, 1.92, -2.66);
  scene.add(wiringBoard);
  addHitbox('wiring_diagram', 1.25, 0.95, 0.3, [-0.55, 1.92, -2.55]);

  // 8. Steel Filing Cabinet (back-right)
  const cabMat = track(
    new THREE.MeshStandardMaterial({ color: '#374151', roughness: 0.65, metalness: 0.4 })
  );
  const cabinet = new THREE.Mesh(track(new THREE.BoxGeometry(0.75, 1.48, 0.62)), cabMat);
  cabinet.position.set(2.25, 0.74, -2.18);
  scene.add(cabinet);
  addHitbox('filing_cabinet', 0.9, 1.6, 0.75, [2.25, 0.8, -2.15]);

  // 9. Emergency Bulkhead Light & Breaker (right wall)
  const beaconHousing = new THREE.Mesh(track(new THREE.BoxGeometry(0.16, 0.42, 0.32)), rackMat);
  beaconHousing.position.set(3.01, 2.05, 0.35);
  scene.add(beaconHousing);
  const beaconPivot = new THREE.Group();
  beaconPivot.position.set(2.88, 2.05, 0.35);
  const beaconBulb = new THREE.Mesh(
    track(new THREE.SphereGeometry(0.08, 12, 12)),
    track(
      new THREE.MeshStandardMaterial({
        color: '#ef4444',
        emissive: '#ef4444',
        emissiveIntensity: 1.5,
      })
    )
  );
  beaconPivot.add(beaconBulb);
  scene.add(beaconPivot);
  addHitbox('emergency_light', 0.48, 0.7, 0.6, [2.9, 2.0, 0.35]);

  // 10. Steel Bulkhead Exit Door (front wall x = 0.55, z = 2.85)
  const exitDoorPivot = new THREE.Group();
  exitDoorPivot.position.set(0.04, 0, 2.85);
  const doorMat = track(
    new THREE.MeshStandardMaterial({ color: '#263242', roughness: 0.48, metalness: 0.68 })
  );
  const doorLeaf = new THREE.Mesh(track(new THREE.BoxGeometry(1.02, 2.26, 0.08)), doorMat);
  doorLeaf.position.set(0.51, 1.13, 0);
  exitDoorPivot.add(doorLeaf);

  const exitHandlePivot = new THREE.Group();
  exitHandlePivot.position.set(0.88, 1.05, -0.06);
  const handleBar = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.16, 0.035, 0.06)),
    track(new THREE.MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.85, roughness: 0.25 }))
  );
  handleBar.position.set(-0.06, 0, -0.02);
  exitHandlePivot.add(handleBar);
  exitDoorPivot.add(exitHandlePivot);

  const doorLedMat = track(
    new THREE.MeshStandardMaterial({
      color: '#ef4444',
      emissive: '#ef4444',
      emissiveIntensity: 1.4,
    })
  );
  const doorLed = new THREE.Mesh(track(new THREE.SphereGeometry(0.035, 10, 10)), doorLedMat);
  doorLed.position.set(0.9, 1.32, -0.06);
  exitDoorPivot.add(doorLed);
  scene.add(exitDoorPivot);
  addHitbox('transmission_door', 1.15, 2.3, 0.45, [0.55, 1.18, 2.75]);

  // Shadow under steel door threshold
  const stairShadowPlaneMat = track(
    new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0 })
  );
  const shadowStrip = new THREE.Mesh(
    track(new THREE.PlaneGeometry(1.2, 0.35)),
    stairShadowPlaneMat
  );
  shadowStrip.rotation.x = -Math.PI / 2;
  shadowStrip.position.set(0.55, 0.015, 2.65);
  scene.add(shadowStrip);

  // Hover Floor Ring
  const hoverRing = new THREE.Mesh(
    track(new THREE.RingGeometry(0.26, 0.34, 28)),
    track(
      new THREE.MeshBasicMaterial({
        color: '#38bdf8',
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
      })
    )
  );
  hoverRing.rotation.x = -Math.PI / 2;
  hoverRing.position.y = 0.02;
  scene.add(hoverRing);

  // Overhead industrial fluorescent fixture
  const tubeMat = track(
    new THREE.MeshStandardMaterial({
      color: '#e0f2fe',
      emissive: '#7dd3fc',
      emissiveIntensity: 0.85,
    })
  );
  const tubeBar = new THREE.Mesh(track(new THREE.BoxGeometry(1.75, 0.05, 0.14)), tubeMat);
  tubeBar.position.set(0, 3.22, -0.45);
  scene.add(tubeBar);

  // Lighting
  const ambientLight = new THREE.AmbientLight('#8fb3d9', 0.42);
  scene.add(ambientLight);

  const tubeLight = new THREE.PointLight('#bae6fd', 2.4, 12, 1.4);
  tubeLight.position.set(0, 2.95, -0.45);
  scene.add(tubeLight);

  const deskSpot = new THREE.PointLight('#38bdf8', 1.6, 6, 1.5);
  deskSpot.position.set(-0.6, 1.8, -1.6);
  scene.add(deskSpot);

  const beaconLight = new THREE.PointLight('#ef4444', 1.25, 8, 1.5);
  beaconLight.position.set(2.55, 2.05, 0.35);
  scene.add(beaconLight);

  return {
    hitTargets,
    disposables,
    reelLeft,
    reelRight,
    beaconPivot,
    beaconLight,
    tubeLight,
    tubeMat,
    oscilloscopeMat,
    circuitLedMat,
    dialNeedle,
    exitDoorPivot,
    exitHandlePivot,
    doorLedMat,
    stairShadowPlaneMat,
    hoverRing,
  };
}
