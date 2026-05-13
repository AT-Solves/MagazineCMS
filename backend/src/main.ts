import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? [
      'http://localhost:5173',
      'http://localhost:3000',
    ],
    credentials: true,
  });
  const port = process.env.API_PORT ?? 3000;
  await app.listen(port);
  console.log(`MagazineCMS API running on: http://localhost:${port}/graphql`);
}
bootstrap();
