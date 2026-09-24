import { ConfigService } from '@nestjs/config';
import * as request from 'supertest';
import dataSource from '../src/common/database/data-source';
import { ClickEntity } from '../src/common/database/entities/click.entity';
import { LinkEntity } from '../src/common/database/entities/link.entity';

const config = new ConfigService();
const apiBaseUrl = config.getOrThrow<string>('APP_BASE_URL');
const createdLinkIds: string[] = [];

describe('URL Shortener with local MySQL', () => {
  beforeAll(async () => {
    const dbHost = config.getOrThrow<string>('DB_HOST');
    const dbName = config.getOrThrow<string>('DB_NAME');
    const apiHost = new URL(apiBaseUrl).hostname;
    const localHosts = ['127.0.0.1', 'localhost', '::1'];
    if (
      !localHosts.includes(dbHost) ||
      !localHosts.includes(apiHost) ||
      !dbName.endsWith('_local')
    ) {
      throw new Error('E2E requires a local API and a local-only database');
    }

    await dataSource.initialize();
  });

  afterEach(async () => {
    if (!dataSource.isInitialized) {
      return;
    }
    for (const id of createdLinkIds.splice(0)) {
      await dataSource.getRepository(LinkEntity).delete({ id });
    }
  });

  afterAll(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('has the migrated tables, unique slug, foreign key and click index', async () => {
    const queryRunner = dataSource.createQueryRunner();
    try {
      const links = await queryRunner.getTable('links');
      const clicks = await queryRunner.getTable('clicks');

      expect(links).toBeDefined();
      expect(clicks).toBeDefined();
      expect(
        links?.indices.some(
          (index) => index.name === 'UQ_links_slug' && index.isUnique,
        ),
      ).toBe(true);
      expect(
        clicks?.indices.some((index) => index.name === 'IDX_clicks_link_id'),
      ).toBe(true);
      expect(
        clicks?.foreignKeys.some(
          (key) =>
            key.name === 'FK_clicks_link_id' &&
            key.referencedTableName === 'links' &&
            key.onDelete === 'CASCADE',
        ),
      ).toBe(true);
    } finally {
      await queryRunner.release();
    }
  });

  it('serves health and Swagger from the running API', async () => {
    await request(apiBaseUrl).get('/health').expect(200, { message: 'UP' });
    await request(apiBaseUrl).get('/v1/docs/swagger').expect(200);
  });

  it('creates a link, redirects, records a click and reports analytics', async () => {
    const originalUrl = 'https://example.com/e2e-page';
    const created = await request(apiBaseUrl)
      .post('/links')
      .send({ url: originalUrl })
      .expect(201);
    const id = created.body.id as string;
    const slug = created.body.slug as string;

    expect(id).toEqual(expect.any(String));
    createdLinkIds.push(id);
    expect(slug).toMatch(/^[a-zA-Z0-9]{6}$/);
    expect(created.body.originalUrl).toBe(originalUrl);
    const storedLink = await dataSource.getRepository(LinkEntity).findOneBy({
      id,
    });
    expect(storedLink?.slug).toBe(slug);
    expect(storedLink?.originalUrl).toBe(originalUrl);

    const redirect = await request(apiBaseUrl).get(`/${slug}`).expect(302);
    expect(redirect.headers.location).toBe(originalUrl);
    expect(
      await dataSource.getRepository(ClickEntity).countBy({ linkId: id }),
    ).toBe(1);

    const analytics = await request(apiBaseUrl)
      .get(`/links/${slug}/analytics`)
      .expect(200);
    expect(analytics.body).toMatchObject({
      slug,
      originalUrl,
      totalClicks: 1,
    });
    expect(analytics.body.lastClickAt).not.toBeNull();
  });

  it('returns 404 for a slug that is absent from the database', async () => {
    const links = dataSource.getRepository(LinkEntity);
    let missingSlug: string | undefined;
    for (let index = 0; index < 100; index++) {
      const candidate = index.toString(36).padStart(6, '0');
      if (!(await links.existsBy({ slug: candidate }))) {
        missingSlug = candidate;
        break;
      }
    }
    if (!missingSlug) {
      throw new Error('No unused slug available for E2E test');
    }

    await request(apiBaseUrl).get(`/${missingSlug}`).expect(404);
    await request(apiBaseUrl)
      .get(`/links/${missingSlug}/analytics`)
      .expect(404);
  });

  it('rejects an invalid URL', async () => {
    await request(apiBaseUrl)
      .post('/links')
      .send({ url: 'not-a-url' })
      .expect(400);
  });
});
