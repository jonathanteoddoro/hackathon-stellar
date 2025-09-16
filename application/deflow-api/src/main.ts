import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { registerNodes } from './utils/registerNodes';
import { ValidationPipe } from '@nestjs/common';
import { SeederService } from './seeder/seeder.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({origin: "*"})
  await registerNodes();
  app.useGlobalPipes(new ValidationPipe());

  const seeder = app.get(SeederService);
  await seeder.seed();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
