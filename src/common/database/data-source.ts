import 'reflect-metadata';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { createDatabaseOptions } from './database-options';

export default new DataSource(createDatabaseOptions(new ConfigService()));
