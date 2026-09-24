import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClickEntity } from '../entities/click.entity';

type ClickAggregateRow = {
  totalClicks: string | number;
  lastClickAt: Date | string | null;
};

@Injectable()
export class ClickRepository {
  constructor(
    @InjectRepository(ClickEntity)
    private readonly repository: Repository<ClickEntity>,
  ) {}

  createForLink(linkId: string): Promise<ClickEntity> {
    return this.repository.save(this.repository.create({ linkId }));
  }

  async getAnalyticsForLink(
    linkId: string,
  ): Promise<{ totalClicks: number; lastClickAt: Date | null }> {
    const aggregate = await this.repository
      .createQueryBuilder('click')
      .select('COUNT(click.id)', 'totalClicks')
      .addSelect('MAX(click.createdAt)', 'lastClickAt')
      .where('click.linkId = :linkId', { linkId })
      .getRawOne<ClickAggregateRow>();

    return {
      totalClicks: Number(aggregate?.totalClicks ?? 0),
      lastClickAt: aggregate?.lastClickAt
        ? new Date(aggregate.lastClickAt)
        : null,
    };
  }
}
