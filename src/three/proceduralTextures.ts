import * as THREE from 'three';

function createCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

function configureColorTexture(
  canvas: HTMLCanvasElement,
  maxAnisotropy: number,
  repeatX = 1,
  repeatY = 1
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  if (repeatX !== 1 || repeatY !== 1) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
  }
  tex.needsUpdate = true;
  return tex;
}

export function createTerrazzoFloorTexture(maxAnisotropy: number): {
  map: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  const [canvas, ctx] = createCanvas(512, 512);
  ctx.fillStyle = '#33373f';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle tile grid (4x4 mosaic slabs)
  ctx.strokeStyle = 'rgba(15, 18, 24, 0.65)';
  ctx.lineWidth = 4;
  for (let i = 0; i <= 4; i++) {
    const pos = i * 128;
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, 512);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(512, pos);
    ctx.stroke();
  }

  // Terrazzo stone chips
  const chipColors = ['#535a66', '#23272e', '#6f6b63', '#424752', '#7d786f'];
  for (let i = 0; i < 650; i++) {
    ctx.fillStyle = chipColors[i % chipColors.length];
    const x = (Math.sin(i * 12.9898) * 43758.5453 - Math.floor(Math.sin(i * 12.9898) * 43758.5453)) * 512;
    const y = (Math.sin(i * 78.233) * 43758.5453 - Math.floor(Math.sin(i * 78.233) * 43758.5453)) * 512;
    const size = 2 + (i % 5);
    ctx.fillRect(x, y, size, size * 0.8);
  }

  const [rCanvas, rCtx] = createCanvas(256, 256);
  rCtx.fillStyle = '#a8a8a8';
  rCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 300; i++) {
    const shade = 120 + (i % 60);
    rCtx.fillStyle = `rgb(${shade},${shade},${shade})`;
    const x = ((i * 73) % 256);
    const y = ((i * 137) % 256);
    rCtx.fillRect(x, y, 8, 8);
  }

  const roughnessMap = new THREE.CanvasTexture(rCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(3, 3);
  roughnessMap.needsUpdate = true;

  return {
    map: configureColorTexture(canvas, maxAnisotropy, 3, 3),
    roughnessMap,
  };
}

export function createPlasterWallTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(512, 512);
  ctx.fillStyle = '#5d6269';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle hostel plaster variation & bottom scuff gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, 'rgba(30, 35, 45, 0.25)');
  grad.addColorStop(0.7, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(1, 'rgba(18, 22, 28, 0.45)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 900; i++) {
    const x = ((i * 193) % 512);
    const y = ((i * 311) % 512);
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)';
    ctx.fillRect(x, y, 14, 10);
  }

  return configureColorTexture(canvas, maxAnisotropy, 2, 1);
}

export function createWoodTexture(
  baseHex: string,
  grainHex: string,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(256, 256);
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = grainHex;
  for (let y = 0; y < 256; y += 4) {
    ctx.lineWidth = 1 + (y % 3 === 0 ? 1 : 0);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(85, y + Math.sin(y * 0.08) * 4, 170, y - Math.cos(y * 0.06) * 4, 256, y);
    ctx.stroke();
  }

  return configureColorTexture(canvas, maxAnisotropy);
}

export function createClockTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(512, 512);
  const cx = 256;
  const cy = 256;

  ctx.fillStyle = '#e7e2d4';
  ctx.fillRect(0, 0, 512, 512);

  // Outer dial ring
  ctx.strokeStyle = '#20242c';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(cx, cy, 228, 0, Math.PI * 2);
  ctx.stroke();

  // Hour markers and numerals
  ctx.fillStyle = '#181b22';
  ctx.font = '700 42px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let h = 1; h <= 12; h++) {
    const angle = ((h - 3) * Math.PI) / 6;
    const tx = cx + Math.cos(angle) * 172;
    const ty = cy + Math.sin(angle) * 172;
    ctx.fillText(String(h), tx, ty);
  }

  // 60 subtle minute marks + 12 hour marks
  for (let m = 0; m < 60; m++) {
    const a = ((m - 15) * Math.PI) / 30;
    const isHour = m % 5 === 0;
    ctx.strokeStyle = isHour ? '#20242c' : 'rgba(51,57,68,0.45)';
    ctx.lineWidth = isHour ? 6 : 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * (isHour ? 202 : 212), cy + Math.sin(a) * (isHour ? 202 : 212));
    ctx.lineTo(cx + Math.cos(a) * 222, cy + Math.sin(a) * 222);
    ctx.stroke();
  }

  // Highlight ring around 7 (fixed puzzle alarm marker)
  ctx.strokeStyle = 'rgba(220, 38, 38, 0.55)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(
    cx + Math.cos(((7 - 3) * Math.PI) / 6) * 172,
    cy + Math.sin(((7 - 3) * Math.PI) / 6) * 172,
    30,
    0,
    Math.PI * 2
  );
  ctx.stroke();

  ctx.fillStyle = '#991b1b';
  ctx.font = '700 18px monospace';
  ctx.fillText('ALARM SET: 7:00', cx, cy + 88);

  return configureColorTexture(canvas, maxAnisotropy);
}

