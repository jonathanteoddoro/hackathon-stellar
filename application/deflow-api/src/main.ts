import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { registerNodes } from './utils/registerNodes';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await registerNodes();
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
