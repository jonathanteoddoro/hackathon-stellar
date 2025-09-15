import { Body, Controller, Param, Post } from '@nestjs/common';
import { FlowService } from './flow.service';
import { NodeType } from 'src/utils/NodeType';

const simpleFlow = [
  {
    id: 1,
    name: 'TriggerTest',
    description: 'description',
    nodeType: NodeType.Trigger,
  },
  {},
];

@Controller('flow')
export class FlowController {
  constructor(private readonly flowService: FlowService) {}

  @Post('trigger/:triggerId')
  async httpTrigger(@Param('triggerId') triggerId, @Body() payload: object) {}
}
