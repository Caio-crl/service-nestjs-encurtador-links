import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LinkEntity } from '../entities/link.entity';

@Injectable()
export class LinkRepository {
  constructor(
    @InjectRepository(LinkEntity)
    private readonly repository: Repository<LinkEntity>,
  ) {}

  findBySlug(slug: string): Promise<LinkEntity | null> {
    return this.repository.findOneBy({ slug });
  }

  create(originalUrl: string, slug: string): Promise<LinkEntity> {
    return this.repository.save(this.repository.create({ originalUrl, slug }));
  }
}
