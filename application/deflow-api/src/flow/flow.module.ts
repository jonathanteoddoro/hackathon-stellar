import { Module } from '@nestjs/common';
// ...existing imports
import { FlowService } from './flow.service';
import { FlowController } from './flow.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { TriggerFactory } from './trigger.factory';
import { CronJobTrigger } from 'src/triggers/CronJobTrigger';
import { HttpTrigger } from 'src/triggers/HttpTrigger';
import { TriggerConfigSchema } from 'src/models/TriggerConfig';
import { FlowDeployController } from './flow.deploy.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { FlowSchema } from 'src/models/Flow';
import { FlowNodeSchema } from 'src/models/FlowNode';
import { PredefinedNodesModule } from 'src/predefined-nodes/predefined-nodes.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([
      { name: 'Flow', schema: FlowSchema },
      { name: 'FlowNode', schema: FlowNodeSchema },
      { name: 'TriggerConfig', schema: TriggerConfigSchema },
    ]),
    PredefinedNodesModule,
  ],
  controllers: [FlowController, FlowDeployController],
  providers: [FlowService, TriggerFactory, CronJobTrigger, HttpTrigger],
  exports: [FlowService],
})
export class FlowModule {}
