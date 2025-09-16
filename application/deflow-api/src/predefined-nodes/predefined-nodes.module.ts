import { Module } from '@nestjs/common';
import { PredefinedNodesService } from './predefined-nodes.service';
import { PredefinedNodesController } from './predefined-nodes.controller';

@Module({
  controllers: [PredefinedNodesController],
  providers: [PredefinedNodesService],
})
export class PredefinedNodesModule {}
