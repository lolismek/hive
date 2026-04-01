"use client";

import { useEffect, useRef } from "react";
import "asciinema-player/dist/bundle/asciinema-player.css";

export function AsciinemaDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const created = useRef(false);

  useEffect(() => {
    if (!ref.current || created.current) return;
    created.current = true;
    const el = ref.current;

    import("asciinema-player").then((mod) => {
      mod.create("/demo.cast", el, { autoPlay: true, loop: true });
    });
  }, []);

  return <div ref={ref} />;
}
