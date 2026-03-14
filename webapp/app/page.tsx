import styles from "./page.module.css";
import { GalleryFrame } from "./components/gallery-frame";
import { getLionMetrics } from "./lib/lion-data";

const architectureSteps = [
  {
    step: "01",
    title: "Image / video ingest",
    description: "Single image, image directory, or MP4 source from field monitoring.",
  },
  {
    step: "02",
    title: "Hosted Roboflow detector",
    description: "Preset lionfish model resolves workspace, project, and version automatically.",
  },
  {
    step: "03",
    title: "Bounding boxes + confidence",
    description: "Detections are overlaid with class labels and confidence values for reef review.",
  },
  {
    step: "04",
    title: "Rendered outputs",
    description: "Annotated MP4 and image exports stay usable for quick qualitative assessment.",
  },
  {
    step: "05",
    title: "JSON manifest + metrics",
    description: "Frame-level metadata is available for stats, audits, and downstream analysis.",
  },
] as const;

const galleryCards = [
  { title: "Reef corridor / pass A", time: 0.6, tags: ["lion fish", "annotated"] },
  { title: "Coral shelf / drift scan", time: 1.8, tags: ["video", "review"] },
  { title: "Ridge line / alert candidate", time: 2.9, tags: ["json", "manifest"] },
  { title: "Breakwater / high visibility", time: 4.1, tags: ["field clip", "reef"] },
  { title: "Kelp edge / side pass", time: 5.5, tags: ["monitoring", "export"] },
  { title: "Survey closeout / output review", time: 7.0, tags: ["archive", "demo"] },
] as const;

const analyticsBars = [44, 58, 66, 74, 82, 78] as const;
const mobileAnalyticsBars = [36, 68, 52, 78, 62] as const;

