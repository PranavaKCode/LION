export type DetectorId = "lionfish" | "crown-of-thorns" | "reef-health-suite";
export type ReefSpecialtyId = "fish-invertebrates" | "megafauna";
export type DetectorKind = "hosted" | "local";

export type ReefSpecialty = {
  id: ReefSpecialtyId;
  label: string;
  description: string;
  badge: string;
  species: readonly string[];
};

export type DetectorOption = {
  id: DetectorId;
  kind: DetectorKind;
  label: string;
  shortLabel: string;
  description: string;
  hostedModelWorkspace?: string;
  hostedModelProject?: string;
  hostedModelVersion?: number;
  specialties?: readonly ReefSpecialty[];
  gallerySpecies: readonly string[];
};

export type GallerySpeciesCard = {
  name: string;
  group: string;
  role: string;
  highlight: string;
  badge: string;
  seconds: number;
  imageSrc?: string;
  imageAlt?: string;
};

const REEF_HEALTH_SPECIALTIES = [
  {
    id: "fish-invertebrates",
    label: "Fish + Invertebrates",
    description:
      "Butterfly fish, grouper, parrotfish, snapper, moray eel, sweet lips, crown of thorns, giant clam, urchin, sea cucumber, lobster, and related indicators.",
    badge: "bio-indicator sweep",
    species: [
      "Butterfly Fish",
      "Grouper",
      "Parrotfish",
      "Snapper",
      "Moray Eel",
      "Sweet Lips",
      "Barramundi Cod",
      "Humphead Wrasse",
      "Bumphead Parrotfish",
      "Fish (other)",
      "Giant Clam",
      "Urchin",
      "Sea Cucumber",
      "Lobster",
      "Crown of Thorns",
    ],
  },
  {
    id: "megafauna",
    label: "MegaFauna + Rare Species",
    description:
      "Sharks, sea turtles, rays, and other larger rare-fauna passes that help frame overall reef health.",
    badge: "megafauna watch",
    species: ["Shark", "Sea Turtle", "Ray"],
  },
] as const satisfies readonly ReefSpecialty[];

export const DETECTOR_OPTIONS = [
  {
    id: "lionfish",
    kind: "hosted",
    label: "Lionfish Watch",
    shortLabel: "Lionfish",
    description: "Hosted Roboflow invasive-species detector for lionfish images and video.",
    hostedModelWorkspace: "su-eaelw",
    hostedModelProject: "lionfish-qs3tq",
    hostedModelVersion: 49,
    gallerySpecies: ["Lionfish"],
  },
  {
    id: "crown-of-thorns",
    kind: "hosted",
    label: "Crown of Thorns",
    shortLabel: "COTS",
    description: "Hosted Roboflow detector for crown-of-thorns starfish so coral-predator outbreaks can be spotted early.",
    hostedModelWorkspace: "roboflow",
    hostedModelProject: "crown-of-thorns-detection-pgppy",
    hostedModelVersion: 1,
    gallerySpecies: ["Crown of Thorns"],
  },
  {
    id: "reef-health-suite",
    kind: "local",
    label: "Reef Health Suite",
    shortLabel: "Reef Suite",
    description:
      "Marine-detect-style paired suite for fish, invertebrates, mega fauna, and rare species. It uses a remote Python service when MARINE_DETECT_API_URL is configured, or falls back to the local YOLO runner.",
    specialties: REEF_HEALTH_SPECIALTIES,
    gallerySpecies: [
      "Butterfly Fish",
      "Grouper",
      "Parrotfish",
      "Snapper",
      "Moray Eel",
      "Giant Clam",
      "Urchin",
      "Sea Cucumber",
      "Lobster",
      "Crown of Thorns",
      "Shark",
      "Sea Turtle",
      "Ray",
    ],
  },
] as const satisfies readonly DetectorOption[];

export const DEFAULT_DETECTOR_ID: DetectorId = "lionfish";
export const DEFAULT_REEF_SPECIALTIES: readonly ReefSpecialtyId[] = ["fish-invertebrates", "megafauna"];

