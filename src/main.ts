import { NestApplication, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { MyExceptionFilter } from './common/filters/myexception.filter';
import {
  appLogger,
  configureAppLogger,
  getSafeErrorLogFields,
} from './common/logger/app-logger';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  configureAppLogger();
  const app = await NestFactory.create<NestApplication>(AppModule);
  app.useGlobalPipes(new ValidationPipe()); // Habilita a validação de dados (DTO)
  app.useGlobalFilters(new MyExceptionFilter());

  // Configuração do Swagger (Documentação da API automáticamente)
  const config = new DocumentBuilder()
    .setTitle('URL Shortener API')
    .setDescription('API do URL Shortener')
    .setVersion('1.0')
    .build();

  // Cria a documentação da API na rota /v1/docs/swagger
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/v1/docs/swagger', app, documentFactory);

  // Pega a porta via variável de ambiente ou usa a porta 3000
  const configService: ConfigService = app.get(ConfigService);
  const port = configService.get('PORT') || 3000;
  await app.listen(port).then(() => {
    appLogger.info('Servidor iniciado', { port });
  });
}
bootstrap().catch((error: unknown) => {
  appLogger.fatal('Falha ao iniciar servidor', {
    ...getSafeErrorLogFields(error),
  });
  process.exit(1);
});
