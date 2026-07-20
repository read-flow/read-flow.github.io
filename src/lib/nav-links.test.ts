import { describe, expect, it } from 'vitest';
import { NAV_LINKS, validateNavLinks, type NavLink } from './nav-links';

describe('validateNavLinks', () => {
  it('accepts the real nav config without throwing', () => {
    expect(() => validateNavLinks(NAV_LINKS)).not.toThrow();
  });

  it('throws on a duplicate href', () => {
    const links: NavLink[] = [
      { label: 'A', href: '/a/' },
      { label: 'B', href: '/a/' },
    ];
    expect(() => validateNavLinks(links)).toThrow('Duplicate nav link href: /a/');
  });

  it('throws on an empty label', () => {
    const links: NavLink[] = [{ label: '  ', href: '/a/' }];
    expect(() => validateNavLinks(links)).toThrow('Nav link is missing a label');
  });

  it('throws on an empty href', () => {
    const links: NavLink[] = [{ label: 'A', href: '  ' }];
    expect(() => validateNavLinks(links)).toThrow('Nav link "A" is missing an href');
  });
});
