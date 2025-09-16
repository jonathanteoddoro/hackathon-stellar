import { Module } from '@nestjs/common';
// ...existing imports
import { FlowService } from './flow.service';
import { FlowController } from './flow.controller';
import { ScheduleModule } from '@nestjs/schedule';
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
    ]),
    PredefinedNodesModule,
  ],
  controllers: [FlowController],
  providers: [FlowService],
  exports: [FlowService],
})
export class FlowModule {}
