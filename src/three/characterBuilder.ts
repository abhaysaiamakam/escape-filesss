import * as THREE from 'three';
import {
  createCharacterFaceTexture,
  createOwaspShirtTexture,
} from './proceduralTextures';

export type CharacterAnimMode =
  | 'idle'
  | 'walk'
  | 'inspect'
  | 'uv_shine'
  | 'sit_study'
  | 'escape_walk';

export interface CharacterRig {
  root: THREE.Group;
  hips: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  leftShoulder: THREE.Group;
  leftElbow: THREE.Group;
  rightShoulder: THREE.Group;
  rightElbow: THREE.Group;
  leftHip: THREE.Group;
  leftKnee: THREE.Group;
  rightHip: THREE.Group;
  rightKnee: THREE.Group;
  uvTorchHeld: THREE.Group;
  penHeld: THREE.Mesh;
  disposables: Array<{ dispose: () => void }>;
}

export interface CharacterOptions {
  shirtVariant: 'owasp' | 'roommate';
  shirtColorHex?: number;
  pantsColorHex?: number;
  skinColorHex?: number;
  hairColorHex?: number;
  maxAnisotropy: number;
  contactShadowTex: THREE.Texture;
}

export function buildHumanCharacter(opts: CharacterOptions): CharacterRig {
  const disposables: Array<{ dispose: () => void }> = [];
  const track = <T extends { dispose: () => void }>(d: T): T => {
    disposables.push(d);
    return d;
  };

  const skinMat = track(
    new THREE.MeshStandardMaterial({
      color: opts.skinColorHex ?? 0xc88d68,
      roughness: 0.72,
      metalness: 0.02,
    })
  );
  const hairMat = track(
    new THREE.MeshStandardMaterial({
      color: opts.hairColorHex ?? 0x161820,
      roughness: 0.85,
    })
  );
  const pantsMat = track(
    new THREE.MeshStandardMaterial({
      color: opts.pantsColorHex ?? 0x1e2638,
      roughness: 0.82,
    })
  );
  const shoeMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x0f1218,
      roughness: 0.55,
      metalness: 0.1,
    })
  );

  const root = new THREE.Group();

  // Ground contact shadow beneath feet
  const shadow = new THREE.Mesh(
    track(new THREE.PlaneGeometry(0.62, 0.62)),
    track(
      new THREE.MeshBasicMaterial({
        map: opts.contactShadowTex,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      })
    )
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.01;
  root.add(shadow);

  // Hips / Pelvis pivot (height ~0.88m when standing)
  const hips = new THREE.Group();
  hips.position.y = 0.88;
  root.add(hips);

  const pelvisMesh = new THREE.Mesh(track(new THREE.BoxGeometry(0.32, 0.13, 0.2)), pantsMat);
  pelvisMesh.castShadow = true;
  hips.add(pelvisMesh);

  // Torso group
  const torso = new THREE.Group();
  torso.position.y = 0.07;
  hips.add(torso);

  let torsoMaterials: THREE.Material | THREE.Material[];
  let sleeveMat: THREE.MeshStandardMaterial;

  if (opts.shirtVariant === 'owasp') {
    const frontTex = track(createOwaspShirtTexture(opts.maxAnisotropy, false));
    const backTex = track(createOwaspShirtTexture(opts.maxAnisotropy, true));
    const sideMat = track(
      new THREE.MeshStandardMaterial({ color: 0x111622, roughness: 0.82 })
    );
    sleeveMat = sideMat;
    torsoMaterials = [
      sideMat,
      sideMat,
      sideMat,
      sideMat,
      track(new THREE.MeshStandardMaterial({ map: frontTex, roughness: 0.78 })),
      track(new THREE.MeshStandardMaterial({ map: backTex, roughness: 0.78 })),
    ];
  } else {
    sleeveMat = track(
      new THREE.MeshStandardMaterial({
        color: opts.shirtColorHex ?? 0x7c2d36,
        roughness: 0.86,
      })
    );
    torsoMaterials = sleeveMat;
  }

  const chestMesh = new THREE.Mesh(track(new THREE.BoxGeometry(0.38, 0.48, 0.22)), torsoMaterials);
  chestMesh.position.y = 0.24;
  chestMesh.castShadow = true;
  torso.add(chestMesh);

  // Head & Neck
  const head = new THREE.Group();
  head.position.y = 0.5;
  torso.add(head);

  const neck = new THREE.Mesh(track(new THREE.CylinderGeometry(0.055, 0.062, 0.1, 10)), skinMat);
  neck.position.y = 0.04;
  head.add(neck);

  const faceTex = track(createCharacterFaceTexture(opts.maxAnisotropy));
  const headMesh = new THREE.Mesh(track(new THREE.BoxGeometry(0.22, 0.24, 0.22)), [
    skinMat,
    skinMat,
    hairMat,
    skinMat,
    track(new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.72 })),
    hairMat,
  ]);
  headMesh.position.y = 0.19;
  headMesh.castShadow = true;
  head.add(headMesh);

  const hairTop = new THREE.Mesh(track(new THREE.BoxGeometry(0.235, 0.075, 0.24)), hairMat);
  hairTop.position.set(0, 0.305, -0.01);
  head.add(hairTop);

  // Arms helper
  const buildArm = (side: -1 | 1) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.24, 0.44, 0);
    torso.add(shoulder);

    const sleeve = new THREE.Mesh(track(new THREE.BoxGeometry(0.11, 0.15, 0.11)), sleeveMat);
    sleeve.position.y = -0.06;
    sleeve.castShadow = true;
    shoulder.add(sleeve);

    const upperArm = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.042, 0.038, 0.22, 10)),
      skinMat
    );
    upperArm.position.y = -0.17;
    upperArm.castShadow = true;
    shoulder.add(upperArm);

    const elbow = new THREE.Group();
    elbow.position.y = -0.28;
    shoulder.add(elbow);

    const forearm = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.036, 0.03, 0.24, 10)),
      skinMat
    );
    forearm.position.y = -0.12;
    forearm.castShadow = true;
    elbow.add(forearm);

    const hand = new THREE.Mesh(track(new THREE.SphereGeometry(0.038, 10, 10)), skinMat);
    hand.position.y = -0.25;
    elbow.add(hand);

    return { shoulder, elbow, hand };
  };

  const leftArm = buildArm(-1);
  const rightArm = buildArm(1);

  // Held UV Torch attached to right hand (visible when uvTorchActive!)
  const uvTorchHeld = new THREE.Group();
  uvTorchHeld.position.set(0, -0.26, 0.06);
  uvTorchHeld.rotation.x = Math.PI / 2;
  const torchGrip = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.022, 0.02, 0.15, 10)),
    track(new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35, metalness: 0.8 }))
  );
  const torchTip = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.028, 0.022, 0.035, 10)),
    track(new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0xc084fc, emissiveIntensity: 2.2 }))
  );
  torchTip.position.y = 0.085;
  uvTorchHeld.add(torchGrip, torchTip);
  uvTorchHeld.visible = false;
  rightArm.elbow.add(uvTorchHeld);

  // Held Pen for studying roommate
  const penHeld = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.006, 0.006, 0.12, 8)),
    track(new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.4 }))
  );
  penHeld.position.set(0, -0.26, 0.04);
  penHeld.rotation.x = Math.PI / 3;
  penHeld.visible = false;
  rightArm.elbow.add(penHeld);

  // Legs helper
  const buildLeg = (side: -1 | 1) => {
    const hip = new THREE.Group();
    hip.position.set(side * 0.095, -0.04, 0);
    hips.add(hip);

    const thigh = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.062, 0.052, 0.4, 10)),
      pantsMat
    );
    thigh.position.y = -0.2;
    thigh.castShadow = true;
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.y = -0.4;
    hip.add(knee);

    const shin = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.05, 0.042, 0.38, 10)),
      pantsMat
    );
    shin.position.y = -0.19;
    shin.castShadow = true;
    knee.add(shin);

    const shoe = new THREE.Mesh(track(new THREE.BoxGeometry(0.1, 0.075, 0.2)), shoeMat);
    shoe.position.set(0, -0.4, 0.045);
    shoe.castShadow = true;
    knee.add(shoe);

    return { hip, knee };
  };

  const leftLeg = buildLeg(-1);
  const rightLeg = buildLeg(1);

  return {
    root,
    hips,
    torso,
    head,
    leftShoulder: leftArm.shoulder,
    leftElbow: leftArm.elbow,
    rightShoulder: rightArm.shoulder,
    rightElbow: rightArm.elbow,
    leftHip: leftLeg.hip,
    leftKnee: leftLeg.knee,
    rightHip: rightLeg.hip,
    rightKnee: rightLeg.knee,
    uvTorchHeld,
    penHeld,
    disposables,
  };
}

