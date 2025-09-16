import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ActionNode } from 'src/utils/ActionNode';
import { LoggerNode } from 'src/utils/LoggerNode';
import { NodeMessage } from 'src/utils/NodeMessage';
import { TriggerNode } from 'src/utils/TriggerNode';
import { NodeFactory } from 'src/utils/NodeFactory';
import { NodeType } from 'src/utils/NodeType';
import { InjectModel } from '@nestjs/mongoose';
import { Flow } from 'src/models/Flow';
import { Model } from 'mongoose';
import { CreateFlowDto } from './dto/create-flow.dto';
import { v4 as uuidv4 } from 'uuid';
import { FlowNode } from 'src/models/FlowNode';
import { CreateFlowNodeDto } from './dto/create-flowNode.dto';
import { LinkNodesDto } from './dto/link-nodes.dto';
import { PredefinedNodesService } from 'src/predefined-nodes/predefined-nodes.service';
import { SchedulerRegistry } from '@nestjs/schedule';
import { UpdateNodeDto } from './dto/update-position.dto';

@Injectable()
export class FlowService {
  private readonly logger = new Logger(FlowService.name);

  constructor(
    @InjectModel(Flow.name) private flowModel: Model<Flow>,
    @InjectModel(FlowNode.name) private flowNodeModel: Model<FlowNode>,
    private readonly predefinedNodesService: PredefinedNodesService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  async createFlow(createFlowDto: CreateFlowDto): Promise<Flow> {
    const createdFlow = new this.flowModel({
      id: uuidv4(),
      name: createFlowDto.name,
      description: createFlowDto.description,
    });
    return createdFlow.save();
  }

  async addNodeToFlow(
    createFlowNodeDto: CreateFlowNodeDto,
    flowId: string,
  ): Promise<FlowNode> {
    const predefinedNode =
      await this.predefinedNodesService.getPredefinedNodeById(
        createFlowNodeDto.predefinedNodeId,
      );

    if (!predefinedNode) {
      throw new Error('Predefined node not found');
    }

    const createdFlowNode = new this.flowNodeModel({
      id: uuidv4(),
      flowId,
      name: createFlowNodeDto.name,
      description: createFlowNodeDto.description,
      type: createFlowNodeDto.type,
      x: createFlowNodeDto.x,
      y: createFlowNodeDto.y,
    });
    return createdFlowNode.save();
  }

  async linkNodes(linkNodesDto: LinkNodesDto): Promise<void> {
    const fromNode = await this.flowNodeModel.findOne({
      id: linkNodesDto.fromNodeId,
    });
    const toNode = await this.flowNodeModel.findOne({
      id: linkNodesDto.toNodeId,
    });

    if (!fromNode || !toNode) {
      throw new Error('One or both nodes not found');
    }

    if (fromNode.get('type') === NodeType.Action) {
      if (linkNodesDto.isForErrorFlow) {
        fromNode.errorFlow = fromNode.errorFlow || [];
        fromNode.errorFlow.push(toNode._id as unknown as FlowNode);
      } else {
        fromNode.successFlow.push(toNode._id as unknown as FlowNode);
      }
      await fromNode.save();
      return;
    }

    fromNode.successFlow.push(toNode._id as unknown as FlowNode);
    await fromNode.save();
  }

  async unlinkNodes(linkNodesDto: LinkNodesDto): Promise<void> {
    const fromNode = await this.flowNodeModel.findOne({
      id: linkNodesDto.fromNodeId,
    });
    const toNode = await this.flowNodeModel.findOne({
      id: linkNodesDto.toNodeId,
    });

    if (!fromNode || !toNode) {
      throw new Error('One or both nodes not found');
    }
    if (fromNode.get('type') === NodeType.Action) {
      if (linkNodesDto.isForErrorFlow && fromNode.errorFlow) {
        fromNode.errorFlow = fromNode.errorFlow.filter(
          (node) => node.id !== toNode.id,
        );
      } else if (fromNode.successFlow) {
        fromNode.successFlow = fromNode.successFlow.filter(
          (node) => node.id !== toNode.id,
        );
      }
      await fromNode.save();
      return;
    }
  }

  async executeFlow(
    triggerPayload: object,
    triggerNodeId: string,
    flowId: string,
  ): Promise<void> {
    const currentNode = await this.flowNodeModel
      .findOne({ id: triggerNodeId })
      .populate('successFlow')
      .populate('errorFlow')
      .exec();
    if (!currentNode) {
      throw new Error('Trigger node not found');
    }
    if (currentNode.type !== NodeType.Trigger) {
      throw new Error('Node is not a trigger node');
    }
    if (!currentNode.successFlow || currentNode.successFlow.length === 0) {
      throw new Error('Trigger node has no success flow defined');
    }
    if (currentNode.flowId !== flowId) {
      throw new Error('Trigger node does not belong to the specified flow');
    }
    let currentMessage: NodeMessage | null = null;
    const queue: FlowNode[] = [currentNode];
    while (queue.length > 0) {
      const currentNode = queue.shift();
      if (!currentNode) continue;

      const params = currentNode.params || {};
      // substituindo variaveis no formato {{varName}} pelos valores do payload
      for (const [key, value] of Object.entries(params)) {
        params[key] = this.extractVariables(
          value,
          currentMessage ? currentMessage.payload || {} : {},
        );
      }
      if (currentNode.variables) {
        // procurando por variaveis no formato {{varName}} e substituindo pelos valores do payload
        for (const [key, value] of Object.entries(currentNode.variables)) {
          const finalValue = this.extractVariables(
            value,
            currentMessage ? currentMessage.payload || {} : {},
          );
          if (!currentMessage) {
            currentMessage = new NodeMessage();
          }
          if (!currentMessage.payload) {
            currentMessage.payload = {};
          }
          if (!currentMessage.payload.variables) {
            currentMessage.payload.variables = {};
          }
          currentMessage.payload.variables[key] = finalValue;
        }
      }
      const nodeInstance = NodeFactory.create(currentNode.name, params);
      if (nodeInstance instanceof TriggerNode) {
        currentMessage = nodeInstance.validatePayload(triggerPayload);
        queue.push(...currentNode.successFlow);
      } else if (nodeInstance instanceof ActionNode) {
        try {
          currentMessage = await nodeInstance.execute(currentMessage!);
          this.logger.log(
            `Action Node [${nodeInstance.name}] executed successfully.`,
          );

          queue.push(...currentNode.successFlow);
        } catch (error) {
          this.logger.error(
            `Action Node [${nodeInstance.name}] execution failed, processing error flow.`,
            (error as Error)?.stack,
          );
          currentMessage = {
            metadata: {
              ...(currentMessage ? currentMessage.metadata : {}),
            },
            payload: {
              ...(currentMessage ? currentMessage.payload : {}),
              [`${nodeInstance.name}Error`]:
                (error as Error)?.message || 'Unknown error',
            },
          };
          if (currentNode.errorFlow) queue.push(...currentNode.errorFlow);
        }
      } else if (nodeInstance instanceof LoggerNode) {
        if (currentMessage) {
          nodeInstance.execute(currentMessage);
        }
      }
    }
  }

  async deployFlow(flowId: string): Promise<void> {
    const triggersNodes = await this.flowNodeModel
      .find({ flowId, type: NodeType.Trigger })
      .exec();

    if (triggersNodes.length === 0) {
      throw new Error('No trigger nodes found in the flow');
    }
    for (const triggerNode of triggersNodes) {
      const nodeInstance = NodeFactory.create(
        triggerNode.name,
        triggerNode.params,
      );
      if (!(nodeInstance instanceof TriggerNode)) {
        throw new Error(`Node ${triggerNode.name} is not a trigger node`);
      }
      if (nodeInstance.isJobTrigger) {
        try {
          if (nodeInstance.execute) {
            const { jobName, job } = nodeInstance.execute(
              this.executeFlow.bind(this),
              triggerNode.get('id'),
            );
            if (this.schedulerRegistry.doesExist('cron', jobName)) {
              this.logger.log(
                `Job trigger ${triggerNode.name} already exists, updating...`,
              );
              this.schedulerRegistry.deleteCronJob(jobName);
              job.start();
            }
            this.schedulerRegistry.addCronJob(jobName, job as unknown as never);
            job.start();
            this.logger.log(
              `Job trigger ${triggerNode.name} started with job name ${jobName}`,
            );
          } else {
            throw new InternalServerErrorException(
              `Trigger node ${triggerNode.name} does not have an execute method`,
            );
          }
        } catch (error) {
          this.logger.error(
            `Failed to start job trigger ${triggerNode.name}:`,
            (error as Error)?.stack,
          );
          throw error;
        }
      }
    }
  }

  async deleteNodeFromFlow(nodeId: string, flowId: string): Promise<void> {
    const node = await this.flowNodeModel.findOne({ id: nodeId, flowId });
    if (!node) {
      throw new Error('Node not found in the specified flow');
    }

    // Remove references from other nodes' successFlow and errorFlow
    await this.flowNodeModel.updateMany(
      { flowId },
      {
        $pull: {
          successFlow: node._id,
          errorFlow: node._id,
        },
      },
    );

    await this.flowNodeModel.deleteOne({ id: nodeId, flowId });
  }

  async updateNode(
    nodeId: string,
    flowId: string,
    updateNode: UpdateNodeDto,
  ): Promise<FlowNode> {
    const node = await this.flowNodeModel.findOne({ id: nodeId, flowId });
    if (!node) {
      throw new NotFoundException('Node not found in the specified flow');
    }
    if (updateNode.params !== undefined) {
      const predefinedNode =
        await this.predefinedNodesService.getPredefinedNodeById(
          updateNode.predefinedNodeId || '',
        );
      if (!predefinedNode) {
        throw new NotFoundException('Predefined node not found');
      }
      const paramsRequired = predefinedNode.requiredParamsPayloadKeysTypes;
      const params = JSON.parse(updateNode.params) as Record<string, any>;
      for (const key of Object.keys(paramsRequired)) {
        if (!(key in params)) {
          throw new Error(`Missing required param: ${key}`);
        }
        const expectedType = paramsRequired[key];
        if (typeof params[key] !== expectedType) {
          throw new Error(
            `Invalid type for param ${key}: expected ${expectedType}, got ${typeof params[
              key
            ]}`,
          );
        }
      }
      node.params = params;
    }
    if (updateNode.variables !== undefined) {
      node.variables = JSON.parse(updateNode.variables) as Record<
        string,
        string
      >;
    }
    if (updateNode.x !== undefined) {
      node.x = updateNode.x;
    }

    if (updateNode.y !== undefined) {
      node.y = updateNode.y;
    }

    return await node.save();
  }
  async undeployFlow(flowId: string): Promise<void> {
    const triggersNodes = await this.flowNodeModel
      .find({ flowId, type: NodeType.Trigger })
      .exec();

    if (triggersNodes.length === 0) {
      throw new Error('No trigger nodes found in the flow');
    }
    for (const triggerNode of triggersNodes) {
      const nodeInstance = NodeFactory.create(
        triggerNode.name,
        triggerNode.params,
      );
      if (!(nodeInstance instanceof TriggerNode)) {
        throw new Error(`Node ${triggerNode.name} is not a trigger node`);
      }
      if (nodeInstance.isJobTrigger) {
        try {
          const jobName = `cron-job-${triggerNode.get('id')}`;
          if (this.schedulerRegistry.doesExist('cron', jobName)) {
            this.schedulerRegistry.deleteCronJob(jobName);
            this.logger.log(`Job trigger ${triggerNode.name} stopped`);
          } else {
            this.logger.warn(
              `Job trigger ${triggerNode.name} does not exist in scheduler`,
            );
          }
        } catch (error) {
          this.logger.error(
            `Failed to stop job trigger ${triggerNode.name}:`,
            (error as Error)?.stack,
          );
          throw error;
        }
      }
    }
  }

  private extractVariables(value: string, payload: object): string {
    const varMatches = value.matchAll(/{{(.*?)}}/g);
    let finalValue = value;

    for (const match of varMatches) {
      if (match[1]) {
        const accessorKeys = match[1].split('.');
        let varValue: any = payload;
        for (const key of accessorKeys) {
          if (
            varValue &&
            typeof varValue === 'object' &&
            varValue !== null &&
            key in varValue
          ) {
            varValue = (varValue as Record<string, unknown>)[key];
          } else {
            varValue = undefined;
            break;
          }
        }
        if (varValue !== undefined) {
          finalValue = finalValue.replace(match[0], varValue);
        }
      }
    }
    return finalValue;
  }
}
