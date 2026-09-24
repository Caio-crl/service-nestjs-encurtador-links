import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createDatabaseOptions } from './database-options';
import { LinkEntity } from './entities/link.entity';
import { LinkRepository } from './repositories/link.repository';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => createDatabaseOptions(config),
    }),
    TypeOrmModule.forFeature([LinkEntity]),
  ],
  providers: [LinkRepository],
  exports: [TypeOrmModule, LinkRepository],
})
export class DatabaseModule {}
