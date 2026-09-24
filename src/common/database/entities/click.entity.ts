import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { LinkEntity } from './link.entity';

@Entity('clicks')
@Index('IDX_clicks_link_id', ['linkId'])
export class ClickEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36 })
  linkId: string;

  @ManyToOne(() => LinkEntity, (link) => link.clicks, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'linkId', foreignKeyConstraintName: 'FK_clicks_link_id' })
  link: LinkEntity;

  @CreateDateColumn({ type: 'datetime', precision: 6 })
  createdAt: Date;
}
