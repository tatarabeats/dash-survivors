"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GAME_HEIGHT, GAME_WIDTH, NinjaSurvivors } from "@/lib/game";
import { loadAllSprites } from "@/lib/sprites";

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<NinjaSurvivors | null>(null);
  const [scale, setScale] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!canvasRef.current) return;
    let destroyed = false;

    async function init() {
      // Load sprites before starting game
      await loadAllSprites();
      if (destroyed || !canvasRef.current) return;
      setLoading(false);
      const engine = new NinjaSurvivors(canvasRef.current);
      engineRef.current = engine;
      engine.start();
    }

    init();

    return () => {
      destroyed = true;
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const updateScale = () => {
      const width = window.visualViewport?.width ?? window.innerWidth;
      const height = window.visualViewport?.height ?? window.innerHeight;
      const nextScale = Math.min(
        (width - 36) / GAME_WIDTH,
        (height - 112) / GAME_HEIGHT,
        1.5,
      );
      setScale(Math.max(0.54, nextScale));
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    window.visualViewport?.addEventListener("resize", updateScale);
    return () => {
      window.removeEventListener("resize", updateScale);
      window.visualViewport?.removeEventListener("resize", updateScale);
    };
  }, []);

  const toCanvasPoint = useCallback((clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (canvasRef.current.width / rect.width),
      y: (clientY - rect.top) * (canvasRef.current.height / rect.height),
    };
  }, []);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      event.preventDefault();
      const engine = engineRef.current;
      if (!engine) return;
      const point = toCanvasPoint(event.clientX, event.clientY);
      event.currentTarget.setPointerCapture(event.pointerId);
      engine.resumeAudio();
      engine.onTouchStart(point.x, point.y);
    },
    [toCanvasPoint],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      const engine = engineRef.current;
      if (!engine) return;
      const point = toCanvasPoint(event.clientX, event.clientY);
      engine.onTouchMove(point.x, point.y);
    },
    [toCanvasPoint],
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      event.preventDefault();
      const engine = engineRef.current;
      if (!engine) return;
      const point = toCanvasPoint(event.clientX, event.clientY);
      if (engine.handleTap(point.x, point.y)) {
        engine.cancelTouch();
        return;
      }
      engine.onTouchEnd(point.x, point.y);
    },
    [toCanvasPoint],
  );

  return (
    <div className="game-shell">
      <div className="game-frame">
        {loading && (
          <div
            style={{
              width: GAME_WIDTH * scale,
              height: GAME_HEIGHT * scale,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#06070d",
              borderRadius: 20,
              color: "#f1ddbb",
              fontFamily: '"Shippori Mincho", serif',
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            忍具を揃えている...
          </div>
        )}
        <canvas
          ref={canvasRef}
          className="game-canvas"
          style={{
            width: GAME_WIDTH * scale,
            height: GAME_HEIGHT * scale,
            display: loading ? "none" : "block",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => engineRef.current?.cancelTouch()}
          onContextMenu={(event) => event.preventDefault()}
        />
      </div>
      <p className="game-caption">
        音声ONがおすすめ。引いて離して、斬り抜けろ。
      </p>
    </div>
  );
}
