import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TriggerConfigDocument = HydratedDocument<TriggerConfig>;

@Schema({ timestamps: true })
export class TriggerConfig {
  @Prop({ required: true, unique: true })
  triggerId: string;

  @Prop({ required: true })
  flowId: string;

  @Prop({ type: Object, default: {} })
  params: Record<string, any>;

  @Prop({ default: true })
  active: boolean;

  @Prop({ required: false })
  nodeId?: string;

  @Prop({ required: false })
  activeJobName?: string;
}

export const TriggerConfigSchema = SchemaFactory.createForClass(TriggerConfig);
