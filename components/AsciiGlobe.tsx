'use client';

import { useEffect, useRef } from 'react';

// 72×36 world map  (row 0 = 90°N, col 0 = 0°E)
const WORLD = [
  '000000000000000000000000000000000000000000000000000000000000000000000000',
  '000000000000000000001111111111111111111111111111111110000000000000000000',
  '000000000000001111111111111111111111111111111111111111000000000001100000',
  '000000000001111111111111111111111111111111111111111111000001111111110000',
  '000000011111111111111111111100001111111111111111111111011111111111110000',
  '000000111111111111111111110000000011111111111111111111011111111111100000',
  '000001111111111111111111000000000001111111111111111111000111111111110000',
  '000001111111111111111110000000000001111111111111111110000011111111110000',
  '000001111111111111111000000000000001111111111111111110000001111111110000',
  '000001111111111111110000000000000001111111111111111100000000111111110000',
  '000000111111111111000000000000000001111111111111111110000000001111110000',
  '000000011111111100000000000000000001111111111111111100000000000011100000',
  '000000001111111000000000000000000001111111111111111000000000000000000000',
  '000000001111100000000000000000000001111111111111110000000000000000000000',
  '000000000111000000000000000000000001111111111111110000000000000000000000',
  '000000000110000000000000000000000001111111111111110001100000000000000000',
  '000000001100000000000000000000001111111111111111111001111000000000000000',
  '000000001100000000000000000000001111111111111100001001111100000000000000',
  '000000001110000000000000000000001111111111110000000000111110000000000000',
  '000000001111000000000000000000001111111110000000000000111110000000000000',
  '000000001111000000000000000000001111111000000000000000011111000000000000',
  '000000001111000000000000000000001111100000000000000000001111100000000000',
  '000000001110000000000000000000001111000000000000000000001111100000000000',
  '000000000110000000000000000000001100000000000000000000001111000000000000',
  '000000000110000000000000000000001100000000000000000000000110000000000000',
  '000000000010000000000000000000000000000000000000000000000100000000000000',
  '000000000010000000000000000000000000000000000000000000000000000000000000',
  '000000000000000000000000000000000000000000000000000000000000000000000000',
  '000000000000000000000000000000000000000000000000000000000000000000000000',
  '000000000000000000000000000000000000000000000000000000000000000000000000',
  '000000000000000000000000000000000000000000000000000000000000000000000000',
  '001100000000000000000000000000001100000000000000000001111000000000000000',
  '011111111111111111111111111111111111111111111111111111111111111110000000',
  '011111111111111111111111111111111111111111111111111111111111111111100000',
  '001111111111111111111111111111111111111111111111111111111111111111100000',
  '000000000000000000000000000000000000000000000000000000000000000000000000',
];
const ROWS = WORLD.length;
const COLS = WORLD[0].length;

