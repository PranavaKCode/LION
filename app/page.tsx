import type { CSSProperties } from "react";
import Image from "next/image";
import styles from "./page.module.css";
import { LiveLab } from "./components/live-lab";
import { UnderseaNetwork } from "./components/undersea-network";
import { DETECTOR_OPTIONS, REEF_GALLERY_SPECIES } from "./lib/detector-config";
import { getLionMetrics } from "./lib/lion-data";

const architectureSteps = [
  {
    step: "01",
    title: "Footage ingest",
    description: "Drop in stills or MP4 field footage from surveys, ROV passes, or monitoring stations.",
  },
  {
    step: "02",
    title: "Detector routing",
    description: "Choose Lionfish Watch, Crown of Thorns Watch, or the broader Reef Health Suite before inference begins.",
  },
  {
    step: "03",
    title: "Hosted or local inference",
    description: "Deployment-safe Roboflow passes handle invasive-species lanes, while the local suite can combine FishInv and MegaFauna weights.",
  },
  {
    step: "04",
    title: "Active preview feed",
    description: "The web app overlays detections in-browser so analysts can review clips without waiting for a dashboard export.",
  },
  {
    step: "05",
    title: "Manifest + scoring hooks",
    description: "Run manifests, JSON payloads, and future evaluation exports stay ready for confusion matrices and reef-health analysis.",
  },
] as const;

