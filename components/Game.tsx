"use client";

import { useRef, useEffect, useCallback } from "react";
import { DashSurvivors } from "@/lib/game";

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<DashSurvivors | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new DashSurvivors(canvasRef.current);
    engineRef.current = engine;
    engine.start();
    return () => engine.destroy();
  }, []);

  const getCanvasPos = useCallback((clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (clientX - rect.left) * (canvasRef.current.width / rect.width);
    const y = (clientY - rect.top) * (canvasRef.current.height / rect.height);
    return { x, y };
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      const engine = engineRef.current;
      if (!engine) return;
      const touch = e.touches[0];
      const { x, y } = getCanvasPos(touch.clientX, touch.clientY);

      // Try tap first (for upgrade cards / game over)
      if (engine.handleTap(x, y)) return;

      engine.onTouchStart(x, y);
    },
    [getCanvasPos],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      const engine = engineRef.current;
      if (!engine) return;
      const touch = e.touches[0];
      const { x, y } = getCanvasPos(touch.clientX, touch.clientY);
      engine.onTouchMove(x, y);
    },
    [getCanvasPos],
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      const engine = engineRef.current;
      if (!engine) return;
      const touch = e.changedTouches[0];
      const { x, y } = getCanvasPos(touch.clientX, touch.clientY);
      engine.onTouchEnd(x, y);
    },
    [getCanvasPos],
  );

  // Mouse support for desktop testing
  const mouseDown = useRef(false);
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const engine = engineRef.current;
      if (!engine) return;
      const { x, y } = getCanvasPos(e.clientX, e.clientY);
      if (engine.handleTap(x, y)) return;
      mouseDown.current = true;
      engine.onTouchStart(x, y);
    },
    [getCanvasPos],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!mouseDown.current) return;
      const engine = engineRef.current;
      if (!engine) return;
      const { x, y } = getCanvasPos(e.clientX, e.clientY);
      engine.onTouchMove(x, y);
    },
    [getCanvasPos],
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (!mouseDown.current) return;
      mouseDown.current = false;
      const engine = engineRef.current;
      if (!engine) return;
      const { x, y } = getCanvasPos(e.clientX, e.clientY);
      engine.onTouchEnd(x, y);
    },
    [getCanvasPos],
  );

  // Scale canvas to fill screen
  const scale =
    typeof window !== "undefined"
      ? Math.min(window.innerWidth / 390, window.innerHeight / 750, 1.3)
      : 1;

  return (
    <div
      ref={containerRef}
      className="flex items-center justify-center w-full h-full bg-black select-none overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        className="block"
        style={{
          width: 390 * scale,
          height: 750 * scale,
          touchAction: "none",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
    </div>
  );
}
