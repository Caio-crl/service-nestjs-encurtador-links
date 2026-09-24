import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { ApiController } from './api.controller';
import { ApiService } from './api.service';

describe('POST /links', () => {
  let app: INestApplication;
  const apiService = { createLink: jest.fn() };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [ApiController],
      providers: [{ provide: ApiService, useValue: apiService }],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('accepts a valid HTTP(S) URL and responds with 201', async () => {
    apiService.createLink.mockResolvedValue({
      id: 'new-id',
      originalUrl: 'https://example.com/page',
      slug: 'aB91xZ',
      shortUrl: 'https://short.example/aB91xZ',
      createdAt: '2026-01-01T12:00:00.000Z',
    });

    const response = await request(app.getHttpServer())
      .post('/links')
      .send({ url: 'https://example.com/page' })
      .expect(201);

    expect(response.body).toMatchObject({
      originalUrl: 'https://example.com/page',
      shortUrl: 'https://short.example/aB91xZ',
    });
    expect(apiService.createLink).toHaveBeenCalledWith(
      'https://example.com/page',
    );
  });

  it.each([
    {},
    { url: 'example.com' },
    { url: 'ftp://example.com' },
    { url: 'javascript:alert(1)' },
    { url: 'https://example.com', slug: 'custom' },
  ])('rejects invalid input with 400: %j', async (body) => {
    await request(app.getHttpServer()).post('/links').send(body).expect(400);
    expect(apiService.createLink).not.toHaveBeenCalled();
  });
});