function getSpeciesGlyph(name: string) {
  return name
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getSpeciesTone(group: string, index: number): CSSProperties {
  let accent = "#84efe0";
  let glow = "rgba(132, 239, 224, 0.28)";
  let secondary = "#1f8a70";

  if (group === "Invasive alert") {
    accent = "#ff7a4f";
    glow = "rgba(255, 122, 79, 0.28)";
    secondary = "#ffd17d";
  } else if (group === "Coral threat") {
    accent = "#ff9b70";
    glow = "rgba(255, 155, 112, 0.26)";
    secondary = "#ffe9c1";
  } else if (group === "MegaFauna") {
    accent = "#68d5ff";
    glow = "rgba(104, 213, 255, 0.24)";
    secondary = "#1d5f83";
  } else if (group === "Invertebrate") {
    accent = "#8ce7cf";
    glow = "rgba(140, 231, 207, 0.24)";
    secondary = "#0f6671";
  }

  return {
    "--species-accent": accent,
    "--species-glow": glow,
    "--species-secondary": secondary,
    transform: `rotate(${(index % 3) - 1}deg)`,
  } as CSSProperties;
}

export default async function Home() {
  const metrics = await getLionMetrics();
  const videoSrc = "/media/lionfish-demo.mp4";
  const liveDemoGifSrc = "/media/Live_demo.gif";
  const detectorLaneLabels = DETECTOR_OPTIONS.map((option) => option.shortLabel).join(" / ");
  const localSuiteLabel = "FishInv + MegaFauna";
  const mobileSpecies = REEF_GALLERY_SPECIES[0];

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
        <UnderseaNetwork className={styles.networkCanvas} />
        <div className={styles.causticVeil} aria-hidden="true" />
        <div className={styles.watermark}>L.I.O.N. / reef-health monitoring console</div>

        <header className={`${styles.card} ${styles.topNav}`}>
          <div className={styles.brandBlock}>
            <div className={styles.brandBadge}>L</div>
            <div>
              <div className={styles.brandName}>L.I.O.N.</div>
              <div className={styles.brandSubtitle}>REEF HEALTH + INVASIVE SPECIES</div>
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
            <p className={styles.eyebrow}>Undersea reef-health control room</p>
            <h1 className={styles.heroTitle}>
              Track reef health, invasive outbreaks, and indicator species
              <span className={styles.heroAccent}>from one living marine dashboard.</span>
            </h1>
            <p className={styles.heroText}>
              L.I.O.N. now routes footage through multiple marine-detection lanes: a hosted lionfish watch, a hosted
              crown-of-thorns watch, and a local reef-health suite that can combine your FishInv and MegaFauna models
              for broader Indo-Pacific ecosystem monitoring.
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
                <span className={styles.statLabel}>Reference run</span>
                <strong className={styles.statValue}>{metrics.hostedModelShort}</strong>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Reference frames</span>
                <strong className={styles.statValue}>{metrics.frameCount}</strong>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Detector lanes</span>
                <strong className={styles.statValue}>{String(DETECTOR_OPTIONS.length)}</strong>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Species slots</span>
                <strong className={styles.statValue}>{String(REEF_GALLERY_SPECIES.length)}</strong>
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
              <div className={styles.consoleTitle}>Reef Watch / active preview feed</div>
              <div className={`${styles.consoleChip} ${styles.consoleChipCoral}`}>Undersea HUD</div>
            </div>
            <div className={styles.heroMediaFrame}>
              <Image
                fill
                unoptimized
                className={styles.fullVideo}
                src={liveDemoGifSrc}
                alt="Active reef monitoring feed"
                sizes="(max-width: 980px) 100vw, 56vw"
              />
              <div className={styles.heroOverlayCards}>
                <div className={styles.overlayCard}>
                  <span className={styles.statLabel}>Reference clip</span>
                  <strong className={styles.statValue}>{metrics.sourceName}</strong>
                </div>
                <div className={styles.overlayCard}>
                  <span className={styles.statLabel}>Detection lanes</span>
                  <strong className={styles.statValue}>{detectorLaneLabels}</strong>
                </div>
                <div className={`${styles.overlayCard} ${styles.overlayCardAccent}`}>
                  <span className={styles.statLabel}>Reference runtime</span>
                  <strong className={styles.statValue}>{metrics.runtime}</strong>
                </div>
              </div>
            </div>
            <div className={styles.consoleFooter}>
              <div className={styles.consoleMiniChip}>particle network live</div>
              <div className={styles.consoleMiniChip}>caustic veil active</div>
              <div className={styles.consoleMiniChip}>glitch accent active</div>
            </div>
          </div>
        </section>

        <section className={styles.sectionBlock} id="architecture">
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>Program architecture</p>
            <h2>From raw reef footage to decision-ready overlays.</h2>
            <p>
              The flow now supports narrow invasive-species watches and a broader reef-health sweep. Hosted lanes stay
              deployment-friendly, while the paired local suite opens the door to fish, invertebrate, and megafauna
              passes without pretending those models are serverless-ready.
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
            <h2>Choose the detector lane that matches the mission.</h2>
            <p>
              The Live Lab now works more like an operations surface. Pick a hosted invasive-species detector for
              deployment-safe uploads, or switch into the local Reef Health Suite and choose which specialty models to
              combine before running a broader ecosystem scan.
            </p>
          </div>

          <LiveLab metrics={metrics} defaultVideoSrc={videoSrc} />
        </section>

        <section className={`${styles.sectionBlock} ${styles.gallerySection}`} id="gallery">
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>Detection gallery</p>
            <h2>Species slots for the reef-health catalog, not fake detections.</h2>
            <p>
              These cards now represent the species classes L.I.O.N. is being shaped around. They are intentionally
              labeled as placeholders until each class gets real footage and real detection metadata wired in.
            </p>
          </div>

          <div className={styles.galleryGrid}>
            {REEF_GALLERY_SPECIES.map((card, index) => (
              <article key={card.name} className={`${styles.card} ${styles.galleryCard} ${styles.gallerySpeciesCard}`}>
                <div className={styles.speciesVisual} style={getSpeciesTone(card.group, index)}>
                  <div className={styles.speciesVisualTop}>
                    <span className={styles.speciesEyebrow}>{card.group}</span>
                    <span className={styles.placeholderPill}>Placeholder</span>
                  </div>
                  <strong className={styles.speciesGlyph}>{getSpeciesGlyph(card.name)}</strong>
                  <div className={styles.speciesBadgeRow}>
                    <span className={styles.fileChip}>{card.badge}</span>
                    <span className={styles.fileChip}>N/A reel</span>
                  </div>
                </div>
                <div className={`${styles.galleryMeta} ${styles.galleryMetaColumn}`}>
                  <div className={styles.galleryMetaHead}>
                    <div>
                      <h3>{card.name}</h3>
                      <p>{`${card.role} / ${card.group}`}</p>
                    </div>
                    <span className={styles.fileChip}>species slot</span>
                  </div>
                  <p className={styles.galleryDescription}>{card.highlight}</p>
                  <div className={styles.galleryTags}>
                    <span className={styles.fileChip}>{card.badge}</span>
                    <span className={styles.fileChip}>preview / N/A</span>
                    <span className={styles.fileChip}>detector ready</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={`${styles.sectionBlock} ${styles.analyticsSection}`} id="analytics">
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>Analysis + stats</p>
            <h2>Ready for reef-health scoring, still honest about placeholders.</h2>
            <p>
              The analytics surface is laid out for confusion matrices, precision-recall curves, and sensitivity views,
              but it only shows N/A until real validation exports exist for each species lane.
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
              <p className={styles.analyticsCaption}>Placeholder until labeled validation exports are connected.</p>
            </article>

            <article className={`${styles.card} ${styles.analyticsCard}`}>
              <p className={styles.cardTopline}>Precision / recall</p>
              <div className={styles.placeholderSurface}>
                <strong className={styles.placeholderTitle}>N/A</strong>
                <p className={styles.placeholderCopy}>Precision-recall curves will populate once class scoring is wired.</p>
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
                  <span>Reference source</span>
                  <strong>{metrics.sourceName}</strong>
                </div>
                <div className={styles.miniMetricCompact}>
                  <span>Reference model</span>
                  <strong>{metrics.hostedModelShort}</strong>
                </div>
                <div className={styles.miniMetricCompact}>
                  <span>Manifest</span>
                  <strong>{metrics.manifestPath}</strong>
                </div>
                <div className={styles.miniMetricCompact}>
                  <span>Local suite</span>
                  <strong>{localSuiteLabel}</strong>
                </div>
              </div>
            </article>
          </div>
        </section>

        <footer className={styles.footerBlock} id="footer">
          <div className={`${styles.card} ${styles.footerBanner}`}>
            <div>
              <p className={styles.eyebrow}>Ship the home page like a reef operations front door</p>
              <h2>Neubrutalist undersea tooling with real detector lanes behind it.</h2>
            </div>
            <div className={styles.footerActions}>
              <a className={styles.primaryButton} href="#live-lab">
                Open Live Lab
              </a>
              <a className={styles.secondaryButton} href="#gallery">
                Review Species Grid
              </a>
            </div>
          </div>
          <div className={styles.footerGrid}>
            <div className={`${styles.card} ${styles.footerCard}`}>
              <h3>Project</h3>
              <p>Hosted lionfish and crown-of-thorns detection plus a local paired suite for Indo-Pacific reef indicators.</p>
            </div>
            <div className={`${styles.card} ${styles.footerCard}`}>
              <h3>Reference output</h3>
              <p>{metrics.outputVideoName}</p>
            </div>
            <div className={`${styles.card} ${styles.footerCard}`}>
              <h3>Next scoring layer</h3>
              <p>Wire real evaluation exports into confusion matrices, precision-recall curves, and ecosystem trend views.</p>
            </div>
          </div>
        </footer>
      </div>

      <div className={styles.mobileDock}>
        <div className={`${styles.card} ${styles.mobileDockCard}`}>
          <span>Detectors</span>
          <strong>{String(DETECTOR_OPTIONS.length)}</strong>
        </div>
        <div className={`${styles.card} ${styles.mobileDockCard}`}>
          <span>Species slots</span>
          <strong>{String(REEF_GALLERY_SPECIES.length)}</strong>
        </div>
        <div className={`${styles.card} ${styles.mobileDockCard}`}>
          <span>Reference run</span>
          <strong>{metrics.hostedModelShort}</strong>
        </div>
      </div>

      <section className={styles.mobileOnlySummary}>
        <article className={`${styles.card} ${styles.mobileAnalyticsCard}`}>
          <p className={styles.cardTopline}>Species slot</p>
          <div className={styles.speciesVisual} style={getSpeciesTone(mobileSpecies.group, 0)}>
            <div className={styles.speciesVisualTop}>
              <span className={styles.speciesEyebrow}>{mobileSpecies.group}</span>
              <span className={styles.placeholderPill}>Placeholder</span>
            </div>
            <strong className={styles.speciesGlyph}>{getSpeciesGlyph(mobileSpecies.name)}</strong>
            <div className={styles.speciesBadgeRow}>
              <span className={styles.fileChip}>{mobileSpecies.badge}</span>
              <span className={styles.fileChip}>N/A reel</span>
            </div>
          </div>
          <p className={styles.mobileCaption}>{mobileSpecies.highlight}</p>
        </article>
        <article className={`${styles.card} ${styles.mobileAnalyticsCard}`}>
          <p className={styles.cardTopline}>Analytics</p>
          <div className={styles.placeholderSurface}>
            <strong className={styles.placeholderTitle}>N/A</strong>
            <p className={styles.placeholderCopy}>Validation exports will appear here once species scoring is connected.</p>
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
