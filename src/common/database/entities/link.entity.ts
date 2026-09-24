import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ClickEntity } from './click.entity';

@Entity('links')
@Index('UQ_links_slug', ['slug'], { unique: true })
export class LinkEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  originalUrl: string;

  @Column({ type: 'varchar', length: 191 })
  slug: string;

  @CreateDateColumn({ type: 'datetime', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', precision: 6 })
  updatedAt: Date;

  @OneToMany(() => ClickEntity, (click) => click.link)
  clicks: ClickEntity[];
}
