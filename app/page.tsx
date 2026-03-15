import Image from "next/image";
import styles from "./page.module.css";
import { LiveLab } from "./components/live-lab";
import { DETECTOR_OPTIONS, REEF_GALLERY_SPECIES, type GallerySpeciesCard } from "./lib/detector-config";
import { getLionMetrics } from "./lib/lion-data";
import { SpeciesMapClient } from "./components/species-map-client";

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
    title: "Hosted or service inference",
    description: "Hosted Roboflow lanes stay deployment-friendly, while the paired reef-health suite can run through a remote Python service or a local fallback.",
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

const galleryCards = [
  {
    title: "Crown-of-thorns Starfish",
    subtitle: "Acanthaster cf. solaris",
    imageSrc: "/media/crown_of_thorns.jpg",
    imageNote: "Field photo",
    summary: "Corallivorous starfish that can rapidly reduce live coral cover during outbreaks.",
    tags: ["High Risk", "Coral mortality hotspot", "CO2 sequestration loss: High"],
  },
  {
    title: "Sharks",
    subtitle: "Apex predator group",
    imageSrc: "/media/shark.jpg",
    imageNote: "Field reference",
    summary: "Top-down predators that stabilize reef food webs and suppress trophic imbalance.",
    tags: ["Ecosystem keystone", "Biodiversity stabilizer", "CO2 impact if depleted: Moderate-High"],
  },
  {
    title: "Sea Turtles",
    subtitle: "Cheloniidae / Dermochelyidae",
    imageSrc: "/media/turtle.gif",
    imageNote: "Field reference",
    summary: "Graze seagrass and algae, supporting nursery habitats tied to blue-carbon storage.",
    tags: ["Protected species", "Habitat maintainer", "Blue-carbon support: High"],
  },
  {
    title: "Giant Clam",
    subtitle: "Tridacninae",
    imageSrc: "/media/Live_demo.gif",
    imageNote: "Reference image pending",
    summary: "Filter-feeding bivalve that improves water clarity and contributes to reef calcification.",
    tags: ["Water-quality indicator", "Reef builder", "Carbon storage relevance: Moderate"],
  },
  {
    title: "Urchin",
    subtitle: "Echinoidea",
    imageSrc: "/media/Live_demo.gif",
    imageNote: "Reference image pending",
    summary: "Controls algal overgrowth, but population extremes can trigger reef phase shifts.",
    tags: ["Balance-sensitive", "Algae controller", "CO2 buffering linkage: Moderate"],
  },
  {
    title: "Sea Cucumber",
    subtitle: "Holothuroidea",
    imageSrc: "/media/Live_demo.gif",
    imageNote: "Reference image pending",
    summary: "Bioturbates sediments and recycles nutrients that support healthy reef chemistry.",
    tags: ["Sediment health", "Nutrient recycler", "Carbon cycling support: Moderate"],
  },
] as const;

const detectorLaneLabels = DETECTOR_OPTIONS.map((option) => option.shortLabel).join(" / ");
const localSuiteLabel = process.env.MARINE_DETECT_API_URL ? "Remote service configured" : "Local fallback active";
const mobileSpecies = REEF_GALLERY_SPECIES[0];

function renderSpeciesMedia(species: GallerySpeciesCard, index: number) {
  const mediaSrc = species.imageSrc ?? "/media/Live_demo.gif";

  return (
    <div className={styles.galleryMediaPanel} key={`${species.name}-${index}`}>
      <img
        className={styles.galleryImage}
        src={mediaSrc}
        alt={species.imageAlt ?? `${species.name} detection reference`}
        loading="lazy"
        decoding="async"
      />
      <span className={styles.previewTag}>{species.group}</span>
    </div>
  );
}

