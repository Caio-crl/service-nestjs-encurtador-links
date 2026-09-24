import { ConfigService } from '@nestjs/config';
import { DataSourceOptions } from 'typeorm';

export function createDatabaseOptions(
  config: ConfigService,
): DataSourceOptions {
  const port = Number(config.get<string>('DB_PORT') ?? '3306');
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('DB_PORT must be a valid TCP port');
  }

  return {
    type: 'mysql',
    host: config.getOrThrow<string>('DB_HOST'),
    port,
    username: config.getOrThrow<string>('DB_USER'),
    password: config.getOrThrow<string>('DB_PASSWORD'),
    database: config.getOrThrow<string>('DB_NAME'),
    entities: [__dirname + '/entities/*.entity{.ts,.js}'],
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
    migrationsRun: false,
    synchronize: false,
  };
}
