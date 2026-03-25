"use client";

import dynamic from "next/dynamic";

const Game = dynamic(() => import("@/components/Game"), { ssr: false });

export default function Home() {
  return (
    <main className="h-full w-full">
      <Game />
    </main>
  );
}
