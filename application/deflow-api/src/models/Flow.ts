import { Prop, Schema } from '@nestjs/mongoose';

@Schema()
export class Flow {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;
}
