import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { registerNodes } from './utils/registerNodes';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await registerNodes();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
