import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FlowModule } from './flow/flow.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [FlowModule, ConfigModule.forRoot({ isGlobal: true })],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
