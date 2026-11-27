import type { Effect, Intensity } from "./config";

/**
 * Tiny canvas particle engine for seasonal effects. Draws behind nothing and catches no clicks;
 * the caller puts the canvas in a pointer-events:none layer. Returns a stop function.
 */
type P = { x: number; y: number; r: number; vx: number; vy: number; rot: number; vr: number; phase: number; colour: string };

const PALETTES: Record<Exclude<Effect, "none">, string[]> = {
  snow: ["#ffffff"],
  confetti: ["#ffffff", "#f5c542", "#e5484d", "#3e63dd", "#30a46c", "#0a0a0a"],
  hearts: ["#e5484d", "#ff8fa3", "#ffffff"],
  sparkles: ["#f5c542", "#ffe8a3", "#ffffff"],
};

const DENSITY: Record<Intensity, number> = { light: 0.45, medium: 1, heavy: 1.8 };

export function startParticles(canvas: HTMLCanvasElement, effect: Exclude<Effect, "none">, intensity: Intensity): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};
  const palette = PALETTES[effect];
  let w = 0;
  let h = 0;
  let particles: P[] = [];
  let frame = 0;
  let last = performance.now();

  const make = (anywhere: boolean): P => {
    const base = effect === "snow" ? 1.2 + Math.random() * 2.6 : effect === "sparkles" ? 2 + Math.random() * 3 : effect === "hearts" ? 5 + Math.random() * 6 : 3 + Math.random() * 3;
    return {
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : -20 - Math.random() * 40,
      r: base,
      vx: (Math.random() - 0.5) * (effect === "confetti" ? 40 : 18),
      vy: effect === "sparkles" ? 8 + Math.random() * 14 : effect === "hearts" ? 22 + Math.random() * 22 : 28 + base * 14 + Math.random() * 20,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * (effect === "confetti" ? 6 : 1.2),
      phase: Math.random() * Math.PI * 2,
      colour: palette[Math.floor(Math.random() * palette.length)],
    };
  };

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Scale the count with the area so phones stay light.
    const target = Math.round(Math.min(220, ((w * h) / 9000) * DENSITY[intensity]) * (effect === "hearts" ? 0.35 : effect === "sparkles" ? 0.5 : 1));
    particles = Array.from({ length: Math.max(8, target) }, () => make(true));
  };

  const heart = (s: number) => {
    ctx.beginPath();
    ctx.moveTo(0, s * 0.35);
    ctx.bezierCurveTo(-s, -s * 0.35, -s * 0.45, -s * 1.1, 0, -s * 0.5);
    ctx.bezierCurveTo(s * 0.45, -s * 1.1, s, -s * 0.35, 0, s * 0.35);
    ctx.fill();
  };

  const star = (s: number) => {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const rr = i % 2 ? s * 0.28 : s;
      const a = (i * Math.PI) / 4;
      ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
  };

  const tick = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    ctx.clearRect(0, 0, w, h);
    for (const p of particles) {
      p.phase += dt * 1.6;
      p.x += (p.vx + Math.sin(p.phase) * (effect === "snow" ? 14 : 8)) * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      if (p.y > h + 20 || p.x < -30 || p.x > w + 30) Object.assign(p, make(false));

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.colour;
      if (effect === "snow") {
        // A soft dark halo keeps white flakes visible on the light pages too.
        ctx.shadowColor = "rgba(0,0,0,0.28)";
        ctx.shadowBlur = 3;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(0, 0, p.r, 0, Math.PI * 2);
        ctx.fill();
      } else if (effect === "confetti") {
        ctx.globalAlpha = 0.9;
        ctx.scale(1, Math.cos(p.phase * 2));
        ctx.fillRect(-p.r, -p.r * 0.45, p.r * 2, p.r * 0.9);
      } else if (effect === "hearts") {
        ctx.globalAlpha = 0.8;
        heart(p.r);
      } else {
        ctx.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(p.phase * 1.5));
        ctx.shadowColor = p.colour;
        ctx.shadowBlur = 6;
        star(p.r);
      }
      ctx.restore();
    }
    frame = requestAnimationFrame(tick);
  };

  resize();
  window.addEventListener("resize", resize);
  frame = requestAnimationFrame(tick);
  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener("resize", resize);
    ctx.clearRect(0, 0, w, h);
  };
}
