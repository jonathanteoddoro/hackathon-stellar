import { Module } from '@nestjs/common';
import { FlowService } from './flow.service';
import { FlowController } from './flow.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { FlowSchema } from 'src/models/Flow';
import { FlowNodeSchema } from 'src/models/FlowNode';
import { PredefinedNodesModule } from 'src/predefined-nodes/predefined-nodes.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Flow',
        schema: FlowSchema,
      },
      {
        name: 'FlowNode',
        schema: FlowNodeSchema,
      },
    ]),
    PredefinedNodesModule,
  ],
  controllers: [FlowController],
  providers: [FlowService],
})
export class FlowModule {}
