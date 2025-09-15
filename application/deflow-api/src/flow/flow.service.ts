import { Injectable } from '@nestjs/common';
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
  constructor() {}
  executeFlow(
    flowData: FlowData,
    triggerPayload: object,
    triggerNodeId: string,
  ): void {
    const currentNode = flowData.nodes.find(
      (node) => node.id === triggerNodeId,
    );

    let currentMessage: NodeMessage | null = null;
    const queue = [currentNode];
    while (queue.length > 0) {
      const currentNode = queue.shift();
      if (!currentNode) continue;

      const nodeInstance = NodeFactory.create(
        currentNode.name,
        currentNode.params,
      );
      if (nodeInstance instanceof TriggerNode) {
        currentMessage = nodeInstance.validatePayload(triggerPayload);
        console.log(
          `Trigger Node [${nodeInstance.name}] validated payload:`,
          currentMessage,
        );
        queue.push(...currentNode.successFlow);
      } else if (nodeInstance instanceof ActionNode) {
        try {
          currentMessage = nodeInstance.execute(currentMessage!);
          console.log(
            `Action Node [${nodeInstance.name}] executed successfully.`,
          );
          queue.push(...currentNode.successFlow);
        } catch (error) {
          console.error(
            `Action Node [${nodeInstance.name}] execution failed:`,
            error,
          );
          if (currentNode.errorFlow) queue.push(...currentNode.errorFlow);
        }
      } else if (nodeInstance instanceof LoggerNode) {
        if (currentMessage) {
          nodeInstance.execute(currentMessage);
        }
      }
    }
  }
}
