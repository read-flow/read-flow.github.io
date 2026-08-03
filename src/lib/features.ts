export interface Feature {
  slug: string;
  title: string;
  description: string;
  screenshot: string;
}

export const FEATURES: Feature[] = [
  {
    slug: 'scanning',
    title: 'Automatic scanning & de-duplication',
    description:
      'Read Flow scans your document folders and fingerprints every file with SHA-256, so duplicates are caught even if they were renamed or copied.',
    screenshot: 'cosmic-scanning.png',
  },
  {
    slug: 'tags',
    title: 'Tags & auto-tagging',
    description:
      'Organize your library with tags, and define rules that tag documents automatically as they are discovered.',
    screenshot: 'cosmic-tags.png',
  },
  {
    slug: 'progress',
    title: 'Reading status & progress',
    description:
      'Mark documents Unread, Reading, or Read, and pick up exactly where you left off — kept in sync across your devices.',
    screenshot: 'cosmic-progress.png',
  },
  {
    slug: 'multi-instance',
    title: 'Connect multiple instances',
    description:
      'Aggregate libraries from more than one Read Flow server into a single view, from the PWA or the Cosmic desktop app, with reading progress synced across all of them.',
    screenshot: 'cosmic-multi-instance.png',
  },
  {
    slug: 'pdf-reader',
    title: 'Built-in PDF reader',
    description: 'A native PDF viewer renders your documents directly in the app — no external tools needed.',
    screenshot: 'cosmic-pdf-reader.png',
  },
  {
    slug: 'epub-reader',
    title: 'Built-in EPUB reader',
    description: 'A native EPUB reader renders your e-books directly in the app — no external tools needed.',
    screenshot: 'cosmic-epub-reader.png',
  },
  {
    slug: 'opds',
    title: 'Online libraries (OPDS)',
    description:
      'Search and pull public-domain titles straight from catalogs like Project Gutenberg and Standard Ebooks.',
    screenshot: 'cosmic-opds.png',
  },
];

export function validateFeatures(features: Feature[]): void {
  const seen = new Set<string>();
  for (const feature of features) {
    if (!feature.slug.trim()) {
      throw new Error(`Feature "${feature.title}" is missing a slug`);
    }
    if (seen.has(feature.slug)) {
      throw new Error(`Duplicate feature slug: ${feature.slug}`);
    }
    seen.add(feature.slug);
    if (!feature.description.trim()) {
      throw new Error(`Feature "${feature.title}" is missing a description`);
    }
    if (!feature.screenshot.trim()) {
      throw new Error(`Feature "${feature.title}" is missing a screenshot`);
    }
  }
}

const screenshotModules = import.meta.glob<{ default: string | { src: string } }>(
  '../assets/screenshots/*.png',
  { eager: true },
);

export function screenshotUrl(filename: string): string {
  const mod = screenshotModules[`../assets/screenshots/${filename}`];
  if (!mod) {
    throw new Error(`Screenshot not found in src/assets/screenshots/: ${filename}`);
  }
  return typeof mod.default === 'string' ? mod.default : mod.default.src;
}
