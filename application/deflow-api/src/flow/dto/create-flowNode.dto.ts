import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { NodeType } from 'src/utils/NodeType';

export class CreateFlowNodeDto {
  @IsNotEmpty()
  predefinedNodeId: string;

  @IsNotEmpty()
  name: string;

  @IsEnum(NodeType)
  type: NodeType;

  @IsNotEmpty()
  description: string;

  // JSON stringified object
  @IsNotEmpty()
  params: string;

  @IsNumber()
  x: number;

  @IsNumber()
  y: number;

  // JSON stringified object
  variables?: string;
}
