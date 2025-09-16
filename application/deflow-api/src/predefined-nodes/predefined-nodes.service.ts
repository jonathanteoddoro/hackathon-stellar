import { Injectable, NotFoundException } from '@nestjs/common';
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
    console.log(`Fetching predefined node with id: ${id}`);
    const node = await this.predefinedNodeModel.findOne({ id }).exec();
    console.log('Fetched predefined node:', node);
    if (!node) {
      throw new NotFoundException('Predefined node not found');
    }
    return node;
  }

  async deletePredefinedNode(id: string): Promise<{ deleted: boolean }> {
    const result = await this.predefinedNodeModel.deleteOne({ id }).exec();
    return { deleted: result.deletedCount === 1 };
  }
}