export function updateCharacterAnimation(
  rig: CharacterRig,
  mode: CharacterAnimMode,
  dt: number,
  elapsed: number,
  walkPhase: number
): void {
  const damp = (cur: number, target: number, lambda = 10) =>
    THREE.MathUtils.damp(cur, target, lambda, dt);

  if (mode === 'sit_study') {
    rig.hips.position.y = damp(rig.hips.position.y, 0.47, 12);
    rig.torso.rotation.x = damp(rig.torso.rotation.x, 0.28, 10);
    rig.torso.rotation.y = damp(rig.torso.rotation.y, Math.sin(elapsed * 0.7) * 0.04, 8);
    rig.head.rotation.x = damp(rig.head.rotation.x, 0.32 + Math.sin(elapsed * 1.4) * 0.05, 8);
    rig.head.rotation.y = damp(rig.head.rotation.y, Math.sin(elapsed * 0.9) * 0.14, 6);

    rig.leftHip.rotation.x = damp(rig.leftHip.rotation.x, -1.48, 12);
    rig.rightHip.rotation.x = damp(rig.rightHip.rotation.x, -1.48, 12);
    rig.leftKnee.rotation.x = damp(rig.leftKnee.rotation.x, 1.45, 12);
    rig.rightKnee.rotation.x = damp(rig.rightKnee.rotation.x, 1.45, 12);

    // Arms resting on desk studying & writing
    rig.leftShoulder.rotation.x = damp(rig.leftShoulder.rotation.x, -0.78, 10);
    rig.leftShoulder.rotation.z = damp(rig.leftShoulder.rotation.z, 0.12, 10);
    rig.leftElbow.rotation.x = damp(rig.leftElbow.rotation.x, -0.85, 10);

    rig.rightShoulder.rotation.x = damp(
      rig.rightShoulder.rotation.x,
      -0.82 + Math.sin(elapsed * 5.2) * 0.06,
      10
    );
    rig.rightShoulder.rotation.z = damp(
      rig.rightShoulder.rotation.z,
      -0.12 + Math.cos(elapsed * 3.8) * 0.05,
      10
    );
    rig.rightElbow.rotation.x = damp(rig.rightElbow.rotation.x, -0.88, 10);
    return;
  }

  if (mode === 'walk' || mode === 'escape_walk') {
    const s = Math.sin(walkPhase);
    const c = Math.cos(walkPhase);

    rig.hips.position.y = damp(rig.hips.position.y, 0.88 + Math.abs(c) * 0.035, 14);
    rig.torso.rotation.x = damp(rig.torso.rotation.x, 0.06, 10);
    rig.torso.rotation.y = damp(rig.torso.rotation.y, s * 0.1, 12);
    rig.head.rotation.x = damp(rig.head.rotation.x, 0.03, 10);
    rig.head.rotation.y = damp(rig.head.rotation.y, -s * 0.06, 10);

    rig.leftHip.rotation.x = damp(rig.leftHip.rotation.x, s * 0.62, 16);
    rig.rightHip.rotation.x = damp(rig.rightHip.rotation.x, -s * 0.62, 16);
    rig.leftKnee.rotation.x = damp(rig.leftKnee.rotation.x, Math.max(0, -c * 0.68), 16);
    rig.rightKnee.rotation.x = damp(rig.rightKnee.rotation.x, Math.max(0, c * 0.68), 16);

    rig.leftShoulder.rotation.x = damp(rig.leftShoulder.rotation.x, -s * 0.48, 14);
    rig.leftShoulder.rotation.z = damp(rig.leftShoulder.rotation.z, 0.08, 10);
    rig.leftElbow.rotation.x = damp(rig.leftElbow.rotation.x, -0.35, 10);

    if (rig.uvTorchHeld.visible) {
      rig.rightShoulder.rotation.x = damp(rig.rightShoulder.rotation.x, -1.1, 12);
      rig.rightElbow.rotation.x = damp(rig.rightElbow.rotation.x, -0.25, 12);
    } else {
      rig.rightShoulder.rotation.x = damp(rig.rightShoulder.rotation.x, s * 0.48, 14);
      rig.rightShoulder.rotation.z = damp(rig.rightShoulder.rotation.z, -0.08, 10);
      rig.rightElbow.rotation.x = damp(rig.rightElbow.rotation.x, -0.35, 10);
    }
    return;
  }

  if (mode === 'uv_shine') {
    rig.hips.position.y = damp(rig.hips.position.y, 0.88 + Math.sin(elapsed * 2) * 0.01, 10);
    rig.torso.rotation.x = damp(rig.torso.rotation.x, 0.04, 10);
    rig.torso.rotation.y = damp(rig.torso.rotation.y, -0.15, 10);
    rig.head.rotation.x = damp(rig.head.rotation.x, -0.12, 10);
    rig.head.rotation.y = damp(rig.head.rotation.y, 0.1, 10);

    rig.leftHip.rotation.x = damp(rig.leftHip.rotation.x, 0, 12);
    rig.rightHip.rotation.x = damp(rig.rightHip.rotation.x, 0, 12);
    rig.leftKnee.rotation.x = damp(rig.leftKnee.rotation.x, 0, 12);
    rig.rightKnee.rotation.x = damp(rig.rightKnee.rotation.x, 0, 12);

    rig.leftShoulder.rotation.x = damp(rig.leftShoulder.rotation.x, 0.08, 10);
    rig.leftElbow.rotation.x = damp(rig.leftElbow.rotation.x, -0.2, 10);

    // Raise right arm holding UV torch toward wall poster
    rig.rightShoulder.rotation.x = damp(rig.rightShoulder.rotation.x, -1.38, 10);
    rig.rightShoulder.rotation.z = damp(rig.rightShoulder.rotation.z, -0.1, 10);
    rig.rightElbow.rotation.x = damp(rig.rightElbow.rotation.x, -0.15, 10);
    return;
  }

  if (mode === 'inspect') {
    rig.hips.position.y = damp(rig.hips.position.y, 0.88, 10);
    rig.torso.rotation.x = damp(rig.torso.rotation.x, 0.12, 10);
    rig.torso.rotation.y = damp(rig.torso.rotation.y, 0, 10);
    rig.head.rotation.x = damp(rig.head.rotation.x, 0.08, 10);
    rig.head.rotation.y = damp(rig.head.rotation.y, Math.sin(elapsed * 1.5) * 0.12, 8);

    rig.leftHip.rotation.x = damp(rig.leftHip.rotation.x, 0, 12);
    rig.rightHip.rotation.x = damp(rig.rightHip.rotation.x, 0, 12);
    rig.leftKnee.rotation.x = damp(rig.leftKnee.rotation.x, 0, 12);
    rig.rightKnee.rotation.x = damp(rig.rightKnee.rotation.x, 0, 12);

    rig.leftShoulder.rotation.x = damp(rig.leftShoulder.rotation.x, -0.2, 10);
    rig.leftElbow.rotation.x = damp(rig.leftElbow.rotation.x, -0.45, 10);
    rig.rightShoulder.rotation.x = damp(
      rig.rightShoulder.rotation.x,
      -0.95 + Math.sin(elapsed * 3) * 0.08,
      10
    );
    rig.rightElbow.rotation.x = damp(rig.rightElbow.rotation.x, -0.45, 10);
    return;
  }

  // Idle breathing
  rig.hips.position.y = damp(rig.hips.position.y, 0.88 + Math.sin(elapsed * 2.1) * 0.008, 10);
  rig.torso.rotation.x = damp(rig.torso.rotation.x, 0.02, 8);
  rig.torso.rotation.y = damp(rig.torso.rotation.y, Math.sin(elapsed * 0.8) * 0.05, 6);
  rig.head.rotation.x = damp(rig.head.rotation.x, Math.sin(elapsed * 1.2) * 0.04, 6);
  rig.head.rotation.y = damp(rig.head.rotation.y, Math.sin(elapsed * 0.65) * 0.22, 5);

  rig.leftHip.rotation.x = damp(rig.leftHip.rotation.x, 0, 10);
  rig.rightHip.rotation.x = damp(rig.rightHip.rotation.x, 0, 10);
  rig.leftKnee.rotation.x = damp(rig.leftKnee.rotation.x, 0, 10);
  rig.rightKnee.rotation.x = damp(rig.rightKnee.rotation.x, 0, 10);

  rig.leftShoulder.rotation.x = damp(rig.leftShoulder.rotation.x, 0.05, 8);
  rig.leftShoulder.rotation.z = damp(rig.leftShoulder.rotation.z, 0.08, 8);
  rig.leftElbow.rotation.x = damp(rig.leftElbow.rotation.x, -0.18, 8);

  rig.rightShoulder.rotation.x = damp(
    rig.rightShoulder.rotation.x,
    rig.uvTorchHeld.visible ? -1.15 : 0.05,
    8
  );
  rig.rightShoulder.rotation.z = damp(rig.rightShoulder.rotation.z, -0.08, 8);
  rig.rightElbow.rotation.x = damp(rig.rightElbow.rotation.x, -0.18, 8);
}
