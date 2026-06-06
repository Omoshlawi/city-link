import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { AppModule } from './app.module';
import { AppConfig } from './app.config';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    // The library will re-add the default body parsers for non-auth routes.
    bodyParser: false,
  });

  app.setGlobalPrefix('api');
  const appConfig = app.get(AppConfig);

  const config = new DocumentBuilder()
    .setTitle('City Link API')
    .setDescription('City Link backend API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  app.use(
    '/docs',
    apiReference({
      spec: { content: document },
      pageTitle: 'City Link API Docs',
    }),
  );

  await app.listen(appConfig.port);
  logger.log(`Server is running on port ${appConfig.port}`);
  logger.log(`Swagger is running on http://localhost:${appConfig.port}/docs`);
}
void bootstrap();
