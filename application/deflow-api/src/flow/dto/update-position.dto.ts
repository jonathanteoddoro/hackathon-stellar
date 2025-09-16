import { PartialType } from '@nestjs/mapped-types';
import { CreateFlowNodeDto } from './create-flowNode.dto';

export class UpdateNodeDto extends PartialType(CreateFlowNodeDto) {}
