import { INestApplication, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { MyExceptionFilter } from '../common/filters/myexception.filter';
import { ApiController } from './api.controller';
import { ApiService } from './api.service';

describe('GET /:slug', () => {
  let app: INestApplication;
  const apiService = {
    getHealthCheck: jest.fn(),
    resolveLink: jest.fn(),
  };

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

  it('responds with 302 and the original URL in Location', async () => {
    const originalUrl = 'https://example.com/page';
    apiService.resolveLink.mockResolvedValue(originalUrl);

    const response = await request(app.getHttpServer())
      .get('/aB91xZ')
      .expect(302);

    expect(response.headers.location).toBe(originalUrl);
    expect(apiService.resolveLink).toHaveBeenCalledWith('aB91xZ');
    expect(response.body).toEqual({});
  });

  it('responds with 404 for a missing link', async () => {
    apiService.resolveLink.mockRejectedValue(
      new NotFoundException('Link not found'),
    );

    const response = await request(app.getHttpServer())
      .get('/absent')
      .expect(404);

    expect(response.headers.location).toBeUndefined();
    expect(response.body).toMatchObject({ statusCode: 404 });
  });

  it('rejects invalid slugs without resolving them', async () => {
    await request(app.getHttpServer()).get('/invalid-slug').expect(400);
    expect(apiService.resolveLink).not.toHaveBeenCalled();
  });

  it('does not redirect or expose details when click recording fails', async () => {
    apiService.resolveLink.mockRejectedValue(
      new Error('private database error'),
    );

    const response = await request(app.getHttpServer())
      .get('/aB91xZ')
      .expect(500);

    expect(response.headers.location).toBeUndefined();
    expect(response.body).toEqual({ message: 'Internal server error' });
  });

  it('preserves the health route', async () => {
    apiService.getHealthCheck.mockReturnValue({ message: 'UP' });

    await request(app.getHttpServer())
      .get('/health')
      .expect(200, { message: 'UP' });
    expect(apiService.resolveLink).not.toHaveBeenCalled();
  });
});