export function createWallPosterTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(512, 680);

  // Deep midnight indigo background
  const bg = ctx.createLinearGradient(0, 0, 0, 680);
  bg.addColorStop(0, '#0c162d');
  bg.addColorStop(0.6, '#132445');
  bg.addColorStop(1, '#0b1222');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 680);

  // Subtle cream framing border
  ctx.strokeStyle = 'rgba(226, 207, 165, 0.45)';
  ctx.lineWidth = 6;
  ctx.strokeRect(20, 20, 472, 640);

  // Faint concentric astrolabe arcs
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
  ctx.lineWidth = 2;
  for (let r = 80; r <= 200; r += 60) {
    ctx.beginPath();
    ctx.arc(256, 260, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Exactly TWO prominent golden stars ("2 stars on the wall poster")
  const drawStar = (cx: number, cy: number, outerR: number, innerR: number) => {
    ctx.save();
    ctx.fillStyle = '#fbbf24';
    ctx.shadowColor = 'rgba(251, 191, 36, 0.7)';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const a = (i * Math.PI) / 5 - Math.PI / 2;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  drawStar(165, 225, 42, 18);
  drawStar(347, 225, 42, 18);

  // Connecting faint constellation line
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
  ctx.setLineDash([6, 6]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(165, 225);
  ctx.lineTo(347, 225);
  ctx.stroke();
  ctx.setLineDash([]);

  // Poster Typography
  ctx.fillStyle = '#e2cfa5';
  ctx.textAlign = 'center';
  ctx.font = '700 22px Georgia, serif';
  ctx.fillText('ASTRONOMY SOCIETY · NIT', 256, 86);

  ctx.fillStyle = '#f8fafc';
  ctx.font = '700 28px Georgia, serif';
  ctx.fillText('THE STARS GUIDE', 256, 480);
  ctx.fillText('THOSE WHO STAY AWAKE', 256, 520);

  ctx.fillStyle = 'rgba(226, 207, 165, 0.7)';
  ctx.font = '500 16px monospace';
  ctx.fillText('OBSERVATORY ARCHIVE · BLOCK C', 256, 588);

  return configureColorTexture(canvas, maxAnisotropy);
}

export function createPosterUvLayerTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(512, 680);
  ctx.clearRect(0, 0, 512, 680);

  // Subtle UV glowing border
  ctx.strokeStyle = 'rgba(192, 132, 252, 0.75)';
  ctx.lineWidth = 4;
  ctx.strokeRect(36, 36, 440, 608);

  ctx.fillStyle = '#e9d5ff';
  ctx.font = '700 20px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('UV INK DETECTED · SEQUENCE', 256, 132);

  // Draw the 4 arrows clearly in a row: UP -> RIGHT -> DOWN -> LEFT
  const dirs = [
    { label: '1. UP', angle: -Math.PI / 2, x: 108 },
    { label: '2. RIGHT', angle: 0, x: 206 },
    { label: '3. DOWN', angle: Math.PI / 2, x: 304 },
    { label: '4. LEFT', angle: Math.PI, x: 402 },
  ];

  dirs.forEach((d) => {
    ctx.save();
    ctx.translate(d.x, 345);
    ctx.rotate(d.angle);
    ctx.strokeStyle = '#f3e8ff';
    ctx.fillStyle = '#d8b4fe';
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 18;
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(-24, 0);
    ctx.lineTo(22, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(8, -14);
    ctx.lineTo(24, 0);
    ctx.lineTo(8, 14);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#e9d5ff';
    ctx.font = '700 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(d.label, d.x, 405);
  });

  return configureColorTexture(canvas, maxAnisotropy);
}

export function createCalendarTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(512, 600);
  ctx.fillStyle = '#f2ede2';
  ctx.fillRect(0, 0, 512, 600);

  // Red top header
  ctx.fillStyle = '#991b1b';
  ctx.fillRect(0, 0, 512, 128);

  ctx.fillStyle = '#fef2f2';
  ctx.font = '700 40px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('NOVEMBER', 256, 66);
  ctx.font = '600 20px monospace';
  ctx.fillText('END-SEMESTER FINAL NIGHT', 256, 102);

  // Grid lines
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  const startY = 175;
  const colW = 64;
  const rowH = 62;
  const offsetX = 32;

  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  ctx.fillStyle = '#475569';
  ctx.font = '700 18px monospace';
  days.forEach((d, i) => {
    ctx.fillText(d, offsetX + i * colW + colW / 2, 158);
  });

  let dayNum = 1;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 7; c++) {
      if (dayNum > 30) break;
      const x = offsetX + c * colW;
      const y = startY + r * rowH;
      ctx.strokeRect(x, y, colW, rowH);

      ctx.fillStyle = dayNum === 13 ? '#991b1b' : '#1e293b';
      ctx.font = dayNum === 13 ? '700 24px monospace' : '500 20px monospace';
      ctx.fillText(String(dayNum), x + colW / 2, y + 36);

      if (dayNum === 13) {
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x + colW / 2, y + 31, 24, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
      }
      dayNum++;
    }
  }

  ctx.fillStyle = '#991b1b';
  ctx.font = '700 19px sans-serif';
  ctx.fillText('WARDEN SWEEP: 12:00 AM', 256, 540);
  ctx.fillStyle = '#475569';
  ctx.font = '600 15px monospace';
  ctx.fillText('OLDEST -> NEWEST EDITIONS', 256, 570);

  return configureColorTexture(canvas, maxAnisotropy);
}

