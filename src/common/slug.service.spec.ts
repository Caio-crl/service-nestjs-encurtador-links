import { SlugService } from './slug.service';

describe('SlugService', () => {
  it('generates six base62 characters', () => {
    const service = new SlugService();
    const slugs = Array.from({ length: 100 }, () => service.generate());

    expect(slugs).toEqual(
      expect.arrayContaining([expect.stringMatching(/^[a-zA-Z0-9]{6}$/)]),
    );
    expect(slugs.every((slug) => /^[a-zA-Z0-9]{6}$/.test(slug))).toBe(true);
    expect(new Set(slugs).size).toBeGreaterThan(1);
  });
});
