import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PredefinedNode } from 'src/models/PredefinedNodes';
import { CreatePredefinedNodeDto } from './dto/create-predefined-node.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PredefinedNodesService {
  constructor(
    @InjectModel(PredefinedNode.name)
    private predefinedNodeModel: Model<PredefinedNode>,
  ) {}

  async createPredefinedNode(
    data: CreatePredefinedNodeDto,
  ): Promise<PredefinedNode> {
    const newNode = new this.predefinedNodeModel({
      ...data,
      id: uuidv4(),
    });
    return await newNode.save();
  }

  async getAllPredefinedNodes(): Promise<PredefinedNode[]> {
    return await this.predefinedNodeModel.find().exec();
  }

  async getPredefinedNodeById(id: string): Promise<PredefinedNode> {
    const node = await this.predefinedNodeModel.findOne({ id }).exec();
    if (!node) {
      throw new Error('Predefined node not found');
    }
    return node;
  }
}
