import * as THREE from 'three';

export type ArchiveObjectId =
  | 'archive_shelves'
  | 'document_cabinets'
  | 'old_photographs'
  | 'historical_documents'
  | 'investigation_desk'
  | 'cipher_wheel'
  | 'mechanical_vault'
  | 'architectural_plans'
  | 'witness_records'
  | 'hidden_compartments';

export interface ArchiveRoomHandles {
  hitTargets: THREE.Object3D[];
  disposables: Array<{ dispose: () => void }>;
  dustMotes: THREE.Points;
  bankerLight: THREE.PointLight;
  vaultLight: THREE.PointLight;
  alcoveDoorPivot: THREE.Object3D;
  cipherDiscMesh: THREE.Object3D;
  vaultWheelPivot: THREE.Object3D;
  vaultDoorPivot: THREE.Object3D;
  vaultStatusLedMat: THREE.MeshStandardMaterial;
  grateShadowMat: THREE.MeshBasicMaterial;
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

export function buildUndergroundArchiveRoom(
  scene: THREE.Scene,
  isSoftwareGl: boolean
): ArchiveRoomHandles {
  const disposables: Array<{ dispose: () => void }> = [];
  const hitTargets: THREE.Object3D[] = [];

  const track = <T extends { dispose: () => void }>(d: T): T => {
    disposables.push(d);
    return d;
  };

  const addHitbox = (
    id: ArchiveObjectId,
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

  // Aged stone floor
  const floorTex = track(
    makeCanvasTex(512, 512, (ctx) => {
      ctx.fillStyle = '#1b1815';
      ctx.fillRect(0, 0, 512, 512);
      ctx.strokeStyle = 'rgba(8,6,5,0.7)';
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
      for (let i = 0; i < 480; i++) {
        ctx.fillStyle = i % 2 === 0 ? 'rgba(217,178,120,0.03)' : 'rgba(0,0,0,0.08)';
        ctx.fillRect((i * 131) % 512, (i * 211) % 512, 10, 7);
      }
    })
  );
  floorTex.wrapS = THREE.RepeatWrapping;
  floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.repeat.set(3, 3);

  const floor = new THREE.Mesh(
    track(new THREE.PlaneGeometry(6.8, 6.4)),
    track(new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.9, metalness: 0.05 }))
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = !isSoftwareGl;
  scene.add(floor);

  // Masonry stone archival walls
  const stoneTex = track(
    makeCanvasTex(512, 512, (ctx) => {
      ctx.fillStyle = '#241e19';
      ctx.fillRect(0, 0, 512, 512);
      ctx.strokeStyle = 'rgba(10,8,6,0.65)';
      ctx.lineWidth = 3;
      for (let y = 0; y < 512; y += 42) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(512, y);
        ctx.stroke();
        const off = (y / 42) % 2 === 0 ? 0 : 64;
        for (let x = off; x < 512; x += 128) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + 42);
          ctx.stroke();
        }
      }
    })
  );
  stoneTex.wrapS = THREE.RepeatWrapping;
  stoneTex.wrapT = THREE.RepeatWrapping;
  stoneTex.repeat.set(2, 1);

  const wallMat = track(
    new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.92, metalness: 0.04 })
  );

  const backWall = new THREE.Mesh(track(new THREE.PlaneGeometry(6.8, 3.4)), wallMat);
  backWall.position.set(0, 1.7, -2.75);
  scene.add(backWall);

  const leftWall = new THREE.Mesh(track(new THREE.PlaneGeometry(6.4, 3.4)), wallMat);
  leftWall.position.set(-3.15, 1.7, 0.25);
  leftWall.rotation.y = Math.PI / 2;
  scene.add(leftWall);

  const rightWall = new THREE.Mesh(track(new THREE.PlaneGeometry(6.4, 3.4)), wallMat);
  rightWall.position.set(3.15, 1.7, 0.25);
  rightWall.rotation.y = -Math.PI / 2;
  scene.add(rightWall);

  // Front wall framing circular vault portal
  const frontLeft = new THREE.Mesh(track(new THREE.PlaneGeometry(2.8, 3.4)), wallMat);
  frontLeft.position.set(-1.75, 1.7, 2.9);
  frontLeft.rotation.y = Math.PI;
  scene.add(frontLeft);

  const frontRight = new THREE.Mesh(track(new THREE.PlaneGeometry(2.2, 3.4)), wallMat);
  frontRight.position.set(2.05, 1.7, 2.9);
  frontRight.rotation.y = Math.PI;
  scene.add(frontRight);

  const frontTop = new THREE.Mesh(track(new THREE.PlaneGeometry(1.6, 0.95)), wallMat);
  frontTop.position.set(0.3, 2.92, 2.9);
  frontTop.rotation.y = Math.PI;
  scene.add(frontTop);

  const ceiling = new THREE.Mesh(
    track(new THREE.PlaneGeometry(6.8, 6.4)),
    track(new THREE.MeshStandardMaterial({ color: '#14110e', roughness: 0.95 }))
  );
  ceiling.position.set(0, 3.4, 0.25);
  ceiling.rotation.x = Math.PI / 2;
  scene.add(ceiling);

  // Warm oak & antique brass materials
  const oakMat = track(
    new THREE.MeshStandardMaterial({ color: '#3b2517', roughness: 0.72, metalness: 0.08 })
  );
  const brassMat = track(
    new THREE.MeshStandardMaterial({ color: '#c49a45', roughness: 0.35, metalness: 0.82 })
  );
  const ironMat = track(
    new THREE.MeshStandardMaterial({ color: '#27292e', roughness: 0.52, metalness: 0.74 })
  );

  // 1. Archive Shelves (back-left tall oak bookcase)
  const shelfFrame = new THREE.Mesh(track(new THREE.BoxGeometry(1.35, 2.25, 0.45)), oakMat);
  shelfFrame.position.set(-2.05, 1.12, -2.42);
  scene.add(shelfFrame);
  const spineColors = ['#7f1d1d', '#1e3a8a', '#14532d', '#78350f', '#581c87'];
  for (let i = 0; i < 6; i++) {
    const ledger = new THREE.Mesh(
      track(new THREE.BoxGeometry(0.11, 0.36, 0.32)),
      track(new THREE.MeshStandardMaterial({ color: spineColors[i % spineColors.length], roughness: 0.75 }))
    );
    ledger.position.set(-2.42 + i * 0.14, 1.48, -2.28);
    scene.add(ledger);
  }
  addHitbox('archive_shelves', 1.45, 2.3, 0.65, [-2.05, 1.15, -2.35]);

  // 2. Locked Document Cabinets (back-right)
  const cabBody = new THREE.Mesh(track(new THREE.BoxGeometry(1.2, 1.38, 0.56)), ironMat);
  cabBody.position.set(2.05, 0.69, -2.35);
  scene.add(cabBody);
  for (let r = 0; r < 3; r++) {
    const plate = new THREE.Mesh(track(new THREE.BoxGeometry(0.24, 0.06, 0.02)), brassMat);
    plate.position.set(2.05, 0.38 + r * 0.36, -2.06);
    scene.add(plate);
  }
  addHitbox('document_cabinets', 1.32, 1.48, 0.7, [2.05, 0.72, -2.3]);

  // 3. Old Photographs Collage (left wall)
  const photoTex = track(
    makeCanvasTex(512, 384, (ctx) => {
      ctx.fillStyle = '#2d231a';
      ctx.fillRect(0, 0, 512, 384);
      ctx.strokeStyle = '#c49a45';
      ctx.lineWidth = 6;
      ctx.strokeRect(14, 14, 484, 356);
      ['1994 WING FOUNDATION', 'WARDEN LOG · ARCHIVE'].forEach((label, idx) => {
        ctx.fillStyle = '#e7dec8';
        ctx.fillRect(42 + idx * 230, 56, 190, 220);
        ctx.fillStyle = '#6c5a43';
        ctx.fillRect(58 + idx * 230, 74, 158, 130);
        ctx.fillStyle = '#1c1917';
        ctx.font = 'bold 13px monospace';
        ctx.fillText(label, 54 + idx * 230, 240);
      });
    })
  );
  const photoFrame = new THREE.Mesh(
    track(new THREE.PlaneGeometry(1.2, 0.9)),
    track(new THREE.MeshBasicMaterial({ map: photoTex }))
  );
  photoFrame.position.set(-3.1, 1.72, -0.55);
  photoFrame.rotation.y = Math.PI / 2;
  scene.add(photoFrame);
  addHitbox('old_photographs', 0.35, 1.0, 1.3, [-3.0, 1.72, -0.55]);

  // 4. Central Mahogany Investigation Desk + Green Banker Lamp
  const deskTop = new THREE.Mesh(track(new THREE.BoxGeometry(1.85, 0.09, 1.05)), oakMat);
  deskTop.position.set(-0.2, 0.84, -0.35);
  scene.add(deskTop);
  [-1.02, 0.62].forEach((lx) => {
    [-0.78, 0.08].forEach((lz) => {
      const leg = new THREE.Mesh(track(new THREE.BoxGeometry(0.08, 0.84, 0.08)), oakMat);
      leg.position.set(lx, 0.42, lz);
      scene.add(leg);
    });
  });
  // Green banker lamp on desk
  const lampPost = new THREE.Mesh(track(new THREE.CylinderGeometry(0.025, 0.05, 0.38, 12)), brassMat);
  lampPost.position.set(-0.8, 1.05, -0.62);
  scene.add(lampPost);
  const shade = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.28, 0.1, 0.16)),
    track(new THREE.MeshStandardMaterial({ color: '#15803d', emissive: '#166534', emissiveIntensity: 0.45 }))
  );
  shade.position.set(-0.8, 1.24, -0.55);
  scene.add(shade);
  addHitbox('investigation_desk', 1.95, 0.95, 1.15, [-0.2, 0.72, -0.35]);

  // 5. Historical Documents Dossier (on desk left-center)
  const docStack = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.38, 0.04, 0.48)),
    track(new THREE.MeshStandardMaterial({ color: '#eadfcb', roughness: 0.85 }))
  );
  docStack.position.set(-0.48, 0.9, -0.25);
  scene.add(docStack);
  addHitbox('historical_documents', 0.48, 0.25, 0.56, [-0.48, 0.95, -0.25]);

  // 6. Antique Brass Cipher Wheel (on desk right)
  const cipherDiscMesh = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.18, 0.19, 0.03, 24)),
    brassMat
  );
  cipherDiscMesh.position.set(0.25, 0.9, -0.18);
  scene.add(cipherDiscMesh);
  addHitbox('cipher_wheel', 0.45, 0.25, 0.45, [0.25, 0.95, -0.18]);

  // 7. Architectural Plans Blueprint (back center wall)
  const planTex = track(
    makeCanvasTex(512, 360, (ctx) => {
      ctx.fillStyle = '#102a4c';
      ctx.fillRect(0, 0, 512, 360);
      ctx.strokeStyle = 'rgba(186,230,253,0.75)';
      ctx.lineWidth = 3;
      ctx.strokeRect(32, 32, 448, 296);
      ctx.strokeRect(84, 84, 150, 130);
      ctx.strokeRect(274, 84, 150, 130);
      ctx.fillStyle = '#e0f2fe';
      ctx.font = 'bold 18px monospace';
      ctx.fillText('SUB-LEVEL ARCHIVE BLUEPRINT · 1994', 66, 285);
    })
  );
  const planMesh = new THREE.Mesh(
    track(new THREE.PlaneGeometry(1.3, 0.9)),
    track(new THREE.MeshBasicMaterial({ map: planTex }))
  );
  planMesh.position.set(0.1, 1.82, -2.71);
  scene.add(planMesh);
  addHitbox('architectural_plans', 1.4, 0.98, 0.3, [0.1, 1.82, -2.6]);

  // 8. Witness Records Folders (desk top-right)
  const witnessStack = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.4, 0.07, 0.34)),
    track(new THREE.MeshStandardMaterial({ color: '#92400e', roughness: 0.8 }))
  );
  witnessStack.position.set(0.28, 0.91, -0.58);
  scene.add(witnessStack);
  addHitbox('witness_records', 0.48, 0.25, 0.44, [0.28, 0.96, -0.58]);

  // 9. Hidden Stone Compartment Alcove (right wall)
  const alcoveDoorPivot = new THREE.Group();
  alcoveDoorPivot.position.set(3.08, 1.38, -0.65);
  const alcoveSlab = new THREE.Mesh(track(new THREE.BoxGeometry(0.08, 0.65, 0.72)), wallMat);
  alcoveSlab.position.set(0, 0, 0.36);
  alcoveDoorPivot.add(alcoveSlab);
  scene.add(alcoveDoorPivot);
  addHitbox('hidden_compartments', 0.42, 0.78, 0.85, [2.98, 1.38, -0.28]);

  // 10. Massive Circular Mechanical Vault Door (front wall x = 0.3, z = 2.88)
  const vaultDoorPivot = new THREE.Group();
  vaultDoorPivot.position.set(-0.5, 1.28, 2.88);
  const vaultPlate = new THREE.Mesh(track(new THREE.BoxGeometry(1.6, 2.55, 0.14)), ironMat);
  vaultPlate.position.set(0.8, 0, 0);
  vaultDoorPivot.add(vaultPlate);

  const vaultWheelPivot = new THREE.Group();
  vaultWheelPivot.position.set(0.8, 0.05, -0.11);
  const vaultRing = new THREE.Mesh(
    track(new THREE.TorusGeometry(0.46, 0.06, 12, 32)),
    brassMat
  );
  vaultWheelPivot.add(vaultRing);
  [0, Math.PI / 3, (2 * Math.PI) / 3].forEach((rot) => {
    const spoke = new THREE.Mesh(track(new THREE.BoxGeometry(0.88, 0.05, 0.04)), brassMat);
    spoke.rotation.z = rot;
    vaultWheelPivot.add(spoke);
  });
  vaultDoorPivot.add(vaultWheelPivot);

  const vaultStatusLedMat = track(
    new THREE.MeshStandardMaterial({
      color: '#ef4444',
      emissive: '#ef4444',
      emissiveIntensity: 1.5,
    })
  );
  const ledMesh = new THREE.Mesh(track(new THREE.SphereGeometry(0.04, 10, 10)), vaultStatusLedMat);
  ledMesh.position.set(0.8, 0.72, -0.1);
  vaultDoorPivot.add(ledMesh);
  scene.add(vaultDoorPivot);
  addHitbox('mechanical_vault', 1.68, 2.45, 0.55, [0.3, 1.25, 2.72]);

  // Subterranean shadow strip under vault
  const grateShadowMat = track(
    new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0 })
  );
  const grateShadow = new THREE.Mesh(track(new THREE.PlaneGeometry(1.7, 0.4)), grateShadowMat);
  grateShadow.rotation.x = -Math.PI / 2;
  grateShadow.position.set(0.3, 0.02, 2.65);
  scene.add(grateShadow);

  // Floating Atmospheric Dust Particles
  const dustCount = 120;
  const dustPositions = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dustPositions[i * 3] = ((i * 73) % 520) / 100 - 2.6;
    dustPositions[i * 3 + 1] = ((i * 41) % 240) / 100 + 0.35;
    dustPositions[i * 3 + 2] = ((i * 97) % 480) / 100 - 2.4;
  }
  const dustGeo = track(new THREE.BufferGeometry());
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  const dustMotes = new THREE.Points(
    dustGeo,
    track(
      new THREE.PointsMaterial({
        color: '#fcd34d',
        size: 0.028,
        transparent: true,
        opacity: 0.45,
      })
    )
  );
  scene.add(dustMotes);

  // Hover floor ring
  const hoverRing = new THREE.Mesh(
    track(new THREE.RingGeometry(0.28, 0.36, 28)),
    track(
      new THREE.MeshBasicMaterial({
        color: '#f59e0b',
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
      })
    )
  );
  hoverRing.rotation.x = -Math.PI / 2;
  hoverRing.position.y = 0.02;
  scene.add(hoverRing);

  // Antique lighting
  scene.add(new THREE.AmbientLight('#c2a57a', 0.4));
  const bankerLight = new THREE.PointLight('#fbbf24', 2.6, 9, 1.35);
  bankerLight.position.set(-0.65, 1.55, -0.45);
  scene.add(bankerLight);

  const vaultLight = new THREE.PointLight('#fb923c', 1.4, 8, 1.4);
  vaultLight.position.set(0.3, 2.25, 2.0);
  scene.add(vaultLight);

  const shelfWash = new THREE.PointLight('#d97706', 1.15, 7, 1.5);
  shelfWash.position.set(-1.6, 2.1, -1.9);
  scene.add(shelfWash);

  return {
    hitTargets,
    disposables,
    dustMotes,
    bankerLight,
    vaultLight,
    alcoveDoorPivot,
    cipherDiscMesh,
    vaultWheelPivot,
    vaultDoorPivot,
    vaultStatusLedMat,
    grateShadowMat,
    hoverRing,
  };
}
