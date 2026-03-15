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
    name: "Lionfish",
    group: "Invasive alert",
    role: "Predatory reef invader",
    highlight: "Early capture supports preventative removal before spread.",
    badge: "rapid response",
    seconds: 0.6,
    imageSrc: "/media/Live_demo.gif",
    imageAlt: "Lionfish detection demo feed",
  },
  {
    name: "Crown of Thorns",
    group: "Coral threat",
    role: "Outbreak predator",
    highlight: "Tracks starfish pressure on coral cover before damage scales.",
    badge: "coral watch",
    seconds: 1.4,
  },
  {
    name: "Parrotfish",
    group: "Fish species",
    role: "Reef grazer",
    highlight: "Healthy grazing pressure can signal stronger coral resilience.",
    badge: "bio-indicator",
    seconds: 2.2,
  },
  {
    name: "Grouper",
    group: "Fish species",
    role: "Predator balance",
    highlight: "Useful for monitoring predatory balance in reef food webs.",
    badge: "bio-indicator",
    seconds: 2.9,
  },
  {
    name: "Giant Clam",
    group: "Invertebrate",
    role: "Habitat health",
    highlight: "Large clam sightings help frame reef maturity and local recovery.",
    badge: "bio-indicator",
    seconds: 3.7,
  },
  {
    name: "Urchin",
    group: "Invertebrate",
    role: "Grazing pressure",
    highlight: "Urchin counts can hint at algal pressure and benthic shifts.",
    badge: "reef balance",
    seconds: 4.3,
  },
  {
    name: "Sea Cucumber",
    group: "Invertebrate",
    role: "Seabed cycling",
    highlight: "Helps surface benthic health and sediment-turnover signals.",
    badge: "seafloor health",
    seconds: 5.1,
  },
  {
    name: "Lobster",
    group: "Invertebrate",
    role: "Habitat complexity",
    highlight: "Harder-to-spot crustaceans add useful context to shelter quality.",
    badge: "rare find",
    seconds: 5.9,
  },
  {
    name: "Sea Turtle",
    group: "MegaFauna",
    role: "Rare species",
    highlight: "Adds a broad ecosystem-health signal beyond invasive-species work.",
    badge: "megafauna watch",
    seconds: 6.6,
  },
  {
    name: "Shark",
    group: "MegaFauna",
    role: "Top predator",
    highlight: "Predator sightings help contextualize reef stability and protection success.",
    badge: "megafauna watch",
    seconds: 7.3,
  },
  {
    name: "Ray",
    group: "MegaFauna",
    role: "Rare species",
    highlight: "Completes the wider marine-health picture across the demo wall.",
    badge: "megafauna watch",
    seconds: 8.0,
  },
  {
    name: "Snapper",
    group: "Fish species",
    role: "Reef schooling fish",
    highlight: "A dependable indicator class for the Indo-Pacific monitoring mix.",
    badge: "bio-indicator",
    seconds: 8.8,
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
