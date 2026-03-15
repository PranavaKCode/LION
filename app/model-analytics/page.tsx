import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { DETECTOR_OPTIONS } from "../lib/detector-config";
import { getLionMetrics } from "../lib/lion-data";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "L.I.O.N. | Model Graphs",
  description: "Training and validation graphs plus model lane summaries for L.I.O.N.",
};

const graphCards = [
  {
    title: "Precision-Recall Curve",
    src: "/media/precision_recall.png",
    description: "Shows the precision and recall tradeoff. Curves closer to the top-right indicate better class separation.",
  },
  {
    title: "Precision vs Confidence",
    src: "/media/precision_confidence_curve.png",
    description: "Helps select confidence thresholds that improve precision while controlling false positives.",
  },
  {
    title: "Recall vs Confidence",
    src: "/media/recall_confidence.png",
    description: "Highlights how sensitivity changes as confidence increases, useful for mission-specific threshold tuning.",
  },
  {
    title: "F1 vs Confidence",
    src: "/media/f1_lionfish_confidence.png",
    description: "Shows the confidence band where precision and recall are most balanced.",
  },
  {
    title: "Confusion Matrix",
    src: "/media/confusion_matrix.png",
    description: "Summarizes class-level mistakes so weak labels and overlapping classes can be corrected.",
  },
  {
    title: "Training Loss",
    src: "/media/train_loss_stuff.png",
    description: "Tracks optimization stability during training and indicates whether convergence is still improving.",
  },
] as const;

export default async function ModelAnalyticsPage() {
  const metrics = await getLionMetrics();

  return (
    <main className={styles.pageShell}>
      <div className={styles.pageGlow} aria-hidden="true" />
      <section className={styles.heroCard}>
        <p className={styles.eyebrow}>L.I.O.N. model observability</p>
        <h1>Model Graphs And Detector Summary</h1>
        <p>
          This page centralizes the core training and validation plots used to tune the hosted invasive-species lane and
          reef-health detector strategy.
        </p>
        
        <Link className={styles.homeButton} href="/">
          Back To Dashboard
        </Link>
      </section>

      <section className={styles.sectionBlock}>
        <h2>Detector Lanes</h2>
        <div className={styles.modelGrid}>
          {DETECTOR_OPTIONS.map((option) => (
            <article key={option.id} className={styles.modelCard}>
              <p className={styles.badge}>{option.kind === "hosted" ? "Hosted lane" : "Remote or local lane"}</p>
              <h3>{option.label}</h3>
              <p>{option.description}</p>
              <div className={styles.modelMetaRow}>
                <span>Short label</span>
                <strong>{option.shortLabel}</strong>
              </div>
              <div className={styles.modelMetaRow}>
                <span>Species classes listed</span>
                <strong>{option.gallerySpecies.length}</strong>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.sectionBlock}>
        <h2>Training And Validation Graphs</h2>
        <div className={styles.graphGrid}>
          {graphCards.map((graph) => (
            <article key={graph.title} className={styles.graphCard}>
              <div className={styles.graphImageWrap}>
                <Image
                  src={graph.src}
                  alt={graph.title}
                  fill
                  sizes="(max-width: 900px) 100vw, 46vw"
                  className={styles.graphImage}
                />
              </div>
              <div className={styles.graphMeta}>
                <h3>{graph.title}</h3>
                <p>{graph.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
