import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class InitialLinkClickSchema1790213952750 implements MigrationInterface {
  name = 'InitialLinkClickSchema1790213952750';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'links',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          { name: 'originalUrl', type: 'text', isNullable: false },
          { name: 'slug', type: 'varchar', length: '191', isNullable: false },
          {
            name: 'createdAt',
            type: 'datetime',
            precision: 6,
            default: 'CURRENT_TIMESTAMP(6)',
          },
          {
            name: 'updatedAt',
            type: 'datetime',
            precision: 6,
            default: 'CURRENT_TIMESTAMP(6)',
            onUpdate: 'CURRENT_TIMESTAMP(6)',
          },
        ],
        indices: [
          new TableIndex({
            name: 'UQ_links_slug',
            columnNames: ['slug'],
            isUnique: true,
          }),
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'clicks',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          { name: 'linkId', type: 'varchar', length: '36', isNullable: false },
          {
            name: 'createdAt',
            type: 'datetime',
            precision: 6,
            default: 'CURRENT_TIMESTAMP(6)',
          },
        ],
        indices: [
          new TableIndex({
            name: 'IDX_clicks_link_id',
            columnNames: ['linkId'],
          }),
        ],
        foreignKeys: [
          new TableForeignKey({
            name: 'FK_clicks_link_id',
            columnNames: ['linkId'],
            referencedTableName: 'links',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('clicks');
    await queryRunner.dropTable('links');
  }
}