export function createLetterTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(380, 480);
  ctx.fillStyle = '#f5eedc';
  ctx.fillRect(0, 0, 380, 480);

  ctx.strokeStyle = 'rgba(180, 160, 120, 0.35)';
  for (let y = 60; y < 440; y += 28) {
    ctx.beginPath();
    ctx.moveTo(28, y);
    ctx.lineTo(352, y);
    ctx.stroke();
  }

  ctx.fillStyle = '#1f2937';
  ctx.font = 'italic 600 20px Georgia, serif';
  ctx.fillText('Dear Resident,', 36, 78);
  ctx.font = '15px Georgia, serif';
  ctx.fillText('Count what teaches you,', 36, 134);
  ctx.fillText('what guides you,', 36, 164);
  ctx.fillText('and what tells you time.', 36, 194);
  ctx.fillText('Three locks stand between', 36, 250);
  ctx.fillText('you and freedom.', 36, 280);
  ctx.fillStyle = '#991b1b';
  ctx.font = '700 15px monospace';
  ctx.fillText('THE WARDEN IS COMING.', 36, 362);

  return configureColorTexture(canvas, maxAnisotropy);
}

export function createDoorPlateTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(256, 128);
  ctx.fillStyle = '#926d27';
  ctx.fillRect(0, 0, 256, 128);
  ctx.strokeStyle = '#4a350e';
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 240, 112);

  ctx.fillStyle = '#1f1606';
  ctx.textAlign = 'center';
  ctx.font = '700 20px monospace';
  ctx.fillText('HOSTEL BLOCK C', 128, 44);
  ctx.font = '700 48px Georgia, serif';
  ctx.fillText('307', 128, 98);

  return configureColorTexture(canvas, maxAnisotropy);
}

export function createBookSpineTexture(
  colorHex: string,
  codeLabel: string,
  year: number,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(128, 512);
  ctx.fillStyle = colorHex;
  ctx.fillRect(0, 0, 128, 512);

  // Gold spine bands
  ctx.fillStyle = '#e5c16c';
  ctx.fillRect(10, 44, 108, 10);
  ctx.fillRect(10, 456, 108, 10);

  ctx.fillStyle = '#f8fafc';
  ctx.textAlign = 'center';
  ctx.font = '700 28px monospace';
  ctx.fillText(codeLabel, 64, 140);
  ctx.font = '700 24px monospace';
  ctx.fillText(String(year), 64, 390);

  return configureColorTexture(canvas, maxAnisotropy);
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(256, 256);
  const grad = ctx.createRadialGradient(128, 128, 12, 128, 128, 124);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.72)');
  grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.32)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function drawHexagon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  fill: string | null,
  stroke: string
): void {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 - Math.PI / 6;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 3;
  ctx.stroke();
}

