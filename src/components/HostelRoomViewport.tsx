import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { soundEngine } from '../audio/soundEngine';
import { ROOM_OBJECTS, ROOM_OBJECT_ORDER } from '../data/gameContent';
import {
  CharacterAnimMode,
  updateCharacterAnimation,
} from '../three/characterBuilder';
import { buildHostelRoom, HostelRoomHandles } from '../three/roomBuilder';
import {
  BookId,
  GamePhase,
  RoomObjectId,
  StoryAnimationTriggers,
  WardenThreatState,
} from '../types/game';

interface HostelRoomViewportProps {
  phase: GamePhase;
  activeObject: RoomObjectId | null;
  hoveredObject: RoomObjectId | null;
  onHoverObject: (id: RoomObjectId | null) => void;
  onSelectObject: (id: RoomObjectId) => void;
  puzzle1Completed: boolean;
  puzzle2Completed: boolean;
  puzzle3Completed: boolean;
  bookshelfUnlockedWithKey: boolean;
  persistentBookOrder: BookId[];
  backpackUnzipped: boolean;
  wardrobeOpened: boolean;
  bedPillowLifted: boolean;
  phoneUnreadCount: number;
  wardenState: WardenThreatState;
  uvTorchActive: boolean;
  uvAimNormalized?: { x: number; y: number } | null;
  inspectedObjects: RoomObjectId[];
  cameraResetTrigger: number;
  showHotspots: boolean;
  storyTriggers: StoryAnimationTriggers;
}

interface ProjectedPin {
  id: RoomObjectId;
  x: number;
  y: number;
  visible: boolean;
}

// Pre-allocated scratch math objects (zero GC in rAF loop)
const _scratchVec = new THREE.Vector3();
const _targetCamPos = new THREE.Vector3();
const _targetLookAt = new THREE.Vector3();
const _currentLookAt = new THREE.Vector3();
const _camForward = new THREE.Vector3();
const _audioForward = new THREE.Vector3();
const _camRight = new THREE.Vector3();
const _moveDir = new THREE.Vector3();
const _rainDummy = new THREE.Object3D();
const _nightColor = new THREE.Color(0x070d1e);
const _lightningNightColor = new THREE.Color(0x1f355c);
const _ledLockedAmber = new THREE.Color(0xf59e0b);
const _ledLockedRed = new THREE.Color(0xef4444);
const _ledUnlockedGreen = new THREE.Color(0x10b981);
const BOOK_SLOT_X = [-0.26, -0.12, 0.02, 0.16];

const OVERVIEW_POS: [number, number, number] = [0.0, 1.7, 0.15];
const OVERVIEW_TARGET: [number, number, number] = [-0.55, 1.25, -1.25];
const OVERVIEW_YAW = Math.atan2(
  OVERVIEW_TARGET[0] - OVERVIEW_POS[0],
  -(OVERVIEW_TARGET[2] - OVERVIEW_POS[2])
);
const OVERVIEW_PITCH = Math.atan2(
  OVERVIEW_TARGET[1] - OVERVIEW_POS[1],
  Math.hypot(OVERVIEW_TARGET[0] - OVERVIEW_POS[0], OVERVIEW_TARGET[2] - OVERVIEW_POS[2])
);
const OVERVIEW_FOV = 62;
const INSPECT_FOV = 54;

const INTRO_CAM_START: [number, number, number] = [0.45, 1.6, 10.2];
const INTRO_CAM_END: [number, number, number] = [0.45, 1.5, 4.4];
const INTRO_TARGET: [number, number, number] = [0.45, 1.38, 2.7];

const VICTORY_CAM_POS: [number, number, number] = [0.42, 1.55, 0.85];
const VICTORY_CAM_TARGET: [number, number, number] = [0.45, 1.35, 5.2];

const FAILURE_CAM_POS: [number, number, number] = [0.1, 1.25, 0.95];
const FAILURE_CAM_TARGET: [number, number, number] = [0.45, 0.95, 2.62];

// Natural standing spots inside the room for auto-walking to inspected objects
const OBJECT_STAND_SPOTS: Record<RoomObjectId, { pos: [number, number]; look: [number, number] }> = {
  study_table: { pos: [-1.15, -1.05], look: [-2.05, -1.75] },
  desk_drawer: { pos: [-1.18, -0.95], look: [-1.68, -1.75] },
  bookshelf: { pos: [-0.45, -1.52], look: [-0.45, -2.42] },
  wall_clock: { pos: [-1.45, -1.15], look: [-1.85, -2.61] },
  wall_poster: { pos: [-1.85, -0.4], look: [-2.91, -0.4] },
  calendar: { pos: [0.62, -1.62], look: [0.65, -2.61] },
  backpack: { pos: [-0.75, -0.78], look: [-1.35, -0.95] },
  wardrobe: { pos: [1.55, -1.45], look: [2.35, -2.12] },
  bed: { pos: [0.95, 0.85], look: [2.05, 0.85] },
  exit_door: { pos: [0.45, 1.88], look: [0.45, 2.66] },
};

function clampPlayerRoomPosition(x: number, z: number): [number, number] {
  let nx = THREE.MathUtils.clamp(x, -2.42, 2.42);
  let nz = THREE.MathUtils.clamp(z, -2.05, 2.22);

  // Avoid stepping through bed (x > 1.28 && z > -0.3)
  if (nx > 1.25 && nz > -0.35) {
    if (nx - 1.25 < nz + 0.35) nx = 1.25;
    else nz = -0.35;
  }
  // Avoid stepping through study table + seated roommate (x < -1.15 && z < -0.78)
  if (nx < -1.12 && nz < -0.82) {
    if (-1.12 - nx < -0.82 - nz) nx = -1.12;
    else nz = -0.82;
  }
  // Avoid stepping into wardrobe (x > 1.55 && z < -1.45)
  if (nx > 1.58 && nz < -1.48) {
    if (nx - 1.58 < -1.48 - nz) nx = 1.58;
    else nz = -1.48;
  }
  // Avoid stepping into bookshelf (x > -1.05 && x < 0.15 && z < -1.85)
  if (nx > -1.05 && nx < 0.15 && nz < -1.85) {
    nz = -1.85;
  }
  return [nx, nz];
}

