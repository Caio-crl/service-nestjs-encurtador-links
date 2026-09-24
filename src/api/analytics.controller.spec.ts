import { INestApplication, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as request from 'supertest';
import { MyExceptionFilter } from '../common/filters/myexception.filter';
import { ApiController } from './api.controller';
import { ApiService } from './api.service';

describe('GET /links/:slug/analytics', () => {
  let app: INestApplication;
  const apiService = { getLinkAnalytics: jest.fn() };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [ApiController],
      providers: [{ provide: ApiService, useValue: apiService }],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalFilters(new MyExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns only the basic analytics fields with HTTP 200', async () => {
    const analytics = {
      slug: 'aB91xZ',
      originalUrl: 'https://example.com/page',
      totalClicks: 42,
      createdAt: new Date('2026-09-24T18:00:00.000Z'),
      lastClickAt: new Date('2026-09-24T18:30:00.000Z'),
    };
    apiService.getLinkAnalytics.mockResolvedValue(analytics);

    const response = await request(app.getHttpServer())
      .get('/links/aB91xZ/analytics')
      .expect(200);

    expect(response.body).toEqual({
      slug: analytics.slug,
      originalUrl: analytics.originalUrl,
      totalClicks: 42,
      createdAt: '2026-09-24T18:00:00.000Z',
      lastClickAt: '2026-09-24T18:30:00.000Z',
    });
    expect(apiService.getLinkAnalytics).toHaveBeenCalledWith('aB91xZ');
  });

  it('returns null as lastClickAt when no click exists', async () => {
    apiService.getLinkAnalytics.mockResolvedValue({
      slug: 'aB91xZ',
      originalUrl: 'https://example.com/page',
      totalClicks: 0,
      createdAt: new Date('2026-09-24T18:00:00.000Z'),
      lastClickAt: null,
    });

    const response = await request(app.getHttpServer())
      .get('/links/aB91xZ/analytics')
      .expect(200);

    expect(response.body.totalClicks).toBe(0);
    expect(response.body.lastClickAt).toBeNull();
  });

  it('returns 400 for an invalid slug', async () => {
    await request(app.getHttpServer())
      .get('/links/invalid-slug/analytics')
      .expect(400);
    expect(apiService.getLinkAnalytics).not.toHaveBeenCalled();
  });

  it('returns 404 for a missing link', async () => {
    apiService.getLinkAnalytics.mockRejectedValue(
      new NotFoundException('Link not found'),
    );

    const response = await request(app.getHttpServer())
      .get('/links/absent/analytics')
      .expect(404);

    expect(response.body).toMatchObject({ statusCode: 404 });
  });

  it('does not expose internal errors', async () => {
    apiService.getLinkAnalytics.mockRejectedValue(
      new Error('private database details'),
    );

    const response = await request(app.getHttpServer())
      .get('/links/aB91xZ/analytics')
      .expect(500);

    expect(response.body).toEqual({ message: 'Internal server error' });
  });

  it('documents lastClickAt as nullable in Swagger', () => {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().build(),
    );
    const schema = document.components.schemas.LinkAnalyticsDto;

    expect(schema).toHaveProperty('properties.lastClickAt.nullable', true);
    expect(
      document.paths['/links/{slug}/analytics'].get.responses,
    ).toHaveProperty('200');
  });
});
