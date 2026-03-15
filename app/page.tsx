import Image from "next/image";
import styles from "./page.module.css";
import { LiveLab } from "./components/live-lab";
import { DETECTOR_OPTIONS } from "./lib/detector-config";
import { getLionMetrics } from "./lib/lion-data";
import { SpeciesMapClient } from "./components/species-map-client";

const architectureSteps = [
  {
    step: "01",
    title: "Image / video intake",
    description: "On a boat, streaming live from a reef, or in the lab with pre-recorded footage. Drop it in.",
  },
  {
    step: "02",
    title: "Hosted Roboflow detector",
    description: "A call is made to the hosted model lane so each target species can be surfaced quickly.",
  },
  {
    step: "03",
    title: "Hosted or service inference",
    description:
      "Hosted lanes stay deployment-friendly, while the paired Reef Health Suite can run through a remote Python service or a local fallback.",
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

type GalleryCard = {
  title: string;
  subtitle: string;
  detectorFamily: string;
  imageSrc: string;
  imageNote: string;
  summary: string;
  highlight: string;
  tags: readonly string[];
};

const galleryCards = [
  {
    title: "Crown of Thorns Starfish",
    subtitle: "Acanthaster cf. solaris",
    detectorFamily: "Hosted COTS lane",
    imageSrc: "/media/crown_of_thorns_pred.png",
    imageNote: "Predicted sample",
    summary: "Hosted crown-of-thorns output ready for coral-risk review instead of a generic field-photo placeholder.",
    highlight: "Outbreaks can strip live coral cover quickly, so this lane stays tuned for early intervention.",
    tags: ["Coral threat", "Pred image", "Rapid response"],
  },
  {
    title: "Parrotfish (Scaridae)",
    subtitle: "Scaridae",
    detectorFamily: "Fish + Invertebrates",
    imageSrc: "/media/parrotfish_scaridae_pred.png",
    imageNote: "Predicted sample",
    summary: "Rendered with the family label the model actually predicts so the gallery stays scientifically clear.",
    highlight: "Grazers like parrotfish help suppress algal overgrowth and support coral resilience.",
    tags: ["Bio-indicator", "Scaridae", "Reef grazer"],
  },
  {
    title: "Grouper (Serranidae)",
    subtitle: "Serranidae",
    detectorFamily: "Fish + Invertebrates",
    imageSrc: "/media/grouper_serranidae_pred.png",
    imageNote: "Predicted sample",
    summary: "A reef-suite predator class surfaced as Serranidae so the UI matches the model output users will actually see.",
    highlight: "Groupers help contextualize predatory balance across the reef food web.",
    tags: ["Bio-indicator", "Serranidae", "Predator balance"],
  },
  {
    title: "Snapper (Lutjanidae)",
    subtitle: "Lutjanidae",
    detectorFamily: "Fish + Invertebrates",
    imageSrc: "/media/snapper_lutjanidae_pred.png",
    imageNote: "Predicted sample",
    summary: "This gallery slot now uses the detected family label instead of a looser common-name placeholder.",
    highlight: "Snappers are a dependable Indo-Pacific indicator class for routine reef-health surveys.",
    tags: ["Bio-indicator", "Lutjanidae", "Schooling reef fish"],
  },
  {
    title: "Urchin",
    subtitle: "Echinoidea",
    detectorFamily: "Fish + Invertebrates",
    imageSrc: "/media/urchin_pred.png",
    imageNote: "Predicted sample",
    summary: "Real prediction imagery replaces the old filler so this card now reflects the actual invertebrate lane.",
    highlight: "Urchin density can hint at grazing pressure, algal shifts, and broader benthic imbalance.",
    tags: ["Invertebrate", "Reef balance", "Algae controller"],
  },
  {
    title: "Sea Cucumber",
    subtitle: "Holothuroidea",
    detectorFamily: "Fish + Invertebrates",
    imageSrc: "/media/sea_cucumber_pred.png",
    imageNote: "Predicted sample",
    summary: "A seabed-health indicator card anchored to an actual predicted example from the current suite.",
    highlight: "Sea cucumbers recycle nutrients and surface sediment-health signals that matter for reef chemistry.",
    tags: ["Invertebrate", "Seafloor health", "Nutrient recycler"],
  },
  {
    title: "Lobster",
    subtitle: "Palinuridae",
    detectorFamily: "Fish + Invertebrates",
    imageSrc: "/media/lobster_pred.png",
    imageNote: "Predicted sample",
    summary: "The crustacean lane now shows a real model output rather than a placeholder thumbnail.",
    highlight: "Lobster sightings add useful context around habitat complexity and shelter quality.",
    tags: ["Invertebrate", "Rare find", "Habitat complexity"],
  },
  {
    title: "Sea Turtle",
    subtitle: "Cheloniidae",
    detectorFamily: "MegaFauna + Rare Species",
    imageSrc: "/media/sea_turtle_pred.png",
    imageNote: "Predicted sample",
    summary: "A real megafauna prediction frame now stands in for the old repeated demo asset.",
    highlight: "Sea turtle sightings help connect reef monitoring with larger ecosystem-health signals.",
    tags: ["MegaFauna", "Protected species", "Blue-carbon support"],
  },
  {
    title: "Shark",
    subtitle: "Selachimorpha",
    detectorFamily: "MegaFauna + Rare Species",
    imageSrc: "/media/shark_pred.png",
    imageNote: "Predicted sample",
    summary: "This apex-predator card now uses the provided prediction image instead of a repeated hero loop.",
    highlight: "Shark detections help frame top-down predator stability and protection success.",
    tags: ["MegaFauna", "Top predator", "Reef stability"],
  },
  {
    title: "Lionfish",
    subtitle: "Pterois volitans / miles",
    detectorFamily: "Hosted lionfish lane",
    imageSrc: "/media/lionfish_gallery_pred.jpg",
    imageNote: "Predicted still",
    summary: "This slot now uses a separate still from the lionfish prediction video so the gallery does not repeat the hero monitor.",
    highlight: "Lionfish stays in the wall as the dedicated invasive-species watch for early removal and spread prevention.",
    tags: ["Invasive alert", "Pred image", "Rapid removal"],
  },
] as const satisfies readonly GalleryCard[];

const detectableSpeciesFamilies = [
  {
    title: "MegaFauna and Rare Species",
    items: ["Sharks", "Sea Turtles", "Rays"],
    note: "Rare-fauna sightings broaden the reef-health picture beyond the invasive-species watch.",
  },
  {
    title: "Fish Species",
    items: [
      "Butterfly Fish (Chaetodontidae)",
      "Grouper (Serranidae)",
      "Parrotfish (Scaridae)",
      "Snapper (Lutjanidae)",
      "Moray Eel (Muraenidae)",
      "Sweet Lips (Haemulidae)",
      "Barramundi Cod (Cromileptes altivelis)",
      "Humphead (Napoleon) Wrasse (Cheilinus undulatus)",
      "Bumphead Parrotfish (Bolbometopon muricatum)",
      "Fish (other than above or unrecognizable)",
    ],
    note: "These fish classes anchor the broader Indo-Pacific bio-indicator sweep inside the Reef Health Suite.",
  },
  {
    title: "Invertebrates Species",
    items: ["Giant Clam", "Urchin", "Sea Cucumber", "Lobster", "Crown of Thorns"],
    note: "These invertebrate lanes help surface coral pressure, seabed health, and habitat complexity.",
  },
  {
    title: "Lionfish",
    items: ["Lionfish"],
    note: "The invasive-species watch remains its own lane for faster review, removal, and response planning.",
  },
] as const;

function renderSpeciesMedia(card: GalleryCard) {
  return (
    <div className={styles.galleryImageShell}>
      <Image
        fill
        className={styles.gallerySpeciesImage}
        src={card.imageSrc}
        alt={`${card.title} prediction preview`}
        sizes="(max-width: 640px) 100vw, 460px"
      />
      <div className={styles.galleryImageShade} />
      <div className={styles.galleryImageTop}>
        <span className={styles.fileChip}>{card.detectorFamily}</span>
        <span className={styles.previewTag}>{card.imageNote}</span>
      </div>
      <div className={styles.galleryImageBottom}>
        <span className={styles.consoleMiniChip}>{card.title}</span>
      </div>
    </div>
  );
}

export default async function Home() {
  const metrics = await getLionMetrics();
  const videoSrc = "/media/lionfish-demo.mp4";
  const liveDemoGifSrc = "/media/Live_demo.gif";
  const detectorLaneLabels = DETECTOR_OPTIONS.map((option) => option.shortLabel).join(" / ");
  const localSuiteLabel = process.env.MARINE_DETECT_API_URL ? "Remote reef-health service linked" : "Remote service configurable";
  const mobileSpecies = galleryCards[0];
  const gallerySpeciesCount = galleryCards.length;

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
            <a href="/model-report">Model Report</a>
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
                <strong className={styles.statValue}>{String(gallerySpeciesCount)}</strong>
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
                poster={liveDemoGifSrc}
                aria-label="Active reef monitoring feed"
              />
              <div className={styles.heroOverlayCards}>
                <div className={styles.overlayCard}>
                  <span className={styles.statLabel}>Detection lanes</span>
                  <strong className={styles.statValue}>{detectorLaneLabels}</strong>
                </div>
                <div className={styles.overlayCard}>
                  <span className={styles.statLabel}>Peak confidence</span>
                  <strong className={styles.statValue}>0.91</strong>
                </div>
                <div className={`${styles.overlayCard} ${styles.overlayCardAccent}`}>
                  <span className={styles.statLabel}>Runtime</span>
                  <strong className={styles.statValue}>8.3s</strong>
                </div>
              </div>
            </div>
            <div className={styles.consoleFooter}>
              <div className={styles.consoleMiniChip}>Multi-species monitoring surface</div>
              <div className={styles.consoleMiniChip}>Real-time alert review</div>
              <div className={styles.consoleMiniChip}>Field footage + lab validation</div>
              <div className={styles.consoleMiniChip}>Structured run metadata</div>
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
                {index < architectureSteps.length - 1 ? <div className={styles.pipelineArrow}>{">"}</div> : null}
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
              These slots now use actual prediction captures you supplied. Species without gallery media were removed
              from the visual wall and moved into the coverage list below so the site stays honest about what is shown.
            </p>
          </div>

          <div className={styles.galleryGrid}>
            {galleryCards.map((card) => (
              <article key={card.title} className={`${styles.card} ${styles.galleryCard}`}>
                <div className={styles.galleryMediaPanel}>
                  <Image
                    fill
                    className={styles.galleryImage}
                    src={card.imageSrc}
                    alt={`${card.title} detection reference`}
                    sizes="(max-width: 1280px) 50vw, 33vw"
                  />
                  <span className={styles.previewTag}>{card.imageNote}</span>
                </div>
                <div className={styles.galleryMeta}>
                  <div>
                    <h3>{card.title}</h3>
                    <p>{card.subtitle}</p>
                    <p>{card.summary}</p>
                  </div>
                  <p className={styles.galleryDescription}>{card.highlight}</p>
                  <div className={styles.galleryTags}>
                    <span className={styles.fileChip}>{card.detectorFamily}</span>
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

          <div className={styles.coverageGrid}>
            {detectableSpeciesFamilies.map((family) => (
              <article key={family.title} className={`${styles.card} ${styles.coverageCard}`}>
                <p className={styles.cardTopline}>{family.title}</p>
                <ul className={styles.coverageList}>
                  {family.items.map((item) => (
                    <li key={`${family.title}-${item}`}>{item}</li>
                  ))}
                </ul>
                <p className={styles.coverageNote}>{family.note}</p>
              </article>
            ))}
          </div>

          <p className={styles.coverageOutro}>
            The visual wall stays scoped to the real supplied prediction assets above, while the detection stack covers
            the full species families listed here and much more as the reef-health suite expands.
          </p>
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
              <label className={styles.waitlistLabel} htmlFor="waitlist-email">
                Work email
              </label>
              <input
                className={styles.waitlistInput}
                id="waitlist-email"
                name="email"
                type="email"
                placeholder="name@organization.org"
                autoComplete="email"
                required
              />
              <button className={styles.primaryButton} type="submit">
                Request Early Access
              </button>
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
          <strong>{String(gallerySpeciesCount)}</strong>
        </div>
        <div className={`${styles.card} ${styles.mobileDockCard}`}>
          <span>Reference run</span>
          <strong>{metrics.hostedModelShort}</strong>
        </div>
      </div>

      <section className={styles.mobileOnlySummary}>
        <article className={`${styles.card} ${styles.mobileAnalyticsCard}`}>
          <p className={styles.cardTopline}>Species slot</p>
          {renderSpeciesMedia(mobileSpecies)}
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
