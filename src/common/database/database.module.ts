import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createDatabaseOptions } from './database-options';
import { ClickEntity } from './entities/click.entity';
import { LinkEntity } from './entities/link.entity';
import { ClickRepository } from './repositories/click.repository';
import { LinkRepository } from './repositories/link.repository';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => createDatabaseOptions(config),
    }),
    TypeOrmModule.forFeature([LinkEntity, ClickEntity]),
  ],
  providers: [LinkRepository, ClickRepository],
  exports: [TypeOrmModule, LinkRepository, ClickRepository],
})
export class DatabaseModule {}
