import { useEffect, useMemo, useRef, useState } from "react";
import { useMotionValueEvent } from "framer-motion";

function drawFallback(ctx, width, height, progress, dpr) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#050505");
  gradient.addColorStop(0.48, "#101010");
  gradient.addColorStop(1, "#160606");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const glow = ctx.createRadialGradient(width * 0.72, height * 0.3, 0, width * 0.72, height * 0.3, width * 0.35);
  glow.addColorStop(0, `rgba(183,28,28,${0.32 + progress * 0.1})`);
  glow.addColorStop(1, "rgba(183,28,28,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  const grid = Math.max(48, Math.round(width / 18));
  for (let x = 0; x < width; x += grid) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += grid) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  const centerX = width / 2;
  const centerY = height * 0.58;
  const truckWidth = width * 0.42;
  const truckHeight = height * 0.16;
  const robotHeight = height * (0.34 + progress * 0.18);
  const robotWidth = width * (0.16 + progress * 0.08);

  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.lineWidth = 2;

  if (progress < 0.5) {
    ctx.fillRect(centerX - truckWidth / 2, centerY - truckHeight / 2, truckWidth, truckHeight);
    ctx.strokeRect(centerX - truckWidth / 2, centerY - truckHeight / 2, truckWidth, truckHeight);
    ctx.fillRect(centerX - truckWidth * 0.18, centerY - truckHeight * 0.95, truckWidth * 0.36, truckHeight * 0.45);
    ctx.strokeRect(centerX - truckWidth * 0.18, centerY - truckHeight * 0.95, truckWidth * 0.36, truckHeight * 0.45);
  } else {
    ctx.fillRect(centerX - robotWidth / 2, centerY - robotHeight * 0.88, robotWidth, robotHeight * 0.55);
    ctx.strokeRect(centerX - robotWidth / 2, centerY - robotHeight * 0.88, robotWidth, robotHeight * 0.55);
    ctx.fillRect(centerX - robotWidth * 0.65, centerY - robotHeight * 0.62, robotWidth * 0.28, robotHeight * 0.58);
    ctx.fillRect(centerX + robotWidth * 0.37, centerY - robotHeight * 0.62, robotWidth * 0.28, robotHeight * 0.58);
    ctx.fillRect(centerX - robotWidth * 0.34, centerY - robotHeight * 0.02, robotWidth * 0.24, robotHeight * 0.72);
    ctx.fillRect(centerX + robotWidth * 0.1, centerY - robotHeight * 0.02, robotWidth * 0.24, robotHeight * 0.72);
  }

  ctx.font = "600 12px Rajdhani, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.42)";
  ctx.fillText("FALLBACK MODE // ADD 1.jpg ... 204.jpg TO public/images/transformer-sequence", 24, height - 32);

  ctx.restore();
}

export function TransformerScrollCanvas({ scrollYProgress, totalFrames, imageFolderPath }) {
  const canvasRef = useRef(null);
  const frameImagesRef = useRef([]);
  const progressRef = useRef(0);
  const [status, setStatus] = useState({ loaded: 0, failed: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0, dpr: 1 });

  const hasSequence = useMemo(() => status.loaded > 12, [status.loaded]);

  useEffect(() => {
    let cancelled = false;
    frameImagesRef.current = new Array(totalFrames);

    for (let frame = 1; frame <= totalFrames; frame += 1) {
      const image = new Image();
      image.decoding = "async";
      image.src = `${imageFolderPath}/${frame}.jpg`;
      image.onload = () => {
        if (cancelled) {
          return;
        }

        frameImagesRef.current[frame - 1] = image;
        setStatus((current) => ({ ...current, loaded: current.loaded + 1 }));
      };
      image.onerror = () => {
        if (cancelled) {
          return;
        }

        setStatus((current) => ({ ...current, failed: current.failed + 1 }));
      };
    }

    return () => {
      cancelled = true;
    };
  }, [imageFolderPath, totalFrames]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    function updateCanvasSize() {
      const parent = canvas.parentElement;
      if (!parent) {
        return;
      }

      const width = parent.clientWidth;
      const height = parent.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      setCanvasSize({ width, height, dpr });
    }

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);

  function render(progress) {
    const canvas = canvasRef.current;
    if (!canvas || !canvasSize.width || !canvasSize.height) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const { width, height, dpr } = canvasSize;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.scale(dpr, dpr);

    const frameIndex = Math.min(totalFrames - 1, Math.max(0, Math.round(progress * (totalFrames - 1))));
    const frame = frameImagesRef.current[frameIndex];

    context.fillStyle = "#0b0b0b";
    context.fillRect(0, 0, width, height);

    const backdrop = context.createRadialGradient(width * 0.78, height * 0.3, 0, width * 0.78, height * 0.3, width * 0.42);
    backdrop.addColorStop(0, `rgba(183,28,28,${0.18 + progress * 0.18})`);
    backdrop.addColorStop(1, "rgba(183,28,28,0)");
    context.fillStyle = backdrop;
    context.fillRect(0, 0, width, height);

    if (!frame) {
      drawFallback(context, width, height, progress, dpr);
      return;
    }

    const imageRatio = Math.min(width / frame.width, height / frame.height);
    const drawWidth = frame.width * imageRatio;
    const drawHeight = frame.height * imageRatio;
    const drawX = (width - drawWidth) / 2;
    const drawY = (height - drawHeight) / 2;

    context.drawImage(frame, drawX, drawY, drawWidth, drawHeight);

    context.fillStyle = "rgba(0,0,0,0.18)";
    context.fillRect(0, 0, width, height);
  }

  useEffect(() => {
    render(progressRef.current);
  }, [canvasSize, status.loaded]);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    progressRef.current = latest;
    render(latest);
  });

  return (
    <div className="absolute inset-0 z-0">
      <canvas ref={canvasRef} aria-hidden="true" className="h-full w-full" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.06),_transparent_28%),linear-gradient(180deg,rgba(11,11,11,0.08),rgba(11,11,11,0.6))]" />
      <div className="pointer-events-none absolute bottom-5 left-5 flex items-center gap-4 rounded-full border border-white/10 bg-black/35 px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-white/55 backdrop-blur-xl">
        <span>{hasSequence ? "Sequence Online" : "Sequence Pending"}</span>
        <span>{status.loaded}/{totalFrames} Frames</span>
      </div>
    </div>
  );
}
