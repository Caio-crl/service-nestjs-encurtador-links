import { ConfigService } from '@nestjs/config';
import { QueryFailedError } from 'typeorm';
import { LinkEntity } from './database/entities/link.entity';
import { ClickRepository } from './database/repositories/click.repository';
import { LinkRepository } from './database/repositories/link.repository';
import { SlugService } from './slug.service';
import { AppService } from './app.service';

describe('AppService.createLink', () => {
  const originalUrl = 'https://example.com/page';
  const createdAt = new Date('2026-01-01T12:00:00.000Z');
  const repository = {
    findBySlug: jest.fn(),
    create: jest.fn(),
  };
  const clickRepository = { createForLink: jest.fn() };
  const slugService = { generate: jest.fn() };
  const configService = { getOrThrow: jest.fn() };
  const service = new AppService(
    repository as unknown as LinkRepository,
    clickRepository as unknown as ClickRepository,
    slugService as unknown as SlugService,
    configService as unknown as ConfigService,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    configService.getOrThrow.mockReturnValue('https://short.example');
  });

  it('creates and returns a link with the configured base URL', async () => {
    const link = {
      id: '4f35adf6-2351-49b9-81cf-38dfaf47891a',
      originalUrl,
      slug: 'aB91xZ',
      createdAt,
    } as LinkEntity;
    slugService.generate.mockReturnValue(link.slug);
    repository.findBySlug.mockResolvedValue(null);
    repository.create.mockResolvedValue(link);

    await expect(service.createLink(originalUrl)).resolves.toEqual({
      id: link.id,
      originalUrl,
      slug: link.slug,
      shortUrl: 'https://short.example/aB91xZ',
      createdAt,
    });
    expect(repository.create).toHaveBeenCalledWith(originalUrl, link.slug);
  });

  it('retries when a generated slug already exists', async () => {
    slugService.generate
      .mockReturnValueOnce('exists')
      .mockReturnValueOnce('fresh1');
    repository.findBySlug
      .mockResolvedValueOnce({ id: 'existing' })
      .mockResolvedValueOnce(null);
    repository.create.mockResolvedValue({
      id: 'new-id',
      originalUrl,
      slug: 'fresh1',
      createdAt,
    });

    await expect(service.createLink(originalUrl)).resolves.toMatchObject({
      slug: 'fresh1',
    });
    expect(repository.findBySlug).toHaveBeenCalledTimes(2);
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith(originalUrl, 'fresh1');
  });

  it('stops after five occupied slugs', async () => {
    slugService.generate.mockReturnValue('exists');
    repository.findBySlug.mockResolvedValue({ id: 'existing' });

    await expect(service.createLink(originalUrl)).rejects.toMatchObject({
      status: 503,
    });
    expect(slugService.generate).toHaveBeenCalledTimes(5);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('retries a concurrent unique-key violation', async () => {
    slugService.generate
      .mockReturnValueOnce('raced1')
      .mockReturnValueOnce('fresh1');
    repository.findBySlug.mockResolvedValue(null);
    repository.create
      .mockRejectedValueOnce(
        new QueryFailedError(
          'INSERT',
          [],
          Object.assign(new Error('duplicate'), {
            code: 'ER_DUP_ENTRY',
            errno: 1062,
          }),
        ),
      )
      .mockResolvedValueOnce({
        id: 'new-id',
        originalUrl,
        slug: 'fresh1',
        createdAt,
      });

    await expect(service.createLink(originalUrl)).resolves.toMatchObject({
      slug: 'fresh1',
    });
    expect(repository.create).toHaveBeenCalledTimes(2);
  });
});

describe('AppService.resolveLink', () => {
  const link = {
    id: '4f35adf6-2351-49b9-81cf-38dfaf47891a',
    slug: 'aB91xZ',
    originalUrl: 'https://example.com/page',
  } as LinkEntity;
  const linkRepository = { findBySlug: jest.fn() };
  const clickRepository = { createForLink: jest.fn() };
  const service = new AppService(
    linkRepository as unknown as LinkRepository,
    clickRepository as unknown as ClickRepository,
    { generate: jest.fn() } as unknown as SlugService,
    { getOrThrow: jest.fn() } as unknown as ConfigService,
  );

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('finds the link, saves its click, then returns the original URL', async () => {
    const operationOrder: string[] = [];
    linkRepository.findBySlug.mockImplementation(async () => {
      operationOrder.push('find');
      return link;
    });
    clickRepository.createForLink.mockImplementation(async () => {
      operationOrder.push('click');
    });

    await expect(service.resolveLink(link.slug)).resolves.toBe(
      link.originalUrl,
    );
    expect(linkRepository.findBySlug).toHaveBeenCalledWith(link.slug);
    expect(clickRepository.createForLink).toHaveBeenCalledWith(link.id);
    expect(operationOrder).toEqual(['find', 'click']);
  });

  it('returns 404 for a missing slug without saving a click', async () => {
    linkRepository.findBySlug.mockResolvedValue(null);

    await expect(service.resolveLink('absent')).rejects.toMatchObject({
      status: 404,
    });
    expect(clickRepository.createForLink).not.toHaveBeenCalled();
  });

  it('propagates a click write failure instead of returning the URL', async () => {
    linkRepository.findBySlug.mockResolvedValue(link);
    const failure = new Error('database unavailable');
    clickRepository.createForLink.mockRejectedValue(failure);

    await expect(service.resolveLink(link.slug)).rejects.toBe(failure);
  });
});
