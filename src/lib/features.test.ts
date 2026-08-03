import { describe, expect, it } from 'vitest';
import { FEATURES, screenshotUrl, validateFeatures, type Feature } from './features';

describe('validateFeatures', () => {
  it('accepts the real feature list without throwing', () => {
    expect(() => validateFeatures(FEATURES)).not.toThrow();
  });

  it('throws on a duplicate slug', () => {
    const features: Feature[] = [
      { slug: 'a', title: 'A', description: 'x', screenshot: 'a.png' },
      { slug: 'a', title: 'B', description: 'y', screenshot: 'b.png' },
    ];
    expect(() => validateFeatures(features)).toThrow('Duplicate feature slug: a');
  });

  it('throws on a missing description', () => {
    const features: Feature[] = [{ slug: 'a', title: 'A', description: '  ', screenshot: 'a.png' }];
    expect(() => validateFeatures(features)).toThrow('Feature "A" is missing a description');
  });

  it('throws on a missing screenshot', () => {
    const features: Feature[] = [{ slug: 'a', title: 'A', description: 'x', screenshot: '  ' }];
    expect(() => validateFeatures(features)).toThrow('Feature "A" is missing a screenshot');
  });
});

describe('screenshotUrl', () => {
  it('resolves a filename to a local asset URL', () => {
    const url = screenshotUrl('cosmic-opds.png');
    expect(url).not.toContain('raw.githubusercontent.com');
    expect(url).toMatch(/cosmic-opds.*\.png$/);
  });

  it('throws for a filename not present in src/assets/screenshots/', () => {
    expect(() => screenshotUrl('does-not-exist.png')).toThrow(
      'Screenshot not found in src/assets/screenshots/: does-not-exist.png',
    );
  });
});
