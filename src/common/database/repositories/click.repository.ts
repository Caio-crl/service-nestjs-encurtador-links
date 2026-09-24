import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClickEntity } from '../entities/click.entity';

@Injectable()
export class ClickRepository {
  constructor(
    @InjectRepository(ClickEntity)
    private readonly repository: Repository<ClickEntity>,
  ) {}

  createForLink(linkId: string): Promise<ClickEntity> {
    return this.repository.save(this.repository.create({ linkId }));
  }
}
