"use client";

import { useEffect, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import styles from "./species-map.module.css";

type SpeciesMapProps = {
  csvPath: string;
};

type SpeciesPoint = {
  species: string;
  latitude: number;
  longitude: number;
};

const speciesPalette = ["#ff7a4f", "#1f8a70", "#0b6bcb", "#c65911", "#009688", "#764ba2"] as const;

function parseSpeciesCsv(csvText: string) {
  return csvText
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(",");
      if (parts.length < 3) {
        return null;
      }

      const longitude = Number(parts.at(-1));
      const latitude = Number(parts.at(-2));
      const species = parts.slice(0, -2).join(",").trim();

      if (!species || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null;
      }

      return { species, latitude, longitude } satisfies SpeciesPoint;
    })
    .filter((point): point is SpeciesPoint => point !== null);
}

function getSpeciesColor(species: string, speciesOrder: string[]) {
  const index = Math.max(speciesOrder.indexOf(species), 0);
  return speciesPalette[index % speciesPalette.length];
}

function FitSpeciesBounds({ points }: { points: SpeciesPoint[] }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) {
      return;
    }

    const bounds = points.map((point) => [point.latitude, point.longitude] as [number, number]);
    map.fitBounds(bounds, { padding: [24, 24], maxZoom: 4 });
  }, [map, points]);

  return null;
}

export function SpeciesMap({ csvPath }: SpeciesMapProps) {
  const [points, setPoints] = useState<SpeciesPoint[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadMapData() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const response = await fetch(encodeURI(csvPath), { cache: "force-cache" });
        if (!response.ok) {
          throw new Error("Unable to load invasive species CSV.");
        }

        const csvText = await response.text();
        if (cancelled) {
          return;
        }

        setPoints(parseSpeciesCsv(csvText));
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : "Unable to load map data.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadMapData();
    return () => {
      cancelled = true;
    };
  }, [csvPath]);

  const speciesCounts: Record<string, number> = {};
  for (const point of points) {
    speciesCounts[point.species] = (speciesCounts[point.species] ?? 0) + 1;
  }

  const speciesOrder = Object.keys(speciesCounts).sort((left, right) => speciesCounts[right] - speciesCounts[left]);
  const enableMarkerPopups = points.length <= 1000;

  if (isLoading) {
    return <div className={styles.mapShell}>Loading map observations...</div>;
  }

  if (errorMessage) {
    return <div className={styles.mapShell}>{errorMessage}</div>;
  }

  return (
    <div className={styles.layout}>
      <div className={styles.mapShell}>
        <MapContainer center={[10, -95]} zoom={2} scrollWheelZoom className={styles.mapCanvas} preferCanvas>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitSpeciesBounds points={points} />
          {points.map((point, index) => {
            const color = getSpeciesColor(point.species, speciesOrder);

            return (
              <CircleMarker
                key={`${point.species}-${point.latitude}-${point.longitude}-${index}`}
                center={[point.latitude, point.longitude]}
                radius={7}
                pathOptions={{ color, fillColor: color, fillOpacity: 0.8, weight: 2 }}
              >
                {enableMarkerPopups ? (
                  <Popup>
                    <strong>{point.species}</strong>
                    <div>{`Lat ${point.latitude.toFixed(3)}, Lon ${point.longitude.toFixed(3)}`}</div>
                  </Popup>
                ) : null}
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      <div className={styles.sidebar}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total points</span>
          <strong className={styles.statValue}>{points.length}</strong>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Species tracked</span>
          <strong className={styles.statValue}>{speciesOrder.length}</strong>
        </div>
        <div className={styles.legendCard}>
          <p className={styles.legendTitle}>Species labels</p>
          <div className={styles.legendList}>
            {speciesOrder.map((species) => (
              <div className={styles.legendItem} key={species}>
                <span
                  className={styles.legendSwatch}
                  style={{ backgroundColor: getSpeciesColor(species, speciesOrder) }}
                  aria-hidden="true"
                />
                <div>
                  <strong>{species}</strong>
                  <span>{`${speciesCounts[species]} mapped detections`}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}