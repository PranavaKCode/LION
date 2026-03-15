"use client";

import { useEffect, useRef } from "react";

type UnderseaNetworkProps = {
  className?: string;
};

type NodePoint = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
};

function createNodes(width: number, height: number, count: number) {
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.28,
    vy: (Math.random() - 0.5) * 0.22,
    radius: 1.5 + Math.random() * 2.2,
  })) as NodePoint[];
}

export function UnderseaNetwork({ className }: UnderseaNetworkProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let animationFrame = 0;
    let nodes = [] as NodePoint[];

    const syncSize = () => {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(rect.width, 1);
      const height = Math.max(rect.height, 1);
      const devicePixelRatio = window.devicePixelRatio || 1;

      canvas.width = Math.round(width * devicePixelRatio);
      canvas.height = Math.round(height * devicePixelRatio);
      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

      if (!nodes.length) {
        nodes = createNodes(width, height, prefersReducedMotion ? 14 : 30);
        return;
      }

      nodes = nodes.map((node) => ({
        ...node,
        x: Math.min(width, Math.max(0, node.x)),
        y: Math.min(height, Math.max(0, node.y)),
      }));
    };

    const draw = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (!width || !height) {
        animationFrame = window.requestAnimationFrame(draw);
        return;
      }

      context.clearRect(0, 0, width, height);
      context.fillStyle = "rgba(132, 239, 224, 0.24)";
      context.strokeStyle = "rgba(132, 239, 224, 0.18)";

      for (const node of nodes) {
        if (!prefersReducedMotion) {
          node.x += node.vx;
          node.y += node.vy;

          if (node.x <= 0 || node.x >= width) {
            node.vx *= -1;
          }
          if (node.y <= 0 || node.y >= height) {
            node.vy *= -1;
          }

          node.x = Math.min(width, Math.max(0, node.x));
          node.y = Math.min(height, Math.max(0, node.y));
        }
      }

      for (let index = 0; index < nodes.length; index += 1) {
        const start = nodes[index];
        for (let inner = index + 1; inner < nodes.length; inner += 1) {
          const end = nodes[inner];
          const dx = start.x - end.x;
          const dy = start.y - end.y;
          const distance = Math.hypot(dx, dy);
          if (distance > 180) {
            continue;
          }

          context.beginPath();
          context.strokeStyle = `rgba(132, 239, 224, ${0.18 - distance / 1200})`;
          context.lineWidth = 1;
          context.moveTo(start.x, start.y);
          context.lineTo(end.x, end.y);
          context.stroke();
        }
      }

      for (const node of nodes) {
        context.beginPath();
        context.fillStyle = "rgba(255, 255, 255, 0.5)";
        context.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        context.fill();
      }

      animationFrame = window.requestAnimationFrame(draw);
    };

    syncSize();
    draw();

    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(syncSize) : null;
    observer?.observe(canvas);
    window.addEventListener("resize", syncSize);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      observer?.disconnect();
      window.removeEventListener("resize", syncSize);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