function landAt(lat: number, lon: number): boolean {
  const row = Math.floor(((Math.PI / 2 - lat) / Math.PI) * ROWS);
  const col = Math.floor((((lon % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2) * COLS);
  return WORLD[Math.max(0, Math.min(ROWS - 1, row))]?.[Math.max(0, Math.min(COLS - 1, col))] === '1';
}

// pre-build static grid once (slightly denser)
const LAT_N = 44; 
const STATIC_PTS: { lat: number; lon0: number; land: boolean }[] = [];
for (let li = 0; li < LAT_N; li++) {
  const lat = -Math.PI / 2 + ((li + 0.5) / LAT_N) * Math.PI;
  const lonN = Math.max(1, Math.round(84 * Math.cos(lat)));
  for (let lo = 0; lo < lonN; lo++) {
    const lon0 = (lo / lonN) * Math.PI * 2;
    STATIC_PTS.push({ lat, lon0, land: landAt(lat, lon0) });
  }
}

export function AsciiGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ── resize ─────────────────────────────────────────────────────────────
    const onResize = () => {
      const p = canvas.parentElement;
      if (!p) return;
      const s = Math.min(p.clientWidth, p.clientHeight);
      canvas.width = s;
      canvas.height = s;
    };
    onResize();
    const ro = new ResizeObserver(onResize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    // ── mouse magnetic tracking ─────────────────────────────────────────────
    let mouseX = -1000;
    let mouseY = -1000;
    let isHovering = false;

    // We keep track of average distance of mouse to the globe to boost the background glow
    let targetGlowIntensity = 0;
    let currentGlowIntensity = 0;

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      isHovering = true;
    };
    const onMouseLeave = () => {
      isHovering = false;
      targetGlowIntensity = 0;
    };

    const parent = canvas.parentElement;
    if (parent) {
      parent.addEventListener('mousemove', onMouseMove);
      parent.addEventListener('mouseleave', onMouseLeave);
    }

    // ── animation ─────────────────────────────────────────────────────────
    let angle = 0;
    let prevTs = -1;
    const RPM = 1 / 20; // rotation speed

    let glowPhase = 0;

    const frame = (ts: number) => {
      const dt = prevTs < 0 ? 0 : Math.min((ts - prevTs) / 1000, 0.05);
      prevTs = ts;

      angle = (angle + Math.PI * 2 * RPM * dt) % (Math.PI * 2);
      glowPhase = (glowPhase + dt * 0.7) % (Math.PI * 2);

      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const R = W * 0.43; // globe pixel radius
      const cx = W / 2;
      const cy = H / 2;

      // Calculate magnetic glow intensity
      if (isHovering) {
        const dx = mouseX - cx;
        const dy = mouseY - cy;
        const distToCenter = Math.sqrt(dx * dx + dy * dy);
        targetGlowIntensity = Math.max(0, 1 - distToCenter / (R * 1.5)); // Glow when near globe
      }
      currentGlowIntensity += (targetGlowIntensity - currentGlowIntensity) * 0.1; // lerp

      // ── draw background glow pulse ────────────────────────────────────────
      const baseGlowPulse = 0.55 + 0.2 * Math.sin(glowPhase);
      const glowAlpha = (baseGlowPulse + currentGlowIntensity * 0.45).toFixed(2);
      const glowR = R * (1.15 + 0.08 * Math.sin(glowPhase) + currentGlowIntensity * 0.15); // expands on hover
      
      const grad = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, glowR);
      grad.addColorStop(0, `rgba(120,160,255,${glowAlpha})`);
      grad.addColorStop(0.55, `rgba(80,100,255,0.18)`);
      grad.addColorStop(1, `rgba(59,91,255,0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
      ctx.fill();

      // ── point projection & magnetic pull ─────────────────────────────────
      type PP = { sx: number; sy: number; z: number; land: boolean; front: boolean };
      
      const MAX_PULL_RADIUS = R * 0.65; // how far the magnet reaches (px)
      const MAX_PULL_STRENGTH = 0.85; // % of distance the dot will move towards cursor

      const all: PP[] = STATIC_PTS.map(({ lat, lon0, land }) => {
        const lon = lon0 + angle; // apply Y-axis spin
        
        // standard spherical -> 3D cartesian
        const cosLat = Math.cos(lat);
        const x3 = cosLat * Math.cos(lon);
        const y3 = Math.sin(lat);
        const z3 = cosLat * Math.sin(lon);

        // orthographic 3D -> 2D
        let sx = cx + x3 * R;
        let sy = cy - y3 * R;

        // Apply magnetic pull to individual points
        // Only strongly pull points that are clearly on the front of the sphere (z3 > -0.2)
        if (isHovering && z3 > -0.2) {
          const dx = mouseX - sx;
          const dy = mouseY - sy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < MAX_PULL_RADIUS) {
            // Cubic falloff for force: 1 at center, 0 at edge
            const force = Math.pow(1 - dist / MAX_PULL_RADIUS, 3);
            
            // Limit the maximum physical pixel pull to prevent points collapsing into a singularity
            const pullAmount = dist * force * MAX_PULL_STRENGTH;
            
            if (dist > 0.1) {
              sx += (dx / dist) * pullAmount;
              sy += (dy / dist) * pullAmount;
            }
          }
        }

        return { sx, sy, z: z3, land, front: z3 >= 0 };
      });

      // Painter's algorithm
      all.sort((a, b) => a.z - b.z);

      // ── render points ───────────────────────────────────────────────────
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const hoverColorBoost = 1 + currentGlowIntensity * 0.6; // brighten chars on hover
      const scaleFont = Math.min(1, W / 500); // Scale down text on mobile

      for (const p of all) {
        const d = Math.abs(p.z); // depth: 0=edge, 1=center

        if (p.front) {
          const sz = Math.max(4, Math.round((10 + d * 9) * scaleFont)); // 10–19px front standard
          ctx.font = `${sz}px monospace`;

          if (p.land) {
            const a = Math.min(1, (0.55 + d * 0.45) * hoverColorBoost);
            ctx.fillStyle = `rgba(255,255,255,${a.toFixed(2)})`;
            ctx.fillText('©', p.sx, p.sy);
          } else {
            const a = Math.min(1, (0.18 + d * 0.22) * hoverColorBoost);
            ctx.fillStyle = `rgba(210,225,255,${a.toFixed(2)})`;
            ctx.fillText('○', p.sx, p.sy);
          }
        } else {
          const sz = Math.max(3, Math.round((7 + d * 5) * scaleFont)); // 7–12px back standard
          ctx.font = `${sz}px monospace`;

          if (p.land) {
            const a = (0.07 + d * 0.10) * hoverColorBoost;
            ctx.fillStyle = `rgba(255,255,255,${a.toFixed(2)})`;
            ctx.fillText('©', p.sx, p.sy);
          } else {
            const a = (0.02 + d * 0.05) * hoverColorBoost;
            ctx.fillStyle = `rgba(200,210,255,${a.toFixed(2)})`;
            ctx.fillText('○', p.sx, p.sy);
          }
        }
      }

      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);
    
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      if (parent) {
        parent.removeEventListener('mousemove', onMouseMove);
        parent.removeEventListener('mouseleave', onMouseLeave);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: '100%', height: '100%', cursor: 'crosshair' }}
      aria-hidden="true"
    />
  );
}
