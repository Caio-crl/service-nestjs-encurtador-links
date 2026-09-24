import { ConfigService } from '@nestjs/config';
import { QueryFailedError } from 'typeorm';
import { LinkEntity } from './database/entities/link.entity';
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
  const slugService = { generate: jest.fn() };
  const configService = { getOrThrow: jest.fn() };
  const service = new AppService(
    repository as unknown as LinkRepository,
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
