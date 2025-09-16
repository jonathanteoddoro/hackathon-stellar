import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { NodeType } from '../utils/NodeType';
import mongoose, { HydratedDocument } from 'mongoose';

export type FlowNodeDocument = HydratedDocument<FlowNode>;

@Schema()
export class FlowNode {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  flowId: string;

  @Prop({ required: true })
  x: number;

  @Prop({ required: true })
  y: number;

  @Prop({
    required: true,
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FlowNode',
      },
    ],
  })
  successFlow: FlowNode[];

  @Prop({
    required: true,
  })
  predefinedNodeId: string;

  @Prop({
    required: false,
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FlowNode',
      },
    ],
  })
  errorFlow?: FlowNode[];

  @Prop({
    required: true,
    enum: NodeType,
  })
  type: NodeType;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({
    type: Object,
  })
  params: Record<string, string>;

  @Prop({
    type: Object,
  })
  variables?: Record<string, string>;
}

export const FlowNodeSchema = SchemaFactory.createForClass(FlowNode);