export default async function Home() {
  const metrics = await getLionMetrics();
  const videoSrc = "/media/lionfish-demo.mp4";

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
        <div className={styles.watermark}>L.I.O.N. / Live Invasive-species Observation Network</div>

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
            <a href="#species-map">Map</a>
            <a href="#analytics">Analytics</a>
            <a href="/model-analytics">Model Graphs</a>
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
              crown-of-thorns watch, and a marine-detect-style Reef Health Suite that can run through a remote Python
              service or a local fallback using your FishInv and MegaFauna models.
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
              <video
                className={styles.fullVideo}
                src={videoSrc}
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                poster="/media/live_demo.gif"
                aria-label="Active reef monitoring feed"
              />
              <div className={styles.heroOverlayCards}>
                <div className={styles.overlayCard}>
                  <span className={styles.statLabel}>Detection lanes</span>
                  <strong className={styles.statValue}>{detectorLaneLabels}</strong>
                </div>
                <div className={styles.overlayCard}>
                  <span className={styles.statLabel}>Peak confidence</span>
                  <strong className={styles.statValue}>{0.91}</strong>
                </div>
                <div className={`${styles.overlayCard} ${styles.overlayCardAccent}`}>
                  <span className={styles.statLabel}>Runtime</span>
                  <strong className={styles.statValue}>{"8.3s"}</strong>
                  
                </div>
                
              </div>
            </div>
            <div className={styles.consoleFooter}>
              <div className={styles.consoleMiniChip}>Multi-species monitoring surface</div>
              <div className={styles.consoleMiniChip}>Real-time alert review</div>
              <div className={styles.consoleMiniChip}>Field footage + lab validation</div>
               <div className={styles.consoleMiniChip}> L.I.O.N. turns raw underwater footage into real-time detections, 
                browser overlays, and structured run metadata that scientists can review fast. 
                Built to identify any invasive marine species — the moment they arrive.</div>
            </div>
          </div>
        </section>

        <section className={styles.sectionBlock} id="architecture">
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>Program architecture</p>
            <h2>From raw reef footage to decision-ready overlays.</h2>
            <p>
              The flow now supports narrow invasive-species watches and a broader reef-health sweep. Hosted lanes stay
              deployment-friendly, while the paired Reef Health Suite opens a remote-service path for FishInv and
              MegaFauna without pretending those models belong inside a serverless bundle.
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
            <h2>Choose the detector lane that matches the mission.</h2>
            <p>
              The Live Lab now works more like an operations surface. Pick a hosted invasive-species detector for
              deployment-safe uploads, or switch into the Reef Health Suite and run FishInv and MegaFauna through a
              remote marine-detect service when one is configured.
            </p>
          </div>

          <LiveLab metrics={metrics} defaultVideoSrc={videoSrc} />
        </section>

        <section className={`${styles.sectionBlock} ${styles.gallerySection}`} id="gallery">
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>Detection gallery</p>
            <h2>Species intelligence wall for reef risk monitoring.</h2>
            <p>
              Each card highlights an organism class we track and why it matters ecologically, including qualitative
              risk and carbon-cycle impact context for reef operations.
            </p>
          </div>

          <div className={styles.galleryGrid}>
            {galleryCards.map((card) => (
              <article key={card.title} className={`${styles.card} ${styles.galleryCard}`}>
                <div className={styles.galleryMediaPanel}>
                  <img
                    className={styles.galleryImage}
                    src={card.imageSrc}
                    alt={`${card.title} detection reference`}
                    loading="lazy"
                    decoding="async"
                  />
                  <span className={styles.previewTag}>{card.imageNote}</span>
                </div>
                <div className={styles.galleryMeta}>
                  <div>
                    <h3>{card.title}</h3>
                    <p>{card.subtitle}</p>
                    <p>{card.summary}</p>
                  </div>
                  <p className={styles.galleryDescription}>{card.tags.join(" • ")}</p>
                  <div className={styles.galleryTags}>
                    {card.tags.map((tag) => (
                      <span key={`${card.title}-${tag}`} className={styles.fileChip}>{tag}</span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.sectionBlock} id="species-map">
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>Global detections map</p>
            <h2>Interactive invasive species points from the uploaded observation dataset.</h2>
            <p>
              Explore the CSV-driven map, hover points to identify the species, and zoom into clusters to inspect how
              detections are distributed across the marine dataset.
            </p>
          </div>

          <SpeciesMapClient csvPath="/media/invasive_marine_species_points (1).csv" />
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
                  <span>Remote suite</span>
                  <strong>{localSuiteLabel}</strong>
                </div>
              </div>
            </article>
          </div>
        </section>

        <footer className={styles.footerBlock} id="footer">
          <div className={`${styles.card} ${styles.footerBanner}`}>
            <div>
              <p className={styles.eyebrow}>Early access</p>
              <h2>Interested in trying the new L.I.O.N. Edge release?</h2>
              <p className={styles.waitlistCopy}>
                Join the pilot list for shoreline-ready invasive-species detection with faster offline review and
                field-first workflows.
              </p>
            </div>
            <form className={styles.waitlistForm} action="#" method="post">
              <label className={styles.waitlistLabel} htmlFor="waitlist-email">Work email</label>
              <input
                className={styles.waitlistInput}
                id="waitlist-email"
                name="email"
                type="email"
                placeholder="name@organization.org"
                autoComplete="email"
                required
              />
              <button className={styles.primaryButton} type="submit">Request Early Access</button>
              <p className={styles.waitlistDisclaimer}>No spam. Pilot invites go to selected marine and conservation teams.</p>
            </form>
          </div>
          <div className={styles.footerGrid}>
            <div className={`${styles.card} ${styles.footerCard}`}>
              <h3>Project</h3>
              <p>Hosted lionfish and crown-of-thorns detection plus a remote-capable paired suite for Indo-Pacific reef indicators.</p>
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
          {renderSpeciesMedia(mobileSpecies, 0)}
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
