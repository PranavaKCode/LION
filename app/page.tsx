import styles from "./page.module.css";
import { GalleryFrame } from "./components/gallery-frame";
import { LiveLab } from "./components/live-lab";
import { getLionMetrics } from "./lib/lion-data";

const architectureSteps = [
  {
    step: "01",
    title: "Image / video intake",
    description: "On A Boat, streaming live from a reef, or in the lab with pre-recorded footage. Drop it in. ",
  },
  {
    step: "02",
    title: "Hosted Roboflow detector",
    description: "A call is made to our hosted AI model, so each invasive species is detected.",
  },
  {
    step: "03",
    title: "Bounding boxes + confidence",
    description: "Detections are overlaid with class labels and confidence values for reef review.",
  },
  {
    step: "04",
    title: "Browser review surface",
    description: "The deployed app layers returned detections over uploaded media without writing files to serverless disk.",
  },
  {
    step: "05",
    title: "JSON manifests + metrics",
    description: "Frame-level metadata can still feed audits, statistics, and downstream analysis.",
  },
] as const;

const galleryMoments = [0.6, 1.8, 2.9, 4.1, 5.5, 7.0] as const;

function formatPreviewTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds - minutes * 60;
  return `${String(minutes).padStart(2, "0")}:${seconds.toFixed(1).padStart(4, "0")}`;
}