function shortestAngleDiff(current: number, target: number): number {
  let diff = (target - current + Math.PI) % (Math.PI * 2);
  if (diff < 0) diff += Math.PI * 2;
  return diff - Math.PI;
}

export const HostelRoomViewport: React.FC<HostelRoomViewportProps> = ({
  phase,
  activeObject,
  hoveredObject,
  onHoverObject,
  onSelectObject,
  puzzle1Completed,
  puzzle2Completed,
  puzzle3Completed,
  bookshelfUnlockedWithKey,
  persistentBookOrder,
  backpackUnzipped,
  wardrobeOpened,
  bedPillowLifted,
  phoneUnreadCount,
  wardenState,
  uvTorchActive,
  uvAimNormalized,
  inspectedObjects,
  cameraResetTrigger,
  showHotspots,
  storyTriggers,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglFallback, setWebglFallback] = useState(false);
  const [pins, setPins] = useState<ProjectedPin[]>([]);
  const keysRef = useRef<Record<string, boolean>>({});
  const autoWalkTargetRef = useRef<{
    x: number;
    z: number;
    lookX: number;
    lookZ: number;
    active: boolean;
  }>({ x: -0.25, z: 0.38, lookX: -0.25, lookZ: -1.5, active: false });
  const prevPhaseRef = useRef<GamePhase>(phase);

  // Store latest props in refs so WebGL mount never resets
  const propsRef = useRef({
    phase,
    activeObject,
    hoveredObject,
    onHoverObject,
    onSelectObject,
    puzzle1Completed,
    puzzle2Completed,
    puzzle3Completed,
    bookshelfUnlockedWithKey,
    persistentBookOrder,
    backpackUnzipped,
    wardrobeOpened,
    bedPillowLifted,
    phoneUnreadCount,
    wardenState,
    uvTorchActive,
    uvAimNormalized,
    showHotspots,
    storyTriggers,
  });
  propsRef.current = {
    phase,
    activeObject,
    hoveredObject,
    onHoverObject,
    onSelectObject,
    puzzle1Completed,
    puzzle2Completed,
    puzzle3Completed,
    bookshelfUnlockedWithKey,
    persistentBookOrder,
    backpackUnzipped,
    wardrobeOpened,
    bedPillowLifted,
    phoneUnreadCount,
    wardenState,
    uvTorchActive,
    uvAimNormalized,
    showHotspots,
    storyTriggers,
  };

  const cameraGlideRef = useRef<{
    active: boolean;
    pos: [number, number, number];
    target: [number, number, number];
  }>({
    active: true,
    pos: phase === 'INTRO' ? INTRO_CAM_END : OVERVIEW_POS,
    target: phase === 'INTRO' ? INTRO_TARGET : OVERVIEW_TARGET,
  });

  const panStateRef = useRef<{
    targetYaw: number;
    currentYaw: number;
    targetPitch: number;
    currentPitch: number;
    targetFov: number;
    currentFov: number;
    lastActiveObject: RoomObjectId | null;
  }>({
    targetYaw: OVERVIEW_YAW,
    currentYaw: OVERVIEW_YAW,
    targetPitch: OVERVIEW_PITCH,
    currentPitch: OVERVIEW_PITCH,
    targetFov: OVERVIEW_FOV,
    currentFov: OVERVIEW_FOV,
    lastActiveObject: null,
  });

  // Keyboard Arrow & WASD controls for walking the OWASP-shirt character
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (
        e.key === 'ArrowUp' ||
        e.key === 'ArrowDown' ||
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowRight'
      ) {
        e.preventDefault();
      }
      keysRef.current[e.code] = true;
      keysRef.current[e.key] = true;

      if (
        e.key === 'ArrowUp' ||
        e.key === 'ArrowDown' ||
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowRight' ||
        e.code === 'KeyW' ||
        e.code === 'KeyA' ||
        e.code === 'KeyS' ||
        e.code === 'KeyD'
      ) {
        autoWalkTargetRef.current.active = false;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
      keysRef.current[e.key] = false;
    };

    const onBlur = () => {
      keysRef.current = {};
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  // Trigger camera glide and character auto-walk when object/phase changes
  useEffect(() => {
    if (phase === 'INTRO') {
      cameraGlideRef.current = {
        active: true,
        pos: INTRO_CAM_END,
        target: INTRO_TARGET,
      };
      return;
    }

    if (phase === 'VICTORY') {
      cameraGlideRef.current = {
        active: true,
        pos: VICTORY_CAM_POS,
        target: VICTORY_CAM_TARGET,
      };
      autoWalkTargetRef.current.active = false;
      return;
    }

    if (phase === 'FAILURE') {
      cameraGlideRef.current = {
        active: true,
        pos: FAILURE_CAM_POS,
        target: FAILURE_CAM_TARGET,
      };
      autoWalkTargetRef.current.active = false;
      return;
    }

    if (activeObject) {
      const meta = ROOM_OBJECTS[activeObject];
      panStateRef.current.lastActiveObject = activeObject;
      cameraGlideRef.current = {
        active: true,
        pos: meta.cameraPosition,
        target: meta.cameraTarget,
      };
      const spot = OBJECT_STAND_SPOTS[activeObject];
      autoWalkTargetRef.current = {
        x: spot.pos[0],
        z: spot.pos[1],
        lookX: spot.look[0],
        lookZ: spot.look[1],
        active: true,
      };
    } else {
      // Smoothly aim the 360° pan toward the just-inspected object, or reset on explicit Room View
      const prevObj = panStateRef.current.lastActiveObject;
      if (prevObj) {
        const look = ROOM_OBJECTS[prevObj].cameraTarget;
        const dx = look[0] - OVERVIEW_POS[0];
        const dy = look[1] - OVERVIEW_POS[1];
        const dz = look[2] - OVERVIEW_POS[2];
        const yaw = Math.atan2(dx, -dz);
        const pitch = THREE.MathUtils.clamp(
          Math.atan2(dy, Math.hypot(dx, dz)),
          -0.52,
          0.58
        );
        panStateRef.current.targetYaw = yaw;
        panStateRef.current.currentYaw = yaw;
        panStateRef.current.targetPitch = pitch;
        panStateRef.current.currentPitch = pitch;
        panStateRef.current.lastActiveObject = null;
      }
      cameraGlideRef.current = {
        active: true,
        pos: OVERVIEW_POS,
        target: OVERVIEW_TARGET,
      };
    }
  }, [activeObject, phase]);

  // Explicit "Room View" reset restores default panoramic angle & FOV
  useEffect(() => {
    if (cameraResetTrigger === 0) return;
    panStateRef.current.targetYaw = OVERVIEW_YAW;
    panStateRef.current.targetPitch = OVERVIEW_PITCH;
    panStateRef.current.targetFov = OVERVIEW_FOV;
    panStateRef.current.lastActiveObject = null;
  }, [cameraResetTrigger]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      try {
        const probe = document.createElement('canvas').getContext('webgl2');
        if (!probe) return true;
        const ext = probe.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
        const gpu = String(probe.getParameter(param));
        probe.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglFallback(true);
      return;
    }

    const canvas = renderer.domElement;
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglFallback(true);
    };
    const handleContextRestored = () => {
      setWebglFallback(false);
    };
    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    renderer.setSize(width, height);
    container.appendChild(canvas);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060810);
    scene.fog = new THREE.FogExp2(0x060810, 0.036);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envTarget.texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(OVERVIEW_FOV, width / height, 0.1, 45);
    if (propsRef.current.phase === 'INTRO') {
      camera.position.set(...INTRO_CAM_START);
      _currentLookAt.set(...INTRO_TARGET);
    } else {
      camera.position.set(...OVERVIEW_POS);
      _currentLookAt.set(...OVERVIEW_TARGET);
    }
    camera.lookAt(_currentLookAt);
    canvas.style.touchAction = 'none';
    canvas.style.cursor = 'grab';

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const room: HostelRoomHandles = buildHostelRoom(scene, maxAniso, isSoftwareGl);

    if (propsRef.current.phase === 'INTRO') {
      room.playerRig.root.position.set(0.45, 0, 5.4);
      room.playerRig.root.rotation.y = Math.PI;
    } else {
      room.playerRig.root.position.set(-0.35, 0, -0.75);
      room.playerRig.root.rotation.y = Math.PI;
    }

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Raycaster setup (restricted to layer 1 simplified hitboxes)
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    const pointerNdc = new THREE.Vector2();
    let lastHoverCheck = 0;
    let isDragging = false;
    let activePointerId: number | null = null;
    let lastPointer = { x: 0, y: 0 };
    let dragDistance = 0;

    const updatePointer = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    };

    const pickObject = (): RoomObjectId | null => {
      if (propsRef.current.phase === 'INTRO') return null;
      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects(room.hitTargets, false);
      if (hits.length > 0) {
        return (hits[0].object.userData.objectId as RoomObjectId) ?? null;
      }
      return null;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (propsRef.current.phase === 'INTRO') return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      isDragging = true;
      activePointerId = e.pointerId;
      lastPointer = { x: e.clientX, y: e.clientY };
      dragDistance = 0;
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        // Ignore if capture is unsupported
      }
      canvas.style.cursor = 'grabbing';
    };

    const onPointerMove = (e: PointerEvent) => {
      if (propsRef.current.phase === 'INTRO') return;

      if (isDragging && (activePointerId === null || e.pointerId === activePointerId)) {
        const dx = e.clientX - lastPointer.x;
        const dy = e.clientY - lastPointer.y;
        lastPointer = { x: e.clientX, y: e.clientY };
        dragDistance += Math.hypot(dx, dy);

        // 360-degree horizontal rotational pan when dragging on background in overview mode
        if (!propsRef.current.activeObject && propsRef.current.phase === 'ROOM_INVESTIGATION') {
          panStateRef.current.targetYaw -= dx * 0.0052;
          panStateRef.current.targetPitch = THREE.MathUtils.clamp(
            panStateRef.current.targetPitch + dy * 0.0038,
            -0.52,
            0.58
          );
        }
        canvas.style.cursor = 'grabbing';
        return;
      }

      const now = performance.now();
      if (now - lastHoverCheck < 50) return;
      lastHoverCheck = now;
      updatePointer(e.clientX, e.clientY);
      const hit = pickObject();
      if (hit !== propsRef.current.hoveredObject) {
        propsRef.current.onHoverObject(hit);
      }
      canvas.style.cursor = hit ? 'pointer' : 'grab';
    };

    const finishDrag = (e: PointerEvent, allowClickPick: boolean) => {
      if (!isDragging) return;
      if (activePointerId !== null && e.pointerId !== activePointerId) return;
      isDragging = false;
      try {
        if (canvas.hasPointerCapture(e.pointerId)) {
          canvas.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Ignore release errors
      }
      activePointerId = null;

      if (propsRef.current.phase === 'INTRO') return;
      updatePointer(e.clientX, e.clientY);
      const hit = pickObject();
      canvas.style.cursor = hit ? 'pointer' : 'grab';

      if (allowClickPick && dragDistance <= 7 && hit) {
        propsRef.current.onSelectObject(hit);
      }
    };

    const onPointerUp = (e: PointerEvent) => finishDrag(e, true);
    const onPointerCancel = (e: PointerEvent) => finishDrag(e, false);

    const onWheel = (e: WheelEvent) => {
      if (propsRef.current.phase !== 'ROOM_INVESTIGATION' || propsRef.current.activeObject) return;
      e.preventDefault();
      panStateRef.current.targetFov = THREE.MathUtils.clamp(
        panStateRef.current.targetFov + e.deltaY * 0.025,
        38,
        72
      );
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerCancel);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    const onResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    const clock = new THREE.Clock();
    let frameId = 0;
    let disposed = false;
    let lastPinSync = 0;
    let lastAudioPoseSync = 0;
    let walkPhase = 0;
    let lastTriggers = { ...propsRef.current.storyTriggers };
    let phoneBuzzTimer = 0;
    let doorShadowTimer = 0;
    let lightFlickerTimer = 0;
    let handleNudgeTimer = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;
      const dt = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();
      const state = propsRef.current;

      // Handle phase transitions -> reset character & camera cleanly inside Room 307
      if (
        (prevPhaseRef.current === 'INTRO' && state.phase !== 'INTRO') ||
        ((prevPhaseRef.current === 'VICTORY' || prevPhaseRef.current === 'FAILURE') &&
          state.phase === 'ROOM_INVESTIGATION')
      ) {
        room.playerRig.root.position.set(-0.35, 0, -0.75);
        room.playerRig.root.rotation.y = Math.PI;
        walkPhase = 0;
        autoWalkTargetRef.current.active = false;
        camera.position.set(...OVERVIEW_POS);
        _currentLookAt.set(...OVERVIEW_TARGET);
        camera.lookAt(_currentLookAt);
        panStateRef.current = {
          targetYaw: OVERVIEW_YAW,
          currentYaw: OVERVIEW_YAW,
          targetPitch: OVERVIEW_PITCH,
          currentPitch: OVERVIEW_PITCH,
          targetFov: OVERVIEW_FOV,
          currentFov: OVERVIEW_FOV,
          lastActiveObject: null,
        };
        cameraGlideRef.current = {
          active: true,
          pos: OVERVIEW_POS,
          target: OVERVIEW_TARGET,
        };
      }
      prevPhaseRef.current = state.phase;

      // 1. Ceiling Fan continuously spinning
      room.ceilingFanPivot.rotation.y += dt * 11.5;

      // 2. Real-Time Wall Clock Hands (synchronized with system time)
      const nowDate = new Date();
      const secs = nowDate.getSeconds() + nowDate.getMilliseconds() / 1000;
      const mins = nowDate.getMinutes() + secs / 60;
      const hrs = (nowDate.getHours() % 12) + mins / 60;
      room.clockSecondPivot.rotation.z = -(secs / 60) * Math.PI * 2;
      room.clockMinutePivot.rotation.z = -(mins / 60) * Math.PI * 2;
      room.clockHourPivot.rotation.z = -(hrs / 12) * Math.PI * 2;

      // 3. Studying Roommate continuously animated at Study Table
      updateCharacterAnimation(room.roommateRig, 'sit_study', dt, elapsed, 0);

      // 4. Player Character Movement & State Animations (OWASP shirt)
      room.playerRig.uvTorchHeld.visible = state.uvTorchActive;
      let playerAnimMode: CharacterAnimMode = 'idle';

      if (state.phase === 'INTRO') {
        // Walk along the corridor toward Door 307
        const targetZ = 3.25;
        if (room.playerRig.root.position.z > targetZ + 0.04) {
          room.playerRig.root.position.z = THREE.MathUtils.damp(
            room.playerRig.root.position.z,
            targetZ,
            0.55,
            dt
          );
          walkPhase += dt * 7.5;
          playerAnimMode = 'walk';
        } else {
          playerAnimMode = 'inspect';
        }
        room.playerRig.root.rotation.y = Math.PI;
      } else if (state.phase === 'VICTORY') {
        // Player literally walks OUT through the open Door 307 into the corridor!
        const exitTargetX = 0.45;
        const exitTargetZ = 5.4;
        const dx = exitTargetX - room.playerRig.root.position.x;
        const dz = exitTargetZ - room.playerRig.root.position.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 0.08) {
          const speed = 1.45;
          room.playerRig.root.position.x += (dx / dist) * speed * dt;
          room.playerRig.root.position.z += (dz / dist) * speed * dt;
          const targetYaw = Math.atan2(dx, dz);
          room.playerRig.root.rotation.y +=
            shortestAngleDiff(room.playerRig.root.rotation.y, targetYaw) *
            Math.min(1, dt * 8);
          walkPhase += dt * 9.5;
          playerAnimMode = 'escape_walk';
        } else {
          playerAnimMode = 'idle';
        }
      } else if (state.phase !== 'FAILURE') {
        // Keyboard Arrow / WASD walking inside Room 307
        const keys = keysRef.current;
        const forwardIn =
          (keys.ArrowUp || keys.KeyW ? 1 : 0) - (keys.ArrowDown || keys.KeyS ? 1 : 0);
        const strafeIn =
          (keys.ArrowRight || keys.KeyD ? 1 : 0) - (keys.ArrowLeft || keys.KeyA ? 1 : 0);

        if (forwardIn !== 0 || strafeIn !== 0) {
          camera.getWorldDirection(_camForward);
          _camForward.y = 0;
          if (_camForward.lengthSq() < 0.001) _camForward.set(0, 0, -1);
          _camForward.normalize();
          _camRight.set(-_camForward.z, 0, _camForward.x);

          _moveDir
            .set(0, 0, 0)
            .addScaledVector(_camForward, forwardIn)
            .addScaledVector(_camRight, strafeIn)
            .normalize();

          const moveSpeed = 1.85;
          const nextX = room.playerRig.root.position.x + _moveDir.x * moveSpeed * dt;
          const nextZ = room.playerRig.root.position.z + _moveDir.z * moveSpeed * dt;
          const [cx, cz] = clampPlayerRoomPosition(nextX, nextZ);
          room.playerRig.root.position.x = cx;
          room.playerRig.root.position.z = cz;

          const targetYaw = Math.atan2(_moveDir.x, _moveDir.z);
          room.playerRig.root.rotation.y +=
            shortestAngleDiff(room.playerRig.root.rotation.y, targetYaw) *
            Math.min(1, dt * 12);

          walkPhase += dt * 10.5;
          playerAnimMode = 'walk';
        } else if (autoWalkTargetRef.current.active && state.activeObject) {
          const target = autoWalkTargetRef.current;
          const dx = target.x - room.playerRig.root.position.x;
          const dz = target.z - room.playerRig.root.position.z;
          const dist = Math.hypot(dx, dz);

          if (dist > 0.09) {
            const speed = 1.75;
            const [cx, cz] = clampPlayerRoomPosition(
              room.playerRig.root.position.x + (dx / dist) * speed * dt,
              room.playerRig.root.position.z + (dz / dist) * speed * dt
            );
            room.playerRig.root.position.x = cx;
            room.playerRig.root.position.z = cz;
            const moveYaw = Math.atan2(dx, dz);
            room.playerRig.root.rotation.y +=
              shortestAngleDiff(room.playerRig.root.rotation.y, moveYaw) *
              Math.min(1, dt * 10);
            walkPhase += dt * 10;
            playerAnimMode = 'walk';
          } else {
            const lookYaw = Math.atan2(
              target.lookX - room.playerRig.root.position.x,
              target.lookZ - room.playerRig.root.position.z
            );
            room.playerRig.root.rotation.y +=
              shortestAngleDiff(room.playerRig.root.rotation.y, lookYaw) *
              Math.min(1, dt * 9);
            playerAnimMode =
              state.activeObject === 'wall_poster' && state.uvTorchActive
                ? 'uv_shine'
                : 'inspect';
          }
        }
      }

      updateCharacterAnimation(room.playerRig, playerAnimMode, dt, elapsed, walkPhase);

      // 5. Smooth camera preset glide & 360-degree rotational pan inside Room 307
      const pan = panStateRef.current;
      const inFreePanMode =
        state.phase === 'ROOM_INVESTIGATION' && !state.activeObject;

      const desiredFov = inFreePanMode ? pan.targetFov : INSPECT_FOV;
      pan.currentFov = THREE.MathUtils.damp(pan.currentFov, desiredFov, 8, dt);
      if (Math.abs(camera.fov - pan.currentFov) > 0.01) {
        camera.fov = pan.currentFov;
        camera.updateProjectionMatrix();
      }

      if (inFreePanMode) {
        _targetCamPos.set(...OVERVIEW_POS);
        camera.position.lerp(_targetCamPos, 1 - Math.exp(-5.5 * dt));

        pan.currentYaw = THREE.MathUtils.damp(pan.currentYaw, pan.targetYaw, 11, dt);
        pan.currentPitch = THREE.MathUtils.damp(pan.currentPitch, pan.targetPitch, 11, dt);

        const cosP = Math.cos(pan.currentPitch);
        _targetLookAt.set(
          camera.position.x + cosP * Math.sin(pan.currentYaw) * 2.0,
          camera.position.y + Math.sin(pan.currentPitch) * 2.0,
          camera.position.z - cosP * Math.cos(pan.currentYaw) * 2.0
        );
        _currentLookAt.lerp(_targetLookAt, 1 - Math.exp(-14 * dt));
        camera.lookAt(_currentLookAt);
      } else {
        _targetCamPos.set(...cameraGlideRef.current.pos);
        _targetLookAt.set(...cameraGlideRef.current.target);
        const speedK = state.phase === 'INTRO' ? 0.8 : 5.2;
        const factor = 1 - Math.exp(-speedK * dt);
        camera.position.lerp(_targetCamPos, factor);
        _currentLookAt.lerp(_targetLookAt, factor);
        camera.lookAt(_currentLookAt);
      }

      // 6. Living Room Environment (Rain, Curtains, Lightning, Vibrating Phone, Hover Ring)
      // Rain falling outside window
      for (let i = 0; i < room.rainSeeds.length; i++) {
        const seed = room.rainSeeds[i];
        const y = 0.7 - (((elapsed * seed.speed + i * 0.17) % 1.4));
        _rainDummy.position.set(seed.x, y, seed.z);
        _rainDummy.rotation.z = 0.08;
        _rainDummy.updateMatrix();
        room.rainMesh.setMatrixAt(i, _rainDummy.matrix);
      }
      room.rainMesh.instanceMatrix.needsUpdate = true;

      // Subtle window curtain sway
      room.curtainLeftPivot.rotation.z = Math.sin(elapsed * 1.15) * 0.035 + 0.02;
      room.curtainRightPivot.rotation.z = Math.sin(elapsed * 1.15 + 1.1) * 0.035 - 0.02;

      // Occasional distant lightning flash (~22s cycle)
      const stormCycle = elapsed % 22;
      let lightningPower = 0;
      if (stormCycle > 18.0 && stormCycle < 18.14) lightningPower = 1.0;
      else if (stormCycle > 18.22 && stormCycle < 18.42) lightningPower = 0.55;
      room.lightningLight.intensity = THREE.MathUtils.damp(
        room.lightningLight.intensity,
        lightningPower * 4.2,
        18,
        dt
      );
      room.nightBackdropMat.color.lerpColors(
        _nightColor,
        _lightningNightColor,
        Math.min(1, room.lightningLight.intensity / 4.2)
      );

      // Scripted story event trigger detection
      const trig = state.storyTriggers;
      if (trig.phoneBuzzCount !== lastTriggers.phoneBuzzCount) {
        phoneBuzzTimer = 1.6;
        lastTriggers.phoneBuzzCount = trig.phoneBuzzCount;
      }
      if (trig.doorShadowCount !== lastTriggers.doorShadowCount) {
        doorShadowTimer = 3.0;
        lastTriggers.doorShadowCount = trig.doorShadowCount;
      }
      if (trig.lightFlickerCount !== lastTriggers.lightFlickerCount) {
        lightFlickerTimer = 1.45;
        lastTriggers.lightFlickerCount = trig.lightFlickerCount;
      }
      if (trig.handleNudgeCount !== lastTriggers.handleNudgeCount) {
        handleNudgeTimer = 1.35;
        lastTriggers.handleNudgeCount = trig.handleNudgeCount;
      }

      if (phoneBuzzTimer > 0) {
        phoneBuzzTimer = Math.max(0, phoneBuzzTimer - dt);
        room.studyPhoneGroup.position.x = 0.28 + Math.sin(elapsed * 65) * 0.004;
        room.studyPhoneGroup.position.z = 0.22 + Math.cos(elapsed * 58) * 0.003;
        room.studyPhoneScreenMat.emissiveIntensity = 1.65;
      } else {
        room.studyPhoneGroup.position.x = 0.28;
        room.studyPhoneGroup.position.z = 0.22;
        const unreadGlow = state.phoneUnreadCount > 0 ? 0.68 + Math.sin(elapsed * 3.5) * 0.22 : 0.28;
        room.studyPhoneScreenMat.emissiveIntensity = unreadGlow;
      }

      // Hover focus floor ring highlight
      const hoverMat = room.hoverRingMesh.material as THREE.MeshBasicMaterial;
      if (state.hoveredObject && !state.activeObject && state.phase !== 'INTRO') {
        const anchor = ROOM_OBJECTS[state.hoveredObject].hotspotAnchor;
        room.hoverRingMesh.position.x = THREE.MathUtils.damp(
          room.hoverRingMesh.position.x,
          anchor[0],
          12,
          dt
        );
        room.hoverRingMesh.position.z = THREE.MathUtils.damp(
          room.hoverRingMesh.position.z,
          Math.min(2.35, Math.max(-2.35, anchor[2])),
          12,
          dt
        );
        hoverMat.opacity = THREE.MathUtils.damp(hoverMat.opacity, 0.45, 10, dt);
      } else {
        hoverMat.opacity = THREE.MathUtils.damp(hoverMat.opacity, 0, 10, dt);
      }

      // 7. Persistent Interactive Prop States (retained throughout room exploration)
      const targetDrawerZ = state.puzzle1Completed ? 0.34 : 0.02;
      room.deskDrawerPivot.position.z = THREE.MathUtils.damp(
        room.deskDrawerPivot.position.z,
        targetDrawerZ,
        6,
        dt
      );
      room.drawerKeyMesh.visible = !state.puzzle1Completed;
      room.drawerPaperMesh.visible = !state.puzzle1Completed;
      room.deskDrawerLedMat.color.copy(state.puzzle1Completed ? _ledUnlockedGreen : _ledLockedAmber);
      room.deskDrawerLedMat.emissive.copy(
        state.puzzle1Completed ? _ledUnlockedGreen : _ledLockedAmber
      );

      const targetShelfDoorRot =
        state.bookshelfUnlockedWithKey || state.puzzle2Completed ? -1.42 : 0;
      room.bookshelfDoorPivot.rotation.y = THREE.MathUtils.damp(
        room.bookshelfDoorPivot.rotation.y,
        targetShelfDoorRot,
        5,
        dt
      );
      room.uvTorchInShelf.visible = !state.puzzle2Completed;
      room.bookshelfLedMat.color.copy(state.puzzle2Completed ? _ledUnlockedGreen : _ledLockedAmber);
      room.bookshelfLedMat.emissive.copy(
        state.puzzle2Completed ? _ledUnlockedGreen : _ledLockedAmber
      );

      // Bookshelf 4 books visually persist in player's current sorted order
      state.persistentBookOrder.forEach((bookId, slotIndex) => {
        const mesh = room.bookshelfBooks[bookId];
        if (!mesh) return;
        const targetX = BOOK_SLOT_X[slotIndex] ?? 0;
        mesh.position.x = THREE.MathUtils.damp(mesh.position.x, targetX, 8, dt);
      });

      // Wardrobe persists open once opened
      const targetWardrobeRot =
        state.wardrobeOpened || state.activeObject === 'wardrobe' ? 0.92 : 0.14;
      room.wardrobeDoorPivot.rotation.y = THREE.MathUtils.damp(
        room.wardrobeDoorPivot.rotation.y,
        targetWardrobeRot,
        4.5,
        dt
      );

      // Backpack front pocket persists unzipped
      const targetBagPocketRot = state.backpackUnzipped ? 0.56 : 0;
      room.backpackPocketPivot.rotation.x = THREE.MathUtils.damp(
        room.backpackPocketPivot.rotation.x,
        targetBagPocketRot,
        6,
        dt
      );

      // Bed pillow persists lifted/shifted aside
      room.bedPillowMesh.position.x = THREE.MathUtils.damp(
        room.bedPillowMesh.position.x,
        state.bedPillowLifted ? 0.14 : 0,
        5,
        dt
      );
      room.bedPillowMesh.position.y = THREE.MathUtils.damp(
        room.bedPillowMesh.position.y,
        state.bedPillowLifted ? 0.63 : 0.57,
        5,
        dt
      );
      room.bedPillowMesh.position.z = THREE.MathUtils.damp(
        room.bedPillowMesh.position.z,
        state.bedPillowLifted ? -0.45 : -0.68,
        5,
        dt
      );
      room.bedPillowMesh.rotation.z = THREE.MathUtils.damp(
        room.bedPillowMesh.rotation.z,
        state.bedPillowLifted ? -0.22 : 0,
        5,
        dt
      );

      // Exit Door status LED
      room.exitDoorLedMat.color.copy(
        state.puzzle3Completed ? _ledUnlockedGreen : _ledLockedRed
      );
      room.exitDoorLedMat.emissive.copy(
        state.puzzle3Completed ? _ledUnlockedGreen : _ledLockedRed
      );

      // UV Torch lighting & hidden Wall Poster UV reveal
      const uvMat = room.posterUvOverlay.material as THREE.MeshBasicMaterial;
      const targetUvOpacity = state.uvTorchActive ? 0.96 : 0;
      uvMat.opacity = THREE.MathUtils.damp(uvMat.opacity, targetUvOpacity, 7, dt);
      room.uvSpotLight.intensity = THREE.MathUtils.damp(
        room.uvSpotLight.intensity,
        state.uvTorchActive ? 5.5 : 0,
        7,
        dt
      );
      if (state.uvTorchActive && state.uvAimNormalized) {
        room.uvSpotLight.target.position.set(
          -2.9,
          1.75 + (0.5 - state.uvAimNormalized.y) * 1.0,
          -0.4 + (state.uvAimNormalized.x - 0.5) * 0.8
        );
      } else {
        room.uvSpotLight.target.position.set(-2.9, 1.75, -0.4);
      }

      // Controlled Room Lighting & Dynamic Warden Threat Flicker
      room.deskLampLight.intensity = 2.55 + Math.sin(elapsed * 4.2) * 0.06;
      const threatInspectFlicker =
        (state.wardenState === 'INSPECTING_DOOR' || state.wardenState === 'IMMINENT_ARRIVAL') &&
        Math.sin(elapsed * 19.0) > 0.94;
      if (lightFlickerTimer > 0 || threatInspectFlicker) {
        if (lightFlickerTimer > 0) lightFlickerTimer = Math.max(0, lightFlickerTimer - dt);
        const flickerVal = Math.sin(elapsed * 42) > 0.15 ? 0.25 : 1.05;
        room.roomFillLight.intensity = flickerVal;
        room.tubeGlassMat.emissiveIntensity = flickerVal * 0.5;
      } else {
        room.roomFillLight.intensity = THREE.MathUtils.damp(room.roomFillLight.intensity, 1.05, 8, dt);
        room.tubeGlassMat.emissiveIntensity = THREE.MathUtils.damp(
          room.tubeGlassMat.emissiveIntensity,
          0.55,
          8,
          dt
        );
      }
      room.corridorTubeLight.intensity =
        state.phase === 'INTRO' || state.phase === 'VICTORY'
          ? 1.85 + (Math.sin(elapsed * 21) > 0.82 ? -1.1 : 0)
          : state.wardenState === 'INSPECTING_DOOR' || state.wardenState === 'IMMINENT_ARRIVAL'
            ? 1.35 + (Math.sin(elapsed * 17) > 0.78 ? -0.8 : 0)
            : 0.75;

      // Victory: Exit door swings wide open & Warden approaches down corridor
      const targetDoorRot = state.phase === 'VICTORY' ? -1.68 : 0;
      room.exitDoorPivot.rotation.y = THREE.MathUtils.damp(
        room.exitDoorPivot.rotation.y,
        targetDoorRot,
        3.8,
        dt
      );
      if (state.phase === 'VICTORY') {
        room.wardenCorridorFigure.position.z = THREE.MathUtils.damp(
          room.wardenCorridorFigure.position.z,
          6.8,
          0.55,
          dt
        );
      } else {
        const threatWardenZ: Record<WardenThreatState, number> = {
          DORMANT: 9.8,
          APPROACHING: 7.4,
          OUTSIDE_ROOM: 4.1,
          INSPECTING_DOOR: 3.15,
          IMMINENT_ARRIVAL: 2.82,
          ARRIVED: 2.7,
        };
        room.wardenCorridorFigure.position.z = THREE.MathUtils.damp(
          room.wardenCorridorFigure.position.z,
          threatWardenZ[state.wardenState] ?? 8.8,
          1.4,
          dt
        );
        room.wardenCorridorFigure.position.x =
          state.wardenState === 'OUTSIDE_ROOM' || state.wardenState === 'INSPECTING_DOOR'
            ? Math.sin(elapsed * 1.4) * 0.18
            : 0;
      }

      // Dynamic Warden Threat & Failure Events: Door handle rattles & shadow darkens under threshold
      const shadowMat = room.wardenUnderDoorShadow.material as THREE.MeshBasicMaterial;
      if (doorShadowTimer > 0) doorShadowTimer = Math.max(0, doorShadowTimer - dt);
      if (handleNudgeTimer > 0) handleNudgeTimer = Math.max(0, handleNudgeTimer - dt);

      if (state.phase === 'FAILURE' || state.wardenState === 'ARRIVED') {
        room.exitHandlePivot.rotation.z = Math.sin(elapsed * 22) * 0.22;
        shadowMat.opacity = THREE.MathUtils.damp(shadowMat.opacity, 0.85, 4, dt);
      } else {
        const imminentTwitch =
          state.wardenState === 'IMMINENT_ARRIVAL' && Math.sin(elapsed * 2.4) > 0.72
            ? Math.sin(elapsed * 20) * 0.11
            : 0;
        const targetHandleZ =
          handleNudgeTimer > 0 ? Math.sin(elapsed * 18) * 0.15 : imminentTwitch;
        room.exitHandlePivot.rotation.z = THREE.MathUtils.damp(
          room.exitHandlePivot.rotation.z,
          targetHandleZ,
          12,
          dt
        );
        const threatBaseShadow =
          state.wardenState === 'IMMINENT_ARRIVAL'
            ? 0.65
            : state.wardenState === 'INSPECTING_DOOR'
              ? 0.44
              : state.wardenState === 'OUTSIDE_ROOM'
                ? 0.24
                : 0;
        const targetShadowOpacity = Math.max(
          threatBaseShadow,
          doorShadowTimer > 0 ? 0.62 : 0
        );
        shadowMat.opacity = THREE.MathUtils.damp(shadowMat.opacity, targetShadowOpacity, 5, dt);
      }

      renderer.render(scene, camera);

      // Sync Web Audio 3D listener orientation (~10Hz) so hallway footsteps & door knocks pan with 360° look
      const nowMs = performance.now();
      if (nowMs - lastAudioPoseSync > 95) {
        lastAudioPoseSync = nowMs;
        camera.getWorldDirection(_audioForward);
        soundEngine.updateListenerPose(
          [camera.position.x, camera.position.y, camera.position.z],
          [_audioForward.x, _audioForward.y, _audioForward.z]
        );
      }

      // 7. Project 3D hotspot anchors to 2D overlay coords (~20Hz)
      if (state.showHotspots && state.phase !== 'INTRO' && nowMs - lastPinSync > 50) {
        lastPinSync = nowMs;
        const cw = container?.clientWidth || window.innerWidth;
        const ch = container?.clientHeight || window.innerHeight;
        const nextPins: ProjectedPin[] = ROOM_OBJECT_ORDER.map((id) => {
          const anchor = ROOM_OBJECTS[id].hotspotAnchor;
          _scratchVec.set(anchor[0], anchor[1], anchor[2]);
          _scratchVec.project(camera);
          const x = ((_scratchVec.x + 1) / 2) * cw;
          const y = ((-_scratchVec.y + 1) / 2) * ch;
          const inBounds = x >= 24 && x <= cw - 24 && y >= 72 && y <= ch - 108;
          const visible = _scratchVec.z > -1 && _scratchVec.z < 1 && inBounds;
          return { id, x, y, visible };
        });
        setPins(nextPins);
      }

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerCancel);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      envTarget.dispose();
      room.disposables.forEach((d) => d.dispose());
      renderer.dispose();
      if (canvas.parentNode === container) {
        container.removeChild(canvas);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#060810]">
      {/* Stable WebGL Mount Container */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Graceful fallback if WebGL context cannot initialize */}
      {webglFallback && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#090c14] p-6 text-center">
          <p className="font-display text-2xl font-bold text-amber-300">
            Room 307 · Visual Fallback Mode
          </p>
          <p className="mt-2 max-w-md text-sm text-slate-300">
            WebGL hardware acceleration is unavailable. Use the Room Objects list below to inspect
            every clue and complete all three locks.
          </p>
        </div>
      )}

      {/* Interactive 3D Hotspot Pins Layer */}
      {showHotspots && phase !== 'INTRO' && phase !== 'VICTORY' && phase !== 'FAILURE' && (
        <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
          {pins.map((pin) => {
            if (!pin.visible) return null;
            const meta = ROOM_OBJECTS[pin.id];
            const isInspected = inspectedObjects.includes(pin.id);
            const isActive = activeObject === pin.id;
            const isHovered = hoveredObject === pin.id;

            return (
              <button
                key={pin.id}
                type="button"
                onClick={() => onSelectObject(pin.id)}
                onMouseEnter={() => onHoverObject(pin.id)}
                onMouseLeave={() => onHoverObject(null)}
                style={{
                  transform: `translate3d(${pin.x}px, ${pin.y}px, 0) translate(-50%, -50%)`,
                }}
                aria-label={`Inspect ${meta.name}`}
                className={`pointer-events-auto absolute left-0 top-0 flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-amber-400 ${
                  isActive
                    ? 'border-amber-400 bg-amber-500 text-slate-950 shadow-lg'
                    : isHovered
                      ? 'border-amber-300/80 bg-[#141925] text-amber-200'
                      : isInspected
                        ? 'border-emerald-500/45 bg-[#0c111b]/90 text-emerald-300'
                        : 'border-white/20 bg-[#0b0f18]/88 text-slate-100 hover:border-amber-400/70 hover:text-amber-200'
                }`}
              >
                <span className="whitespace-nowrap">{meta.name}</span>
                {isInspected && <span className="text-[10px] opacity-80">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
