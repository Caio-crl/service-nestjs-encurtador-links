import { ConfigService } from '@nestjs/config';
import { LinkEntity } from './database/entities/link.entity';
import { ClickRepository } from './database/repositories/click.repository';
import { LinkRepository } from './database/repositories/link.repository';
import { SlugService } from './slug.service';
import { AppService } from './app.service';

describe('AppService.getLinkAnalytics', () => {
  const link = {
    id: '4f35adf6-2351-49b9-81cf-38dfaf47891a',
    slug: 'aB91xZ',
    originalUrl: 'https://example.com/page',
    createdAt: new Date('2026-09-24T18:00:00.000Z'),
  } as LinkEntity;
  const linkRepository = { findBySlug: jest.fn() };
  const clickRepository = { getAnalyticsForLink: jest.fn() };
  const service = new AppService(
    linkRepository as unknown as LinkRepository,
    clickRepository as unknown as ClickRepository,
    { generate: jest.fn() } as unknown as SlugService,
    { getOrThrow: jest.fn() } as unknown as ConfigService,
  );

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns total clicks and the latest click for an existing link', async () => {
    const lastClickAt = new Date('2026-09-24T18:30:00.000Z');
    linkRepository.findBySlug.mockResolvedValue(link);
    clickRepository.getAnalyticsForLink.mockResolvedValue({
      totalClicks: 42,
      lastClickAt,
    });

    await expect(service.getLinkAnalytics(link.slug)).resolves.toEqual({
      slug: link.slug,
      originalUrl: link.originalUrl,
      totalClicks: 42,
      createdAt: link.createdAt,
      lastClickAt,
    });
    expect(linkRepository.findBySlug).toHaveBeenCalledWith(link.slug);
    expect(clickRepository.getAnalyticsForLink).toHaveBeenCalledWith(link.id);
  });

  it('returns zero clicks and no last click for a new link', async () => {
    linkRepository.findBySlug.mockResolvedValue(link);
    clickRepository.getAnalyticsForLink.mockResolvedValue({
      totalClicks: 0,
      lastClickAt: null,
    });

    await expect(service.getLinkAnalytics(link.slug)).resolves.toMatchObject({
      totalClicks: 0,
      lastClickAt: null,
    });
  });

  it('returns 404 without querying clicks for a missing link', async () => {
    linkRepository.findBySlug.mockResolvedValue(null);

    await expect(service.getLinkAnalytics('absent')).rejects.toMatchObject({
      status: 404,
    });
    expect(clickRepository.getAnalyticsForLink).not.toHaveBeenCalled();
  });
});
