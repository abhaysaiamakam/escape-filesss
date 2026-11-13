import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { soundEngine } from '../../audio/soundEngine';
import { GamePhase, WardenThreatState } from '../../types/game';
import { GraphicsQuality } from '../../types/platform';
import {
  buildRadioStationRoom,
  RadioStationHandles,
  Scene3DObjectPreset,
} from '../../three/radioStationBuilder';
import { ArchiveRoomHandles, buildUndergroundArchiveRoom } from '../../three/archiveRoomBuilder';

interface Generic3DViewportProps {
  sceneKind: 'radio' | 'archive';
  phase: GamePhase;
  objects: Record<string, Scene3DObjectPreset>;
  objectOrder: string[];
  activeObject: string | null;
  hoveredObject: string | null;
  onHoverObject: (id: string | null) => void;
  onSelectObject: (id: string) => void;
  puzzle1Completed: boolean;
  puzzle2Completed: boolean;
  puzzle3Completed: boolean;
  wardenState: WardenThreatState;
  inspectedObjects: string[];
  cameraResetTrigger: number;
  showHotspots: boolean;
  graphicsQuality: GraphicsQuality;
  frequencyDialProgress?: number; // 0..1 for Medium dial animation
}

interface ProjectedPin {
  id: string;
  x: number;
  y: number;
  visible: boolean;
}

const _scratchVec = new THREE.Vector3();
const _audioForward = new THREE.Vector3();
const _targetCamPos = new THREE.Vector3();
const _targetLookAt = new THREE.Vector3();
const _currentLookAt = new THREE.Vector3();
const _greenColor = new THREE.Color(0x10b981);
const _amberColor = new THREE.Color(0xf59e0b);
const _redColor = new THREE.Color(0xef4444);

const OVERVIEW_POS: [number, number, number] = [0.1, 1.62, 0.55];
const OVERVIEW_TARGET: [number, number, number] = [-0.25, 1.32, -1.45];
const OVERVIEW_YAW = Math.atan2(
  OVERVIEW_TARGET[0] - OVERVIEW_POS[0],
  -(OVERVIEW_TARGET[2] - OVERVIEW_POS[2])
);
const OVERVIEW_PITCH = Math.atan2(
  OVERVIEW_TARGET[1] - OVERVIEW_POS[1],
  Math.hypot(OVERVIEW_TARGET[0] - OVERVIEW_POS[0], OVERVIEW_TARGET[2] - OVERVIEW_POS[2])
);

