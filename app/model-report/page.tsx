import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getLionMetrics } from "../lib/lion-data";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "L.I.O.N. | Model Report",
  description: "A dedicated model report page with confidence and performance plots.",
};

const plotCards = [
  {
    title: "F1 vs Confidence",
    image: "/media/f1_lionfish_confidence.png",
    whyItMatters:
      "Use this graph to pick the confidence threshold where precision and recall are best balanced for deployment.",
  },
  {
    title: "Precision vs Confidence",
    image: "/media/precision_confidence_curve.png",
    whyItMatters:
      "Higher confidence usually increases precision. This helps reduce false positives in rapid response workflows.",
  },
  {
    title: "Recall vs Confidence",
    image: "/media/recall_confidence.png",
    whyItMatters:
      "Recall drops as threshold rises. This graph helps avoid missing true detections when monitoring invasive outbreaks.",
  },
  {
    title: "Precision-Recall Curve",
    image: "/media/precision_recall.png",
    whyItMatters:
      "This summarizes detector quality across all thresholds and makes class separability easier to compare.",
  },
  {
    title: "Confusion Matrix",
    image: "/media/confusion_matrix.png",
    whyItMatters:
      "Highlights where classes are confused so data collection and labeling can target weak categories.",
  },
  {
    title: "Training Loss",
    image: "/media/train_loss_stuff.png",
    whyItMatters:
      "Shows optimization behavior during training and whether convergence remains stable over time.",
  },
] as const;

export default async function ModelReportPage() {
  const metrics = await getLionMetrics();

  return (
    <main className={styles.pageShell}>
      <section className={styles.heroCard}>
        <p className={styles.eyebrow}>Dedicated model page</p>
        <h1>L.I.O.N. Performance Report</h1>
        <p>
          This page is focused on model behavior only. It brings confidence curves and quality plots into one place so
          threshold decisions and model updates can be discussed quickly.
        </p>
        <div className={styles.quickStats}>
          <div>
            <span>Reference model</span>
            <strong>{metrics.hostedModelShort}</strong>
          </div>
          <div>
            <span>Frames analyzed</span>
            <strong>{metrics.frameCount}</strong>
          </div>
          <div>
            <span>Manifest</span>
            <strong>{metrics.manifestPath}</strong>
          </div>
        </div>
        <div className={styles.actionRow}>
          <Link href="/" className={styles.actionButton}>
            Back to Home
          </Link>
          <Link href="/model-analytics" className={styles.actionGhost}>
            Open Model Graphs Page
          </Link>
        </div>
      </section>

      <section className={styles.gridSection}>
        {plotCards.map((plot) => (
          <article key={plot.title} className={styles.plotCard}>
            <div className={styles.imageWrap}>
              <Image
                src={plot.image}
                alt={plot.title}
                fill
                sizes="(max-width: 900px) 100vw, 48vw"
                className={styles.plotImage}
              />
            </div>
            <div className={styles.plotCopy}>
              <h2>{plot.title}</h2>
              <p>{plot.whyItMatters}</p>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
