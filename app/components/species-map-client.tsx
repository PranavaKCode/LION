"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import styles from "../page.module.css";

const SpeciesMap = dynamic(
  () => import("./species-map").then((module) => module.SpeciesMap),
  {
    ssr: false,
    loading: () => (
      <div className={`${styles.card} ${styles.mapLoading}`}>
        Loading invasive species map...
      </div>
    ),
  }
);

export function SpeciesMapClient({ csvPath }: { csvPath: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [shouldRenderMap, setShouldRenderMap] = useState(false);

  useEffect(() => {
    if (shouldRenderMap) {
      return;
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) {
          return;
        }

        setShouldRenderMap(true);
        observer.disconnect();
      },
      { rootMargin: "220px 0px" },
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [shouldRenderMap]);

  return (
    <div ref={containerRef}>
      {shouldRenderMap ? (
        <SpeciesMap csvPath={csvPath} />
      ) : (
        <div className={`${styles.card} ${styles.mapLoading}`}>Preparing invasive species map...</div>
      )}
    </div>
  );
}
