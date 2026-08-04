"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function DecorativeElements() {
  const mounted = useMounted();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  if (!mounted) return null;

  return (
    <>
      {/* Noise texture overlay */}
      <svg
        className="noise-overlay"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <filter id="noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise)" opacity="0.4" />
      </svg>

      {/* Decorative blob 1 - bottom right */}
      <svg
        className="deco-blob"
        style={{
          bottom: "-200px",
          right: "-200px",
          width: "500px",
          height: "500px",
        }}
        viewBox="0 0 500 500"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path
          d="M421.5,327.5Q393,405,316.5,438.5Q240,472,167,432Q94,392,73.5,311Q53,230,97.5,167Q142,104,221,77.5Q300,51,372.5,103.5Q445,156,450.5,228Q456,300,421.5,327.5Z"
          fill="var(--sage)"
          opacity="0.18"
        />
      </svg>

      {/* Decorative blob 2 - top left */}
      <svg
        className="deco-blob"
        style={{
          top: "-180px",
          left: "-180px",
          width: "400px",
          height: "400px",
        }}
        viewBox="0 0 400 400"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path
          d="M343.5,206.5Q326,263,278.5,302.5Q231,342,168,319Q105,296,76.5,233Q48,170,86.5,116Q125,62,191,68Q257,74,307.5,116.5Q358,159,343.5,206.5Z"
          fill="var(--sage)"
          opacity="0.12"
        />
      </svg>

      {/* Cursor follower */}
      <div
        className="cursor-follower"
        style={{
          transform: `translate(${mousePos.x - 4}px, ${mousePos.y - 4}px)`,
          opacity: 0.6,
        }}
      />
    </>
  );
}
