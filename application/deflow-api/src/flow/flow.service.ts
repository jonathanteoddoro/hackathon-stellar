import { Injectable, Logger } from '@nestjs/common';
import { ActionNode } from 'src/utils/ActionNode';
import { LoggerNode } from 'src/utils/LoggerNode';
import { Node } from 'src/models/Node';
import { NodeMessage } from 'src/utils/NodeMessage';
import { TriggerNode } from 'src/utils/TriggerNode';
import { NodeFactory } from 'src/utils/NodeFactory';

interface FlowData {
  flowId: string;
  name: string;
  description: string;
  nodes: Node[];
}

@Injectable()
export class FlowService {
  private readonly logger = new Logger(FlowService.name);

  constructor() {}
  async executeFlow(
    flowData: FlowData,
    triggerPayload: object,
    triggerNodeId: string,
  ): Promise<void> {
    const currentNode = flowData.nodes.find(
      (node) => node.id === triggerNodeId,
    );

    let currentMessage: NodeMessage | null = null;
    const queue = [currentNode];
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
