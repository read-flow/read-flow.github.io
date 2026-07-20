export interface NavLink {
  label: string;
  href: string;
}

export const NAV_LINKS: NavLink[] = [
  { label: 'Features', href: '#features' },
  { label: 'Install', href: '/guides/install/' },
  { label: 'Guides', href: '/guides/' },
  { label: 'GitHub', href: 'https://github.com/read-flow/read-flow' },
];

export function validateNavLinks(links: NavLink[]): void {
  const seen = new Set<string>();
  for (const link of links) {
    if (!link.label.trim()) {
      throw new Error('Nav link is missing a label');
    }
    if (!link.href.trim()) {
      throw new Error(`Nav link "${link.label}" is missing an href`);
    }
    if (seen.has(link.href)) {
      throw new Error(`Duplicate nav link href: ${link.href}`);
    }
    seen.add(link.href);
  }
}
