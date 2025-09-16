import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { NodeType } from 'src/utils/NodeType';

export type PredefinedNodeDocument = HydratedDocument<PredefinedNode>;

@Schema()
export class PredefinedNode {
  @Prop({
    required: true,
    unique: true,
  })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, type: Object })
  requiredParamsPayloadKeysTypes: { [key: string]: string };

  @Prop({ required: true, type: Object })
  outputPayloadKeysTypes: { [key: string]: string };

  @Prop({
    required: true,
    enum: NodeType,
  })
  type: NodeType;
}

export const PredefinedNodeSchema =
  SchemaFactory.createForClass(PredefinedNode);
