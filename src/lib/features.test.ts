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
  it('builds a raw githubusercontent URL against the screenshots branch', () => {
    expect(screenshotUrl('dark-dashboard.png')).toBe(
      'https://raw.githubusercontent.com/read-flow/read-flow/screenshots/dark-dashboard.png',
    );
  });
});