export const Generic3DViewport: React.FC<Generic3DViewportProps> = ({
  sceneKind,
  phase,
  objects,
  objectOrder,
  activeObject,
  hoveredObject,
  onHoverObject,
  onSelectObject,
  puzzle1Completed,
  puzzle2Completed,
  puzzle3Completed,
  wardenState,
  inspectedObjects,
  cameraResetTrigger,
  showHotspots,
  graphicsQuality,
  frequencyDialProgress = 0.25,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglFallback, setWebglFallback] = useState(false);
  const [pins, setPins] = useState<ProjectedPin[]>([]);

  const propsRef = useRef({
    phase,
    objects,
    objectOrder,
    activeObject,
    hoveredObject,
    onHoverObject,
    onSelectObject,
    puzzle1Completed,
    puzzle2Completed,
    puzzle3Completed,
    wardenState,
    showHotspots,
    frequencyDialProgress,
  });
  propsRef.current = {
    phase,
    objects,
    objectOrder,
    activeObject,
    hoveredObject,
    onHoverObject,
    onSelectObject,
    puzzle1Completed,
    puzzle2Completed,
    puzzle3Completed,
    wardenState,
    showHotspots,
    frequencyDialProgress,
  };

  const panStateRef = useRef({
    targetYaw: OVERVIEW_YAW,
    currentYaw: OVERVIEW_YAW,
    targetPitch: OVERVIEW_PITCH,
    currentPitch: OVERVIEW_PITCH,
    targetFov: 62,
    currentFov: 62,
    lastActiveObject: null as string | null,
  });

  const cameraGlideRef = useRef<{
    pos: [number, number, number];
    target: [number, number, number];
  }>({
    pos: OVERVIEW_POS,
    target: OVERVIEW_TARGET,
  });

  useEffect(() => {
    if (phase === 'VICTORY') {
      cameraGlideRef.current = {
        pos: [0.3, 1.55, 0.7],
        target: [0.45, 1.32, 3.6],
      };
      return;
    }
    if (phase === 'FAILURE') {
      cameraGlideRef.current = {
        pos: [0.1, 1.28, 0.9],
        target: [0.45, 1.05, 2.75],
      };
      return;
    }
    if (activeObject && objects[activeObject]) {
      const meta = objects[activeObject];
      panStateRef.current.lastActiveObject = activeObject;
      cameraGlideRef.current = {
        pos: meta.cameraPosition,
        target: meta.cameraTarget,
      };
    } else {
      const prevObj = panStateRef.current.lastActiveObject;
      if (prevObj && objects[prevObj]) {
        const look = objects[prevObj].cameraTarget;
        const dx = look[0] - OVERVIEW_POS[0];
        const dy = look[1] - OVERVIEW_POS[1];
        const dz = look[2] - OVERVIEW_POS[2];
        const yaw = Math.atan2(dx, -dz);
        const pitch = THREE.MathUtils.clamp(
          Math.atan2(dy, Math.hypot(dx, dz)),
          -0.52,
          0.56
        );
        panStateRef.current.targetYaw = yaw;
        panStateRef.current.currentYaw = yaw;
        panStateRef.current.targetPitch = pitch;
        panStateRef.current.currentPitch = pitch;
        panStateRef.current.lastActiveObject = null;
      }
      cameraGlideRef.current = {
        pos: OVERVIEW_POS,
        target: OVERVIEW_TARGET,
      };
    }
  }, [activeObject, phase, objects]);

  useEffect(() => {
    if (cameraResetTrigger === 0) return;
    panStateRef.current.targetYaw = OVERVIEW_YAW;
    panStateRef.current.targetPitch = OVERVIEW_PITCH;
    panStateRef.current.targetFov = 62;
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
        antialias: !isSoftwareGl && graphicsQuality === 'high',
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglFallback(true);
      return;
    }

    const canvas = renderer.domElement;
    const onLost = (e: Event) => {
      e.preventDefault();
      setWebglFallback(true);
    };
    const onRestored = () => setWebglFallback(false);
    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('webglcontextrestored', onRestored);

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(
      isSoftwareGl || graphicsQuality === 'balanced' ? 1 : Math.min(window.devicePixelRatio, 2)
    );

    const w0 = container.clientWidth || window.innerWidth;
    const h0 = container.clientHeight || window.innerHeight;
    renderer.setSize(w0, h0);
    container.appendChild(canvas);

    const scene = new THREE.Scene();
    const bgHex = sceneKind === 'radio' ? 0x050912 : 0x090705;
    scene.background = new THREE.Color(bgHex);
    scene.fog = new THREE.FogExp2(bgHex, 0.032);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envTarget.texture;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(62, w0 / h0, 0.1, 40);
    camera.position.set(...OVERVIEW_POS);
    _currentLookAt.set(...OVERVIEW_TARGET);
    camera.lookAt(_currentLookAt);
    canvas.style.touchAction = 'none';
    canvas.style.cursor = 'grab';

    const radioHandles: RadioStationHandles | null =
      sceneKind === 'radio' ? buildRadioStationRoom(scene, isSoftwareGl) : null;
    const archiveHandles: ArchiveRoomHandles | null =
      sceneKind === 'archive' ? buildUndergroundArchiveRoom(scene, isSoftwareGl) : null;

    const hitTargets = radioHandles?.hitTargets ?? archiveHandles?.hitTargets ?? [];
    const disposables = radioHandles?.disposables ?? archiveHandles?.disposables ?? [];

    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    const pointerNdc = new THREE.Vector2();
    let lastHoverCheck = 0;
    let isDragging = false;
    let activePointerId: number | null = null;
    let lastPointer = { x: 0, y: 0 };
    let dragDistance = 0;

    const updatePointer = (cx: number, cy: number) => {
      const rect = canvas.getBoundingClientRect();
      pointerNdc.x = ((cx - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((cy - rect.top) / rect.height) * 2 + 1;
    };

    const pickObject = (): string | null => {
      if (propsRef.current.phase === 'INTRO') return null;
      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects(hitTargets, false);
      return hits.length > 0 ? (hits[0].object.userData.objectId as string) ?? null : null;
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
        // Ignore
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

        if (!propsRef.current.activeObject && propsRef.current.phase === 'ROOM_INVESTIGATION') {
          panStateRef.current.targetYaw -= dx * 0.0052;
          panStateRef.current.targetPitch = THREE.MathUtils.clamp(
            panStateRef.current.targetPitch + dy * 0.0038,
            -0.52,
            0.56
          );
        }
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

    const finishDrag = (e: PointerEvent, allowClick: boolean) => {
      if (!isDragging) return;
      if (activePointerId !== null && e.pointerId !== activePointerId) return;
      isDragging = false;
      try {
        if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
      activePointerId = null;
      if (propsRef.current.phase === 'INTRO') return;
      updatePointer(e.clientX, e.clientY);
      const hit = pickObject();
      canvas.style.cursor = hit ? 'pointer' : 'grab';
      if (allowClick && dragDistance <= 7 && hit) {
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
        40,
        74
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

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const status = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (status === gl.UNSIGNALED) {
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
      const st = propsRef.current;

      // Camera smooth pan or preset glide
      const pan = panStateRef.current;
      const inFreePan = st.phase === 'ROOM_INVESTIGATION' && !st.activeObject;
      const desiredFov = inFreePan ? pan.targetFov : 54;
      pan.currentFov = THREE.MathUtils.damp(pan.currentFov, desiredFov, 8, dt);
      if (Math.abs(camera.fov - pan.currentFov) > 0.01) {
        camera.fov = pan.currentFov;
        camera.updateProjectionMatrix();
      }

      if (inFreePan) {
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
        const factor = 1 - Math.exp(-5.2 * dt);
        camera.position.lerp(_targetCamPos, factor);
        _currentLookAt.lerp(_targetLookAt, factor);
        camera.lookAt(_currentLookAt);
      }

      // Scene-specific animations
      if (radioHandles) {
        radioHandles.reelLeft.rotation.y += dt * (st.puzzle1Completed ? 2.4 : 0.4);
        radioHandles.reelRight.rotation.y += dt * (st.puzzle1Completed ? 2.4 : 0.4);
        const pulse = 0.55 + Math.sin(elapsed * 4.5) * 0.45;
        radioHandles.beaconLight.intensity =
          st.wardenState === 'INSPECTING_DOOR' || st.wardenState === 'IMMINENT_ARRIVAL'
            ? 0.4 + pulse * 2.1
            : 0.5 + pulse * 0.7;

        radioHandles.circuitLedMat.color.copy(st.puzzle1Completed ? _greenColor : _redColor);
        radioHandles.circuitLedMat.emissive.copy(st.puzzle1Completed ? _greenColor : _redColor);
        radioHandles.oscilloscopeMat.emissiveIntensity = st.puzzle2Completed
          ? 1.15
          : st.puzzle1Completed
            ? 0.65 + Math.sin(elapsed * 8) * 0.25
            : 0.22;

        // Analog dial needle position synced with state
        radioHandles.dialNeedle.position.x = THREE.MathUtils.damp(
          radioHandles.dialNeedle.position.x,
          -0.93 + st.frequencyDialProgress * 0.62,
          8,
          dt
        );

        radioHandles.doorLedMat.color.copy(st.puzzle3Completed ? _greenColor : _redColor);
        radioHandles.doorLedMat.emissive.copy(st.puzzle3Completed ? _greenColor : _redColor);
        radioHandles.exitDoorPivot.rotation.y = THREE.MathUtils.damp(
          radioHandles.exitDoorPivot.rotation.y,
          st.phase === 'VICTORY' ? -1.55 : 0,
          3.8,
          dt
        );

        const threatFlicker =
          (st.wardenState === 'INSPECTING_DOOR' || st.wardenState === 'IMMINENT_ARRIVAL') &&
          Math.sin(elapsed * 21) > 0.88;
        radioHandles.tubeLight.intensity = threatFlicker ? 0.5 : 2.35;
        radioHandles.stairShadowPlaneMat.opacity =
          st.phase === 'FAILURE'
            ? 0.85
            : st.wardenState === 'IMMINENT_ARRIVAL'
              ? 0.6
              : st.wardenState === 'INSPECTING_DOOR'
                ? 0.38
                : 0;

        if (st.phase === 'FAILURE' || st.wardenState === 'IMMINENT_ARRIVAL') {
          radioHandles.exitHandlePivot.rotation.z = Math.sin(elapsed * 20) * 0.14;
        } else {
          radioHandles.exitHandlePivot.rotation.z = 0;
        }

        const rHoverMat = radioHandles.hoverRing.material as THREE.MeshBasicMaterial;
        if (st.hoveredObject && !st.activeObject && st.objects[st.hoveredObject]) {
          const a = st.objects[st.hoveredObject].hotspotAnchor;
          radioHandles.hoverRing.position.x = a[0];
          radioHandles.hoverRing.position.z = Math.min(2.4, Math.max(-2.4, a[2]));
          rHoverMat.opacity = 0.45;
        } else {
          rHoverMat.opacity = 0;
        }
      }

      if (archiveHandles) {
        archiveHandles.dustMotes.rotation.y = elapsed * 0.04;
        archiveHandles.cipherDiscMesh.rotation.y += dt * (st.puzzle1Completed ? 0.5 : 0.12);
        archiveHandles.alcoveDoorPivot.rotation.y = THREE.MathUtils.damp(
          archiveHandles.alcoveDoorPivot.rotation.y,
          st.puzzle1Completed ? 1.05 : 0,
          4.5,
          dt
        );
        archiveHandles.vaultWheelPivot.rotation.z = THREE.MathUtils.damp(
          archiveHandles.vaultWheelPivot.rotation.z,
          st.puzzle3Completed ? Math.PI * 1.5 : st.puzzle2Completed ? 0.65 : 0,
          3.5,
          dt
        );
        archiveHandles.vaultDoorPivot.rotation.y = THREE.MathUtils.damp(
          archiveHandles.vaultDoorPivot.rotation.y,
          st.phase === 'VICTORY' ? -1.42 : 0,
          3.2,
          dt
        );
        archiveHandles.vaultStatusLedMat.color.copy(
          st.puzzle3Completed ? _greenColor : st.puzzle2Completed ? _amberColor : _redColor
        );
        archiveHandles.vaultStatusLedMat.emissive.copy(
          st.puzzle3Completed ? _greenColor : st.puzzle2Completed ? _amberColor : _redColor
        );

        const sputter =
          (st.wardenState === 'INSPECTING_DOOR' || st.wardenState === 'IMMINENT_ARRIVAL') &&
          Math.sin(elapsed * 18) > 0.9;
        archiveHandles.bankerLight.intensity = sputter
          ? 0.9
          : 2.55 + Math.sin(elapsed * 3.1) * 0.08;
        archiveHandles.grateShadowMat.opacity =
          st.phase === 'FAILURE'
            ? 0.85
            : st.wardenState === 'IMMINENT_ARRIVAL'
              ? 0.55
              : 0;

        const aHoverMat = archiveHandles.hoverRing.material as THREE.MeshBasicMaterial;
        if (st.hoveredObject && !st.activeObject && st.objects[st.hoveredObject]) {
          const a = st.objects[st.hoveredObject].hotspotAnchor;
          archiveHandles.hoverRing.position.x = a[0];
          archiveHandles.hoverRing.position.z = Math.min(2.4, Math.max(-2.4, a[2]));
          aHoverMat.opacity = 0.45;
        } else {
          aHoverMat.opacity = 0;
        }
      }

      renderer.render(scene, camera);

      const nowMs = performance.now();
      if (nowMs - lastAudioPoseSync > 95) {
        lastAudioPoseSync = nowMs;
        camera.getWorldDirection(_audioForward);
        soundEngine.updateListenerPose(
          [camera.position.x, camera.position.y, camera.position.z],
          [_audioForward.x, _audioForward.y, _audioForward.z]
        );
      }

      if (st.showHotspots && st.phase !== 'INTRO' && nowMs - lastPinSync > 50) {
        lastPinSync = nowMs;
        const cw = container?.clientWidth || window.innerWidth;
        const ch = container?.clientHeight || window.innerHeight;
        const nextPins: ProjectedPin[] = st.objectOrder.map((id) => {
          const anchor = st.objects[id]?.hotspotAnchor ?? [0, 1, 0];
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

      if (isSoftwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
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
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      envTarget.dispose();
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      if (canvas.parentNode === container) container.removeChild(canvas);
    };
  }, [sceneKind, graphicsQuality]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#060810]">
      <div ref={mountRef} className="h-full w-full" />

      {webglFallback && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#090d16] p-6 text-center">
          <p className="font-display text-2xl font-bold text-amber-300">
            {sceneKind === 'radio' ? 'Radio Bunker · 2D Console Fallback' : 'Underground Archive · 2D Fallback'}
          </p>
          <p className="mt-2 max-w-md text-sm text-slate-300">
            Use the Objects panel below to inspect every interactive item cleanly.
          </p>
        </div>
      )}

      {showHotspots && phase !== 'INTRO' && phase !== 'VICTORY' && phase !== 'FAILURE' && (
        <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
          {pins.map((pin) => {
            if (!pin.visible) return null;
            const meta = objects[pin.id];
            if (!meta) return null;
            const isHovered = hoveredObject === pin.id;
            const isInspected = inspectedObjects.includes(pin.id);

            return (
              <button
                key={pin.id}
                type="button"
                onClick={() => onSelectObject(pin.id)}
                onMouseEnter={() => onHoverObject(pin.id)}
                onMouseLeave={() => onHoverObject(null)}
                style={{ transform: `translate(${pin.x}px, ${pin.y}px) translate(-50%, -50%)` }}
                className={`pointer-events-auto absolute left-0 top-0 flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold shadow-lg transition-colors whitespace-nowrap ${
                  isHovered
                    ? 'border-amber-300 bg-amber-500 text-slate-950'
                    : isInspected
                      ? 'border-emerald-400/45 bg-[#0c1a16]/90 text-emerald-200 hover:border-amber-300'
                      : 'border-white/25 bg-[#0a0f18]/90 text-slate-100 hover:border-amber-300'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isHovered ? 'bg-slate-950' : isInspected ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                />
                <span>{meta.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
