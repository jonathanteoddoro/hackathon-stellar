import { IsEnum, IsNotEmpty } from 'class-validator';
import { NodeType } from 'src/utils/NodeType';

export class CreatePredefinedNodeDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  description: string;

  @IsNotEmpty()
  requiredParamsPayloadKeysTypes: { [key: string]: string };

  @IsNotEmpty()
  outputPayloadKeysTypes: { [key: string]: string };

  @IsNotEmpty()
  @IsEnum(NodeType)
  type: NodeType;
}