export default async function Home() {
  const metrics = await getLionMetrics();
  const videoSrc = "/media/lionfish-demo.mp4";
  const galleryCaptions = [
    `bbox confidence ${metrics.avgConfidence}`,
    `peak ${metrics.maxConfidence}`,
    `${metrics.detectionCount} detections logged`,
    `fps ${metrics.fps}`,
    `runtime ${metrics.runtime}`,
    `source ${metrics.sourceName}`,
  ];

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
              L.I.O.N. turns raw underwater footage into annotated detections, exported video, and run metadata that
              scientists can review fast. The page leads like an actual field-ready web app, not a passive marketing
              brochure.
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
              <div className={styles.consoleTitle}>Reef Watch / Active annotated feed</div>
              <div className={`${styles.consoleChip} ${styles.consoleChipCoral}`}>Live demo</div>
            </div>
            <div className={styles.heroMediaFrame}>
              <video className={styles.fullVideo} src={videoSrc} autoPlay muted loop playsInline preload="metadata" />
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
            <h2>From raw reef footage to decision-ready outputs.</h2>
            <p>
              This mirrors the real repo workflow: upload footage, run hosted Roboflow inference, render annotated
              output, and persist JSON manifests for review and downstream analysis.
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
                {index < architectureSteps.length - 1 ? <div className={styles.pipelineArrow}>-&gt;</div> : null}
              </div>
            ))}
          </div>
        </section>

        <section className={styles.sectionBlock} id="live-lab">
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>Live lab</p>
            <h2>A web-app-first upload and review zone.</h2>
            <p>
              This section is the main hybrid app anchor. It needs to feel usable and inspectable before the user reads
              anything else.
            </p>
          </div>

          <div className={styles.liveGrid}>
            <article className={`${styles.card} ${styles.uploadCard}`}>
              <p className={styles.cardTopline}>Upload dock</p>
              <h3>Drop a reef clip or still-image set.</h3>
              <p>
                Oversized brutalist dropzone, bordered hard in black, with enough negative space to feel like a product
                tool rather than a landing-page form.
              </p>
              <div className={styles.dropzone}>
                <div className={styles.dropzoneIcon}>+</div>
                <div className={styles.dropzoneCopy}>Drag footage here or select a source folder</div>
                <div className={styles.dropzoneHint}>accepted / .mp4 .mov .jpg .png</div>
              </div>
              <div className={styles.fileChipRow}>
                <span className={styles.fileChip}>{metrics.sourceName}</span>
                <span className={styles.fileChip}>preset / lionfish</span>
                <span className={styles.fileChip}>conf / 0.25</span>
              </div>
            </article>

            <article className={`${styles.card} ${styles.monitorCard}`}>
              <p className={styles.cardTopline}>Annotated monitor</p>
              <div className={styles.monitorGrid}>
                <div className={styles.previewPanel}>
                  <video className={styles.fullVideo} src={videoSrc} autoPlay muted loop playsInline preload="metadata" />
                  <span className={styles.previewTag}>hosted-predict</span>
                </div>
                <div className={styles.previewStats}>
                  <div className={styles.miniMetric}>
                    <span>Resolution</span>
                    <strong>{metrics.resolution}</strong>
                  </div>
                  <div className={styles.miniMetric}>
                    <span>Frames</span>
                    <strong>{metrics.frameCount}</strong>
                  </div>
                  <div className={styles.miniMetric}>
                    <span>FPS</span>
                    <strong>{metrics.fps}</strong>
                  </div>
                  <div className={styles.miniMetric}>
                    <span>Total detections</span>
                    <strong>{metrics.detectionCount}</strong>
                  </div>
                </div>
              </div>
            </article>

            <div className={styles.opsStack}>
              <article className={`${styles.card} ${styles.opsCard}`}>
                <p className={styles.cardTopline}>Run context</p>
                <div className={styles.opsGrid}>
                  <div className={styles.miniMetricCompact}>
                    <span>Manifest</span>
                    <strong>runs/lionfish/last_run.json</strong>
                  </div>
                  <div className={styles.miniMetricCompact}>
                    <span>Output video</span>
                    <strong>_pred.mp4</strong>
                  </div>
                  <div className={styles.miniMetricCompact}>
                    <span>Frame json</span>
                    <strong>saved</strong>
                  </div>
                  <div className={styles.miniMetricCompact}>
                    <span>Preset</span>
                    <strong>lionfish</strong>
                  </div>
                </div>
              </article>
              <article className={`${styles.card} ${styles.opsCard}`}>
                <p className={styles.cardTopline}>Design intent notes</p>
                <ul className={styles.noteList}>
                  <li>Keep the upload surface oversized and first-class in the hierarchy.</li>
                  <li>Signal a real operator workflow rather than generic AI marketing.</li>
                  <li>Treat the micro-controls here as layout scaffolding, not finished product spec.</li>
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section className={`${styles.sectionBlock} ${styles.gallerySection}`} id="gallery">
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>Detection gallery</p>
            <h2>A dense footage wall for lots of object-detection examples.</h2>
            <p>
              The gallery should feel like a living archive of reef observations: footage, stills, confidence tags,
              and metadata chips distributed across a chunky, high-contrast mosaic.
            </p>
          </div>

          <div className={styles.galleryGrid}>
            {galleryCards.map((card, index) => (
              <article key={card.title} className={`${styles.card} ${styles.galleryCard}`}>
                <GalleryFrame label={card.title} seconds={card.time} videoSrc={videoSrc} width={640} height={360} />
                <div className={styles.galleryMeta}>
                  <div>
                    <h3>{card.title}</h3>
                    <p>{galleryCaptions[index]}</p>
                  </div>
                  <div className={styles.galleryTags}>
                    {card.tags.map((tag) => (
                      <span key={tag} className={styles.fileChip}>
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
            <h2>Make the analytics area look powerful without over-specifying it.</h2>
            <p>
              These modules stay deliberately high-level. The priority here is composition, hierarchy, and a believable
              stats surface for confusion matrices, precision-recall curves, and run summaries.
            </p>
          </div>

          <div className={styles.analyticsGrid}>
            <article className={`${styles.card} ${styles.analyticsCard}`}>
              <p className={styles.cardTopline}>Confusion matrix</p>
              <div className={styles.matrixGrid}>
                <div className={`${styles.matrixCell} ${styles.matrixHot}`}>91</div>
                <div className={`${styles.matrixCell} ${styles.matrixMild}`}>8</div>
                <div className={`${styles.matrixCell} ${styles.matrixMild}`}>6</div>
                <div className={`${styles.matrixCell} ${styles.matrixCold}`}>2</div>
              </div>
              <p className={styles.analyticsCaption}>Large matrix block, intentionally simple but visually weighted.</p>
            </article>

            <article className={`${styles.card} ${styles.analyticsCard}`}>
              <p className={styles.cardTopline}>Precision / recall</p>
              <div className={styles.trendChart}>
                {analyticsBars.map((height, index) => (
                  <span key={`${height}-${index}`} style={{ height: `${height}%` }} />
                ))}
              </div>
              <div className={styles.metricPairRow}>
                <div className={styles.miniMetricCompact}>
                  <span>precision</span>
                  <strong>0.91</strong>
                </div>
                <div className={styles.miniMetricCompact}>
                  <span>recall</span>
                  <strong>0.86</strong>
                </div>
              </div>
            </article>

            <article className={`${styles.card} ${styles.analyticsCard}`}>
              <p className={styles.cardTopline}>Sensitivity / specificity</p>
              <div className={styles.ringRow}>
                <div className={styles.ringMetric}>
                  <div className={styles.ring} style={{ ["--ring-fill" as string]: "92%", ["--ring-color" as string]: "var(--lion-aqua)" }}>
                    92%
                  </div>
                  <span>Sensitivity</span>
                </div>
                <div className={styles.ringMetric}>
                  <div className={styles.ring} style={{ ["--ring-fill" as string]: "88%", ["--ring-color" as string]: "var(--lion-coral)" }}>
                    88%
                  </div>
                  <span>Specificity</span>
                </div>
              </div>
            </article>

            <article className={`${styles.card} ${styles.analyticsCard}`}>
              <p className={styles.cardTopline}>Run summary</p>
              <div className={styles.summaryGrid}>
                <div className={styles.miniMetricCompact}>
                  <span>Model</span>
                  <strong>{metrics.hostedModelShort}</strong>
                </div>
                <div className={styles.miniMetricCompact}>
                  <span>Frames</span>
                  <strong>{metrics.frameCount}</strong>
                </div>
                <div className={styles.miniMetricCompact}>
                  <span>Mean conf.</span>
                  <strong>{metrics.avgConfidence}</strong>
                </div>
                <div className={styles.miniMetricCompact}>
                  <span>Max conf.</span>
                  <strong>{metrics.maxConfidence}</strong>
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
              <a className={styles.primaryButton} href="#top">Capture Desktop</a>
              <a className={styles.secondaryButton} href="#gallery">Capture Mobile</a>
            </div>
          </div>
          <div className={styles.footerGrid}>
            <div className={`${styles.card} ${styles.footerCard}`}>
              <h3>Project</h3>
              <p>Hosted lionfish detection for images and video with annotated exports.</p>
            </div>
            <div className={`${styles.card} ${styles.footerCard}`}>
              <h3>Outputs</h3>
              <p>runs/lionfish/hosted-predict</p>
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
          <span>Frames</span>
          <strong>{metrics.frameCount}</strong>
        </div>
        <div className={`${styles.card} ${styles.mobileDockCard}`}>
          <span>Avg conf.</span>
          <strong>{metrics.avgConfidence}</strong>
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
          <p className={styles.mobileCaption}>reef archive / annotated examples</p>
        </article>
        <article className={`${styles.card} ${styles.mobileAnalyticsCard}`}>
          <p className={styles.cardTopline}>Analytics</p>
          <div className={styles.mobileBars}>
            {mobileAnalyticsBars.map((height, index) => (
              <span key={`${height}-${index}`} style={{ height: `${height}%` }} />
            ))}
          </div>
          <div className={styles.metricPairRow}>
            <div className={styles.miniMetricCompact}>
              <span>precision</span>
              <strong>0.91</strong>
            </div>
            <div className={styles.miniMetricCompact}>
              <span>recall</span>
              <strong>0.86</strong>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}

