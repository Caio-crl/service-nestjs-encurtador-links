import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { SlugService } from './slug.service';

@Global()
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule],
  providers: [AppService, SlugService],
  exports: [AppService, DatabaseModule],
})
export class CommonModule {}
