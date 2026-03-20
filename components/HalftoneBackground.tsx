'use client';

import { useEffect, useRef } from 'react';

export function HalftoneBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999 });
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cvs = canvas;
    const gc = ctx;

    // Grid spacing — matches reference's dot density
    const GRID = 20;
    const MIN_R = 0.5;
    const MAX_R = 7.0;

    // Cursor influence
    const CURSOR_R = 200;

    function resize() {
      cvs.width = window.innerWidth;
      cvs.height = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        window.innerHeight
      );
    }
    resize();
    window.addEventListener('resize', resize);

    function onMove(e: MouseEvent) { mouse.current = { x: e.clientX, y: e.clientY }; }
    function onLeave() { mouse.current = { x: -9999, y: -9999 }; }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseleave', onLeave);

    // Smooth organic noise
    function smoothNoise(x: number, y: number, t: number) {
      return (
        Math.sin(x * 0.7 + t) * Math.cos(y * 0.5 - t * 0.8) * 0.5 +
        Math.sin(x * 1.3 - t * 0.5) * Math.sin(y * 1.1 + t * 0.6) * 0.3 +
        Math.cos(x * 0.4 + y * 0.6 + t * 0.3) * 0.2
      );
    }

    let t = 0;
    function draw() {
      t += 0.005;
      const W = cvs.width;
      const H = cvs.height;

      // Deep navy blue background
      gc.fillStyle = '#03001e';
      gc.fillRect(0, 0, W, H);

      // Subtle blue radial gradient overlay
      const radGrad = gc.createRadialGradient(W * 0.7, H * 0.15, 50, W * 0.7, H * 0.15, W * 0.8);
      radGrad.addColorStop(0, 'rgba(13,27,107,0.5)');
      radGrad.addColorStop(1, 'rgba(3,0,30,0)');
      gc.fillStyle = radGrad;
      gc.fillRect(0, 0, W, H);

      const cols = Math.ceil(W / GRID) + 2;
      const rows = Math.ceil(H / GRID) + 2;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const cx = col * GRID;
          const cy = row * GRID;

          const nx = cx / W;
          const ny = cy / H;

          // Diagonal gradient: bright top-right → dark bottom-left (matches reference)
          const diagGrad = nx * 0.65 + (1 - ny) * 0.35;

          const pulse = 0.04 * Math.sin(t * 0.8 + col * 0.02);
          const organic = smoothNoise(col * 0.18, row * 0.15, t * 0.2) * 0.1;

          let value = Math.max(0, Math.min(1, diagGrad + pulse + organic));
          value = Math.pow(value, 1.5);

          // Cursor glow
          const dx = cx - mouse.current.x;
          const dy = cy - mouse.current.y;
          const dc = Math.sqrt(dx * dx + dy * dy);
          if (dc < CURSOR_R) {
            const cursorBoost = (1 - dc / CURSOR_R) ** 2 * 0.65;
            value = Math.min(1, value + cursorBoost);
          }

          const r = MIN_R + value * (MAX_R - MIN_R);
          if (r < MIN_R + 0.1) continue;

          const alpha = 0.1 + value * 0.85;

          gc.beginPath();
          gc.arc(cx, cy, r, 0, Math.PI * 2);

          // RING STYLE — like the ASCII globe in the reference
          // Larger dots = ring, smaller dots = filled
          if (r > MAX_R * 0.45) {
            // Hollow ring for large bright dots
            gc.strokeStyle = `rgba(160,216,239,${alpha.toFixed(3)})`;
            gc.lineWidth = Math.max(0.8, r * 0.35);
            gc.stroke();
          } else {
            // Solid fill for smaller dots
            gc.fillStyle = `rgba(120,190,230,${(alpha * 0.7).toFixed(3)})`;
            gc.fill();
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 -z-10"
      style={{ display: 'block', top: 0, left: 0 }}
      aria-hidden="true"
    />
  );
}
