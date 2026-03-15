"use client";

import dynamic from "next/dynamic";
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
  return <SpeciesMap csvPath={csvPath} />;
}