export function createOwaspShirtTexture(
  maxAnisotropy: number,
  isBack = false
): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(512, 512);
  // Crisp dark charcoal-navy cotton tee
  ctx.fillStyle = '#111622';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle fabric weave vertical lines
  ctx.fillStyle = 'rgba(255,255,255,0.025)';
  for (let x = 0; x < 512; x += 6) {
    ctx.fillRect(x, 0, 2, 512);
  }

  // Collar trim
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(256, 12, 86, 0, Math.PI);
  ctx.fill();

  // Blue accent stripes on shoulders
  ctx.fillStyle = '#4f73d9';
  ctx.fillRect(0, 0, 22, 512);
  ctx.fillRect(490, 0, 22, 512);

  // Bold OWASP lettering
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = '900 92px sans-serif';
  ctx.fillText('OWASP', 256, isBack ? 195 : 175);

  ctx.fillStyle = '#6b91f2';
  ctx.font = '700 24px monospace';
  ctx.fillText(isBack ? 'STUDENT CHAPTER · 307' : 'HOSTEL SECURITY LAB', 256, isBack ? 245 : 220);

  // Mini hex-wasp emblem below text
  const cy = isBack ? 340 : 322;
  drawHexagon(ctx, 256, cy - 38, 22, '#4f73d9', '#ffffff');
  drawHexagon(ctx, 222, cy + 18, 22, '#4f73d9', '#ffffff');
  drawHexagon(ctx, 290, cy + 18, 22, '#0a0d14', '#ffffff');
  ctx.beginPath();
  ctx.arc(256, cy, 26, 0, Math.PI * 2);
  ctx.fillStyle = '#07090e';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Stylized white wasp silhouette
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(256, cy + 3, 7, 13, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(244, cy - 4, 11, 4, -0.3, 0, Math.PI * 2);
  ctx.ellipse(264, cy + 6, 4, 11, 0.2, 0, Math.PI * 2);
  ctx.fill();

  return configureColorTexture(canvas, maxAnisotropy);
}

export function createCharacterFaceTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(256, 256);
  ctx.fillStyle = '#c88d68';
  ctx.fillRect(0, 0, 256, 256);

  // Eyebrows
  ctx.fillStyle = '#18181b';
  ctx.fillRect(66, 86, 36, 8);
  ctx.fillRect(154, 86, 36, 8);

  // Eyes
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(84, 110, 14, 10, 0, 0, Math.PI * 2);
  ctx.ellipse(172, 110, 14, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#111827';
  ctx.beginPath();
  ctx.arc(84, 110, 6.5, 0, Math.PI * 2);
  ctx.arc(172, 110, 6.5, 0, Math.PI * 2);
  ctx.fill();

  // Nose shadow
  ctx.fillStyle = 'rgba(110, 60, 35, 0.45)';
  ctx.fillRect(122, 118, 12, 28);

  // Determined slight mouth
  ctx.strokeStyle = '#5c3322';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(106, 174);
  ctx.quadraticCurveTo(128, 180, 150, 172);
  ctx.stroke();

  return configureColorTexture(canvas, maxAnisotropy);
}

export function createClubLogoTexture(maxAnisotropy: number): THREE.Texture {
  // Draw instant procedural fallback first so texture is immediately valid, then swap in attached PNG
  const [canvas, ctx] = createCanvas(512, 512);
  ctx.fillStyle = '#040508';
  ctx.fillRect(0, 0, 512, 512);

  const offsets: Array<[number, number, string | null]> = [
    [-70, -110, null],
    [70, -110, '#5173e6'],
    [-135, 0, '#5173e6'],
    [135, 0, '#5173e6'],
    [-70, 110, '#5173e6'],
    [70, 110, null],
  ];
  offsets.forEach(([ox, oy, fill]) => {
    drawHexagon(ctx, 256 + ox, 256 + oy, 64, fill, '#ffffff');
  });

  ctx.beginPath();
  ctx.arc(256, 256, 100, 0, Math.PI * 2);
  ctx.fillStyle = '#040508';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 8;
  ctx.stroke();

  const tex = configureColorTexture(canvas, maxAnisotropy);

  const loader = new THREE.ImageLoader();
  loader.load(
    '/assets/aistudio/Screenshot_2026-11-13_at_4.36.56_PM_b98e5be5.png',
    (img) => {
      ctx.clearRect(0, 0, 512, 512);
      ctx.drawImage(img, 0, 0, 512, 512);
      tex.needsUpdate = true;
    },
    undefined,
    () => {
      // Keep procedural fallback if image fails to load
    }
  );

  return tex;
}