export default async function Home() {
  const metrics = await getLionMetrics();
  const videoSrc = "/media/lionfish-demo.mp4";
  const liveDemoGifSrc = "/media/Live_demo.gif";
  const galleryCards = galleryMoments.map((time, index) => ({
    title: `Preview frame ${index + 1}`,
    label: formatPreviewTime(time),
    time,
    tags: ["demo clip", "preview frame"],
  }));

  return (
    <main className={styles.pageShell} id="top">
      <div className={styles.pageGlow} aria-hidden="true" />
      <div className={styles.bubbleField} aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      <div className={styles.pageFrame}>
        <div className={styles.watermark}>L.I.O.N. / Lionfish Identification and Oceanic Notation</div>

        <header className={`${styles.card} ${styles.topNav}`}>
          <div className={styles.brandBlock}>
            <div className={styles.brandBadge}>L</div>
            <div>
              <div className={styles.brandName}>L.I.O.N.</div>
              <div className={styles.brandSubtitle}>Hybrid marine ML operations home</div>
            </div>
          </div>
          <nav className={styles.navLinks} aria-label="Primary">
            <a href="#architecture">Architecture</a>
            <a href="#live-lab">Live Lab</a>
            <a href="#gallery">Gallery</a>
            <a href="#analytics">Analytics</a>
            <a href="#footer">Docs</a>
          </nav>
          <a className={styles.primaryButton} href="#live-lab">
            Launch Monitor
          </a>
        </header>

        <section className={styles.heroSection}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Undersea detection control surface</p>
            <h1 className={styles.heroTitle}>
              Catch lionfish
              <span className={styles.heroAccent}>before they disappear into the reef.</span>
            </h1>
            <p className={styles.heroText}>
              L.I.O.N. turns raw underwater footage into hosted detections, browser overlays, and structured run metadata
              that scientists can review fast. The page leads like an actual field-ready web app, not a passive
              marketing brochure.
            </p>
            <div className={styles.heroActions}>
              <a className={styles.primaryButton} href="#live-lab">
                Open Live Lab
              </a>
              <a className={styles.secondaryButton} href="#architecture">
                View System Flow
              </a>
            </div>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Hosted model</span>
                <strong className={styles.statValue}>{metrics.hostedModel}</strong>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Frames processed</span>
                <strong className={styles.statValue}>{metrics.frameCount}</strong>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Avg confidence</span>
                <strong className={styles.statValue}>{metrics.avgConfidence}</strong>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Output mode</span>
                <strong className={styles.statValue}>{metrics.outputMode}</strong>
              </div>
            </div>
          </div>

          <div className={`${styles.card} ${styles.consoleCard}`}>
            <div className={styles.consoleChrome}>
              <div className={styles.consoleLights}>
                <span />
                <span />
                <span />
              </div>
              <div className={styles.consoleTitle}>Reef Watch / Active preview feed</div>
              <div className={`${styles.consoleChip} ${styles.consoleChipCoral}`}>Live demo</div>
            </div>
            <div className={styles.heroMediaFrame}>
              <img className={styles.fullVideo} src={liveDemoGifSrc} alt="Live reef monitoring demo" />
              <div className={styles.heroOverlayCards}>
                <div className={styles.overlayCard}>
                  <span className={styles.statLabel}>Source clip</span>
                  <strong className={styles.statValue}>{metrics.sourceName}</strong>
                </div>
                <div className={styles.overlayCard}>
                  <span className={styles.statLabel}>Peak confidence</span>
                  <strong className={styles.statValue}>{metrics.maxConfidence}</strong>
                </div>
                <div className={`${styles.overlayCard} ${styles.overlayCardAccent}`}>
                  <span className={styles.statLabel}>Runtime</span>
                  <strong className={styles.statValue}>{metrics.runtime}</strong>
                </div>
              </div>
            </div>
            <div className={styles.consoleFooter}>
              <div className={styles.consoleMiniChip}>particle network background</div>
              <div className={styles.consoleMiniChip}>glitch headline note</div>
              <div className={styles.consoleMiniChip}>bubbles / caustic texture</div>
            </div>
          </div>
        </section>

        <section className={styles.sectionBlock} id="architecture">
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>Program architecture</p>
            <h2>From raw reef footage to decision-ready overlays.</h2>
            <p>
              {/* The Workflow prepare a secure upload, run Roboflow
              inference, render browser overlays, and keep structured detection JSON ready for review and downstream
              analysis. */}
            </p>
          </div>
          <div className={styles.pipelineRow}>
            {architectureSteps.map((item, index) => (
              <div key={item.step} className={styles.pipelineItemWrap}>
                <article className={`${styles.card} ${styles.pipelineCard}`}>
                  <span className={styles.pipelineStep}>{item.step}</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
                {index < architectureSteps.length - 1 ? (
                  <div className={styles.pipelineArrow}>{">" }</div>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <section className={styles.sectionBlock} id="live-lab">
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>Live lab</p>
            <h2>A web-app-first upload and review zone.</h2>
            <p>
              The upload area now behaves like a deployed tool, not a mock. It previews local media immediately, sends
              images through hosted inference, and uploads videos to a real remote detection job that comes back as
              browser overlays.
            </p>
          </div>

          <LiveLab metrics={metrics} defaultVideoSrc={videoSrc} />
        </section>

        <section className={`${styles.sectionBlock} ${styles.gallerySection}`} id="gallery">
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>Detection gallery</p>
            <h2>A dense footage wall for lots of object-detection examples.</h2>
            <p>
              The gallery is framed as real preview stills from the demo clip rather than invented sample data. It stays
              visually rich without pretending the page already has live detection metadata attached.
            </p>
          </div>

          <div className={styles.galleryGrid}>
            {galleryCards.map((card) => (
              <article key={card.title} className={`${styles.card} ${styles.galleryCard}`}>
                <GalleryFrame label={card.title} seconds={card.time} videoSrc={videoSrc} width={640} height={360} />
                <div className={styles.galleryMeta}>
                  <div>
                    <h3>{card.title}</h3>
                    <p>{`Captured at ${card.label} from ${metrics.sourceName}`}</p>
                  </div>
                  <div className={styles.galleryTags}>
                    {card.tags.map((tag) => (
                      <span key={`${card.title}-${tag}`} className={styles.fileChip}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={`${styles.sectionBlock} ${styles.analyticsSection}`} id="analytics">
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>Analysis + stats</p>
            <h2>Powerful layout, explicit placeholders.</h2>
            <p>
              These modules no longer fake evaluation numbers. Until scored validation outputs are connected, each card
              stays clearly labeled as a placeholder with N/A values.
            </p>
          </div>

          <div className={styles.analyticsGrid}>
            <article className={`${styles.card} ${styles.analyticsCard}`}>
              <p className={styles.cardTopline}>Confusion matrix</p>
              <div className={styles.matrixGrid}>
                <div className={`${styles.matrixCell} ${styles.matrixCold}`}>N/A</div>
                <div className={`${styles.matrixCell} ${styles.matrixCold}`}>N/A</div>
                <div className={`${styles.matrixCell} ${styles.matrixCold}`}>N/A</div>
                <div className={`${styles.matrixCell} ${styles.matrixCold}`}>N/A</div>
              </div>
              <p className={styles.analyticsCaption}>Placeholder until evaluation exports are connected.</p>
            </article>

            <article className={`${styles.card} ${styles.analyticsCard}`}>
              <p className={styles.cardTopline}>Precision / recall</p>
              <div className={styles.placeholderSurface}>
                <strong className={styles.placeholderTitle}>N/A</strong>
                <p className={styles.placeholderCopy}>Precision-recall data is not wired into the homepage yet.</p>
              </div>
              <div className={styles.metricPairRow}>
                <div className={styles.miniMetricCompact}>
                  <span>Precision</span>
                  <strong>N/A</strong>
                </div>
                <div className={styles.miniMetricCompact}>
                  <span>Recall</span>
                  <strong>N/A</strong>
                </div>
              </div>
            </article>

            <article className={`${styles.card} ${styles.analyticsCard}`}>
              <p className={styles.cardTopline}>Sensitivity / specificity</p>
              <div className={styles.ringRow}>
                <div className={styles.ringMetric}>
                  <div className={`${styles.ring} ${styles.ringPlaceholder}`}>N/A</div>
                  <span>Sensitivity</span>
                </div>
                <div className={styles.ringMetric}>
                  <div className={`${styles.ring} ${styles.ringPlaceholder}`}>N/A</div>
                  <span>Specificity</span>
                </div>
              </div>
            </article>

            <article className={`${styles.card} ${styles.analyticsCard}`}>
              <p className={styles.cardTopline}>Run summary</p>
              <div className={styles.summaryGrid}>
                <div className={styles.miniMetricCompact}>
                  <span>Source</span>
                  <strong>{metrics.sourceName}</strong>
                </div>
                <div className={styles.miniMetricCompact}>
                  <span>Output mode</span>
                  <strong>{metrics.outputMode}</strong>
                </div>
                <div className={styles.miniMetricCompact}>
                  <span>Manifest</span>
                  <strong>{metrics.manifestPath}</strong>
                </div>
                <div className={styles.miniMetricCompact}>
                  <span>Model</span>
                  <strong>{metrics.hostedModelShort}</strong>
                </div>
              </div>
            </article>
          </div>
        </section>

        <footer className={styles.footerBlock} id="footer">
          <div className={`${styles.card} ${styles.footerBanner}`}>
            <div>
              <p className={styles.eyebrow}>Ship the home page like an application front door</p>
              <h2>Neubrutal reefs, clear tooling, and enough atmosphere to feel alive.</h2>
            </div>
            <div className={styles.footerActions}>
              <a className={styles.primaryButton} href="#live-lab">Open Live Lab</a>
              <a className={styles.secondaryButton} href="#gallery">Review Gallery</a>
            </div>
          </div>
          <div className={styles.footerGrid}>
            <div className={`${styles.card} ${styles.footerCard}`}>
              <h3>Project</h3>
              <p>Hosted lionfish detection for images and video with browser overlays and structured outputs.</p>
            </div>
            <div className={`${styles.card} ${styles.footerCard}`}>
              <h3>Outputs</h3>
              <p>{metrics.outputVideoName}</p>
            </div>
            <div className={`${styles.card} ${styles.footerCard}`}>
              <h3>Reference cues</h3>
              <p>Keep the Mantis card rhythm. Avoid the old flat white prototype.</p>
            </div>
          </div>
        </footer>
      </div>

      <div className={styles.mobileDock}>
        <div className={`${styles.card} ${styles.mobileDockCard}`}>
          <span>Source</span>
          <strong>{metrics.sourceName}</strong>
        </div>
        <div className={`${styles.card} ${styles.mobileDockCard}`}>
          <span>Output</span>
          <strong>{metrics.outputMode}</strong>
        </div>
        <div className={`${styles.card} ${styles.mobileDockCard}`}>
          <span>FPS</span>
          <strong>{metrics.fps}</strong>
        </div>
      </div>

      <section className={styles.mobileOnlySummary}>
        <article className={`${styles.card} ${styles.mobileAnalyticsCard}`}>
          <p className={styles.cardTopline}>Gallery</p>
          <GalleryFrame label="reef archive" seconds={3.6} videoSrc={videoSrc} width={320} height={180} compact />
          <p className={styles.mobileCaption}>{`Source ${metrics.sourceName}`}</p>
        </article>
        <article className={`${styles.card} ${styles.mobileAnalyticsCard}`}>
          <p className={styles.cardTopline}>Analytics</p>
          <div className={styles.placeholderSurface}>
            <strong className={styles.placeholderTitle}>N/A</strong>
            <p className={styles.placeholderCopy}>Evaluation metrics will appear here once scoring data is connected.</p>
          </div>
          <div className={styles.metricPairRow}>
            <div className={styles.miniMetricCompact}>
              <span>Precision</span>
              <strong>N/A</strong>
            </div>
            <div className={styles.miniMetricCompact}>
              <span>Recall</span>
              <strong>N/A</strong>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
