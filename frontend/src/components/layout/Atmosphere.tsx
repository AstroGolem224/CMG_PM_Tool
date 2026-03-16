import { useEffect, useRef } from 'react';
import { useUIStore } from '@/stores/uiStore';

const particleColors: Record<string, string[]> = {
  ember: ['212,82,10', '201,151,42', '255,123,46', '255,180,80'],
  neon: ['13,232,245', '168,85,247', '34,211,160'],
  light: ['8,145,178', '124,58,237', '16,185,129'],
};

export default function Atmosphere() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const theme = useUIStore((state) => state.theme);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const mediaReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mediaMobile = window.matchMedia('(max-width: 768px)');
    if (mediaReduce.matches || mediaMobile.matches) {
      const context = canvas.getContext('2d');
      context?.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) return;

    const colors = particleColors[theme];
    let animationFrame = 0;
    const particles = Array.from({ length: 120 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() < 0.08 ? 2 + Math.random() * 3 : 0.3 + Math.random() * 1.5,
      vy: -(0.2 + Math.random() * 0.7),
      vx: (Math.random() - 0.5) * 0.5,
      opacity: 0.25 + Math.random() * 0.6,
      twinkle: 0.01 + Math.random() * 0.03,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const draw = () => {
      resize();
      context.clearRect(0, 0, canvas.width, canvas.height);

      for (const particle of particles) {
        particle.x += particle.vx / canvas.width;
        particle.y += particle.vy / canvas.height;
        particle.opacity += (Math.random() - 0.5) * particle.twinkle;
        particle.opacity = Math.max(0.2, Math.min(0.9, particle.opacity));

        if (particle.y < -0.05) {
          particle.y = 1.05;
          particle.x = Math.random();
        }
        if (particle.x < -0.05) particle.x = 1.05;
        if (particle.x > 1.05) particle.x = -0.05;

        const x = particle.x * canvas.width;
        const y = particle.y * canvas.height;
        const rgba = `rgba(${particle.color}, ${particle.opacity})`;

        context.beginPath();
        context.fillStyle = rgba;
        context.arc(x, y, particle.r, 0, Math.PI * 2);
        context.fill();

        if (particle.r > 2) {
          const gradient = context.createRadialGradient(x, y, 0, x, y, particle.r * 5);
          gradient.addColorStop(0, `rgba(${particle.color}, ${particle.opacity * 0.5})`);
          gradient.addColorStop(1, 'rgba(0,0,0,0)');
          context.fillStyle = gradient;
          context.beginPath();
          context.arc(x, y, particle.r * 5, 0, Math.PI * 2);
          context.fill();
        }

        context.strokeStyle = `rgba(${particle.color}, ${particle.opacity * 0.25})`;
        context.lineWidth = Math.max(0.5, particle.r * 0.4);
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x - particle.vx * 45, y - particle.vy * 18);
        context.stroke();
      }

      animationFrame = window.requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener('resize', resize);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resize);
    };
  }, [theme]);

  return (
    <>
      <canvas id="ember-canvas" ref={canvasRef} aria-hidden="true" />
      <div className="noise-overlay" aria-hidden="true" />
      <div className="scanlines" aria-hidden="true" />
    </>
  );
}
