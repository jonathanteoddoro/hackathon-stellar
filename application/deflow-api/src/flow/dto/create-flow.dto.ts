import { IsNotEmpty } from 'class-validator';

export class CreateFlowDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  description: string;
}
