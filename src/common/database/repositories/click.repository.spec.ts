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
});
