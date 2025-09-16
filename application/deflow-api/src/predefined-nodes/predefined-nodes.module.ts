import { Module } from '@nestjs/common';
import { PredefinedNodesService } from './predefined-nodes.service';
import { PredefinedNodesController } from './predefined-nodes.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { PredefinedNodeSchema } from 'src/models/PredefinedNodes';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'PredefinedNode',
        schema: PredefinedNodeSchema,
      },
    ]),
  ],
  controllers: [PredefinedNodesController],
  providers: [PredefinedNodesService],
  exports: [PredefinedNodesService],
})
export class PredefinedNodesModule {}
