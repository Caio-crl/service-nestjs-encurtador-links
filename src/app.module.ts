import { Module } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { ApiModule } from './api/api.module';

@Module({
  imports: [CommonModule, ApiModule],
})
export class AppModule {}