export const REEF_GALLERY_SPECIES: readonly GallerySpeciesCard[] = [
  {
    name: "Crown of Thorns",
    group: "Coral threat",
    role: "Outbreak predator",
    highlight: "Tracks starfish pressure on coral cover before damage scales.",
    badge: "coral watch",
    seconds: 1.4,
    imageSrc: "/media/crown_of_thorns_pred.png",
    imageAlt: "Crown of thorns prediction sample",
  },
  {
    name: "Parrotfish (Scaridae)",
    group: "Fish species",
    role: "Reef grazer",
    highlight: "Healthy grazing pressure can signal stronger coral resilience.",
    badge: "bio-indicator",
    seconds: 2.2,
    imageSrc: "/media/parrotfish_scaridae_pred.png",
    imageAlt: "Parrotfish Scaridae prediction sample",
  },
  {
    name: "Grouper (Serranidae)",
    group: "Fish species",
    role: "Predator balance",
    highlight: "Useful for monitoring predatory balance in reef food webs.",
    badge: "bio-indicator",
    seconds: 2.9,
    imageSrc: "/media/grouper_serranidae_pred.png",
    imageAlt: "Grouper Serranidae prediction sample",
  },
  {
    name: "Snapper (Lutjanidae)",
    group: "Fish species",
    role: "Reef schooling fish",
    highlight: "A dependable indicator class for the Indo-Pacific monitoring mix.",
    badge: "bio-indicator",
    seconds: 3.6,
    imageSrc: "/media/snapper_lutjanidae_pred.png",
    imageAlt: "Snapper Lutjanidae prediction sample",
  },
  {
    name: "Urchin",
    group: "Invertebrate",
    role: "Grazing pressure",
    highlight: "Urchin counts can hint at algal pressure and benthic shifts.",
    badge: "reef balance",
    seconds: 4.3,
    imageSrc: "/media/urchin_pred.png",
    imageAlt: "Urchin prediction sample",
  },
  {
    name: "Sea Cucumber",
    group: "Invertebrate",
    role: "Seabed cycling",
    highlight: "Helps surface benthic health and sediment-turnover signals.",
    badge: "seafloor health",
    seconds: 5.1,
    imageSrc: "/media/sea_cucumber_pred.png",
    imageAlt: "Sea cucumber prediction sample",
  },
  {
    name: "Lobster",
    group: "Invertebrate",
    role: "Habitat complexity",
    highlight: "Harder-to-spot crustaceans add useful context to shelter quality.",
    badge: "rare find",
    seconds: 5.9,
    imageSrc: "/media/lobster_pred.png",
    imageAlt: "Lobster prediction sample",
  },
  {
    name: "Sea Turtle",
    group: "MegaFauna",
    role: "Rare species",
    highlight: "Adds a broad ecosystem-health signal beyond invasive-species work.",
    badge: "megafauna watch",
    seconds: 6.6,
    imageSrc: "/media/sea_turtle_pred.png",
    imageAlt: "Sea turtle prediction sample",
  },
  {
    name: "Shark",
    group: "MegaFauna",
    role: "Top predator",
    highlight: "Predator sightings help contextualize reef stability and protection success.",
    badge: "megafauna watch",
    seconds: 7.3,
    imageSrc: "/media/shark_pred.png",
    imageAlt: "Shark prediction sample",
  },
  {
    name: "Lionfish",
    group: "Invasive alert",
    role: "Predatory reef invader",
    highlight: "Early capture supports preventative removal before spread.",
    badge: "rapid response",
    seconds: 8.0,
    imageSrc: "/media/lionfish_gallery_pred.jpg",
    imageAlt: "Lionfish prediction sample",
  },
] as const;

export function getDetectorOption(detectorId?: string | null): DetectorOption {
  return DETECTOR_OPTIONS.find((option) => option.id === detectorId) ?? DETECTOR_OPTIONS[0];
}

export function normalizeReefSpecialties(values: string[] | null | undefined) {
  const selected = new Set(values ?? []);
  const normalized = REEF_HEALTH_SPECIALTIES.filter((specialty) => selected.has(specialty.id)).map(
    (specialty) => specialty.id,
  );

  return normalized.length ? normalized : [...DEFAULT_REEF_SPECIALTIES];
}
