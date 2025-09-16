import { Body, Controller, Delete, Param, Post, Put } from '@nestjs/common';
import { FlowService } from './flow.service';
import { CreateFlowNodeDto } from './dto/create-flowNode.dto';
import { LinkNodesDto } from './dto/link-nodes.dto';
import { CreateFlowDto } from './dto/create-flow.dto';
import { UpdateNodeDto } from './dto/update-position.dto';

@Controller('flow')
export class FlowController {
  constructor(private readonly flowService: FlowService) {}

  @Post()
  async createFlow(@Body() body: CreateFlowDto) {
    return await this.flowService.createFlow(body);
  }

  @Post(':flowId/trigger/:triggerId')
  async httpTrigger(
    @Param('triggerId') triggerId: string,
    @Param('flowId') flowId: string,
    @Body() payload: object,
  ) {
    return await this.flowService.executeFlow(payload, triggerId, flowId);
  }

  @Post(':flowId/new-node')
  async createNode(
    @Param('flowId') flowId: string,
    @Body() body: CreateFlowNodeDto,
  ) {
    return await this.flowService.addNodeToFlow(body, flowId);
  }

  @Delete(':flowId/node/:nodeId')
  async deleteNode(
    @Param('flowId') flowId: string,
    @Param('nodeId') nodeId: string,
  ) {
    return await this.flowService.deleteNodeFromFlow(nodeId, flowId);
  }

  @Put(':flowId/node/:nodeId')
  async updateNode(
    @Param('flowId') flowId: string,
    @Param('nodeId') nodeId: string,
    @Body() updateNode: UpdateNodeDto,
  ) {
    return await this.flowService.updateNode(nodeId, flowId, updateNode);
  }

  @Post('link-nodes')
  async linkNodes(@Body() body: LinkNodesDto) {
    return await this.flowService.linkNodes(body);
  }

  @Post('unlink-nodes')
  async unlinkNodes(@Body() body: LinkNodesDto) {
    return await this.flowService.unlinkNodes(body);
  }

  @Post(':flowId/deploy')
  async deploy(@Param('flowId') flowId: string) {
    if (flowId) {
      throw new Error('triggerId and flowId are required');
    }

    return await this.flowService.deployFlow(flowId);
  }

  @Post(':flowId/undeploy')
  async undeploy(@Param('flowId') flowId: string) {
    if (flowId) {
      throw new Error('triggerId and flowId are required');
    }

    return await this.flowService.undeployFlow(flowId);
  }
}
