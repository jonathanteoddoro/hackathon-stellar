import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { PredefinedNodesService } from './predefined-nodes.service';
import { CreatePredefinedNodeDto } from './dto/create-predefined-node.dto';

@Controller('predefined-nodes')
export class PredefinedNodesController {
  constructor(
    private readonly predefinedNodesService: PredefinedNodesService,
  ) {}

  @Post()
  async createPredefinedNode(
    @Body() createPredefinedNodeDto: CreatePredefinedNodeDto,
  ) {
    return await this.predefinedNodesService.createPredefinedNode(
      createPredefinedNodeDto,
    );
  }

  @Get()
  async getAllPredefinedNodes() {
    return await this.predefinedNodesService.getAllPredefinedNodes();
  }

  @Get(':id')
  async getPredefinedNodeById(@Param('id') id: string) {
    return await this.predefinedNodesService.getPredefinedNodeById(id);
  }

  @Delete(':id')
  async deletePredefinedNode(@Param('id') id: string) {
    return await this.predefinedNodesService.deletePredefinedNode(id);
  }
}
