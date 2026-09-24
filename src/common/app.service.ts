import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QueryFailedError } from 'typeorm';
import { LinkEntity } from './database/entities/link.entity';
import { ClickRepository } from './database/repositories/click.repository';
import { LinkRepository } from './database/repositories/link.repository';
import { SlugService } from './slug.service';

const MAX_SLUG_ATTEMPTS = 5;
type CreatedLink = Pick<
  LinkEntity,
  'id' | 'originalUrl' | 'slug' | 'createdAt'
> & { shortUrl: string };

@Injectable()
export class AppService {
  constructor(
    private readonly linkRepository: LinkRepository,
    private readonly clickRepository: ClickRepository,
    private readonly slugService: SlugService,
    private readonly configService: ConfigService,
  ) {}

  getHealthCheck() {
    return { message: 'UP' };
  }

  async resolveLink(slug: string): Promise<string> {
    const link = await this.linkRepository.findBySlug(slug);
    if (!link) {
      throw new NotFoundException('Link not found');
    }

    await this.clickRepository.createForLink(link.id);
    return link.originalUrl;
  }

  async createLink(originalUrl: string): Promise<CreatedLink> {
    const baseUrl = this.getBaseUrl();

    for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
      const slug = this.slugService.generate();
      if (await this.linkRepository.findBySlug(slug)) {
        continue;
      }

      try {
        const link = await this.linkRepository.create(originalUrl, slug);
        return {
          id: link.id,
          originalUrl: link.originalUrl,
          slug: link.slug,
          shortUrl: new URL(`/${link.slug}`, baseUrl).toString(),
          createdAt: link.createdAt,
        };
      } catch (error) {
        if (!this.isUniqueViolation(error)) {
          throw error;
        }
      }
    }

    throw new ServiceUnavailableException('Unable to create a unique link');
  }

  private getBaseUrl(): URL {
    const baseUrl = new URL(
      this.configService.getOrThrow<string>('APP_BASE_URL'),
    );
    if (
      !['http:', 'https:'].includes(baseUrl.protocol) ||
      !baseUrl.hostname ||
      baseUrl.username ||
      baseUrl.password ||
      baseUrl.pathname !== '/' ||
      baseUrl.search ||
      baseUrl.hash
    ) {
      throw new Error('APP_BASE_URL must be an HTTP(S) origin');
    }
    return baseUrl;
  }

  private isUniqueViolation(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const driverError = error.driverError as { code?: string; errno?: number };
    return driverError.code === 'ER_DUP_ENTRY' || driverError.errno === 1062;
  }
}
