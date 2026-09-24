import { Repository } from 'typeorm';
import { ClickEntity } from '../entities/click.entity';
import { ClickRepository } from './click.repository';

describe('ClickRepository', () => {
  it('persists a click associated only with the link ID', async () => {
    const linkId = '4f35adf6-2351-49b9-81cf-38dfaf47891a';
    const click = { linkId } as ClickEntity;
    const repository = {
      create: jest.fn().mockReturnValue(click),
      save: jest.fn().mockResolvedValue({
        id: 'd5774667-a93b-41ce-855c-23dfd0e571bb',
        linkId,
        createdAt: new Date('2026-01-01T12:00:00.000Z'),
      }),
    };
    const clickRepository = new ClickRepository(
      repository as unknown as Repository<ClickEntity>,
    );

    const result = await clickRepository.createForLink(linkId);

    expect(repository.create).toHaveBeenCalledWith({ linkId });
    expect(repository.save).toHaveBeenCalledWith(click);
    expect(result.linkId).toBe(linkId);
  });

  it('uses COUNT and MAX in one aggregate query for a link', async () => {
    const linkId = '4f35adf6-2351-49b9-81cf-38dfaf47891a';
    const query = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({
        totalClicks: '42',
        lastClickAt: '2026-09-24T18:30:00.000Z',
      }),
    };
    const repository = { createQueryBuilder: jest.fn().mockReturnValue(query) };
    const clickRepository = new ClickRepository(
      repository as unknown as Repository<ClickEntity>,
    );

    await expect(clickRepository.getAnalyticsForLink(linkId)).resolves.toEqual({
      totalClicks: 42,
      lastClickAt: new Date('2026-09-24T18:30:00.000Z'),
    });
    expect(repository.createQueryBuilder).toHaveBeenCalledWith('click');
    expect(query.select).toHaveBeenCalledWith('COUNT(click.id)', 'totalClicks');
    expect(query.addSelect).toHaveBeenCalledWith(
      'MAX(click.createdAt)',
      'lastClickAt',
    );
    expect(query.where).toHaveBeenCalledWith('click.linkId = :linkId', {
      linkId,
    });
    expect(query.getRawOne).toHaveBeenCalledTimes(1);
  });

  it('returns zero and null when the aggregate has no clicks', async () => {
    const query = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({
        totalClicks: '0',
        lastClickAt: null,
      }),
    };
    const repository = { createQueryBuilder: jest.fn().mockReturnValue(query) };
    const clickRepository = new ClickRepository(
      repository as unknown as Repository<ClickEntity>,
    );

    await expect(
      clickRepository.getAnalyticsForLink('link-id'),
    ).resolves.toEqual({
      totalClicks: 0,
      lastClickAt: null,
    });
  });
});
