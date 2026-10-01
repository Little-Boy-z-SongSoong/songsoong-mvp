import React, { useRef, useEffect } from 'react';

const BAR_COUNT = 80;
const CANVAS_HEIGHT = 80;
const LERP_SPEED = 0.15;

function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }
function softenColor(hex) {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return hex;
  const channels = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
  return `#${channels.map((channel) => Math.round(channel * 0.55 + 255 * 0.45).toString(16).padStart(2, '0')).join('')}`;
}

function getBarColor(pollution, ctx, barX, barHeight, canvasHeight, cityBarColors) {
  const colors = cityBarColors || { clean: '#4fc3f7', moderate: '#d4a748', severe: '#ef4444' };
  let color;
  if (pollution < 0.3) {
    color = colors.clean;
  } else if (pollution < 0.6) {
    color = colors.moderate;
  } else {
    color = colors.severe;
  }
  const grad = ctx.createLinearGradient(barX, canvasHeight, barX, canvasHeight - barHeight);
  color = softenColor(color);
  grad.addColorStop(0, color + '66');
  grad.addColorStop(1, color);
  return { grad, color };
}

export default function AudioVisualizer({ analyserData, pollution = 0, cityBarColors }) {
  const canvasRef = useRef(null);
  const prevHeightsRef = useRef(new Float32Array(BAR_COUNT));
  const animIdRef = useRef(null);
  const dataRef = useRef(analyserData);

  useEffect(() => { dataRef.current = analyserData; }, [analyserData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;

    function resize() {
      const parent = canvas.parentElement;
      const width = parent ? parent.clientWidth : 600;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${CANVAS_HEIGHT}px`;
      canvas.width = width * dpr;
      canvas.height = CANVAS_HEIGHT * dpr;
    }
    resize();
    window.addEventListener('resize', resize);

    const ctx = canvas.getContext('2d');

    function draw() {
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const data = dataRef.current;
      const prevHeights = prevHeightsRef.current;
      const gap = 1;
      const barWidth = Math.max(1, (width - (BAR_COUNT - 1) * gap) / BAR_COUNT);
      const halfHeight = height * 0.6;
      const reflectionHeight = height * 0.4;

      for (let i = 0; i < BAR_COUNT; i++) {
        let dbValue = -100;
        if (data?.length) {
          const sample = Math.min(data.length - 1, Math.floor(((i + 0.5) / BAR_COUNT) ** 1.65 * data.length));
          dbValue = data[sample];
        }
        const normalized = clamp((dbValue + 85) / 60, 0, 1);
        const targetHeight = normalized * halfHeight;
        const smoothedHeight = lerp(prevHeights[i] || 0, targetHeight, LERP_SPEED);
        prevHeights[i] = smoothedHeight;

        const barX = i * (barWidth + gap);
        const barY = halfHeight - smoothedHeight;
        const capRadius = Math.min(barWidth / 2, 3);
        if (smoothedHeight < 1) continue;

        const { grad, color } = getBarColor(pollution, ctx, barX, smoothedHeight, halfHeight, cityBarColors);

        ctx.save();
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(barX, halfHeight);
        ctx.lineTo(barX, barY + capRadius);
        ctx.arcTo(barX, barY, barX + capRadius, barY, capRadius);
        ctx.arcTo(barX + barWidth, barY, barX + barWidth, barY + capRadius, capRadius);
        ctx.lineTo(barX + barWidth, halfHeight);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Reflection
        const reflHeight = Math.min(smoothedHeight * 0.5, reflectionHeight);
        if (reflHeight > 1) {
          ctx.save();
          const reflGrad = ctx.createLinearGradient(barX, halfHeight, barX, halfHeight + reflHeight);
          reflGrad.addColorStop(0, color + '40');
          reflGrad.addColorStop(1, color + '00');
          ctx.fillStyle = reflGrad;
          ctx.fillRect(barX, halfHeight + 1, barWidth, reflHeight);
          ctx.restore();
        }
      }

      // Divider line
      ctx.save();
      ctx.globalAlpha = 0.08;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, halfHeight);
      ctx.lineTo(width, halfHeight);
      ctx.stroke();
      ctx.restore();

      ctx.restore();
      animIdRef.current = requestAnimationFrame(draw);
    }

    animIdRef.current = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener('resize', resize);
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
    };
  }, [pollution, cityBarColors]);

  return <canvas ref={canvasRef} className="w-full" style={{ height: CANVAS_HEIGHT }} />;
}
