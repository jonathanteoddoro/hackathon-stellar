import { Injectable } from '@nestjs/common';
import { ActionNode } from 'src/utils/ActionNode';
import { LoggerNode } from 'src/utils/LoggerNode';
import { Node } from 'src/models/Node';
import { NodeMessage } from 'src/utils/NodeMessage';
import { TriggerNode } from 'src/utils/TriggerNode';
import { NodeFactory } from 'src/utils/NodeRegistry';

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
      queue.push(
        ...currentNode.outputs.filter(
          (node): node is Node => node !== undefined,
        ),
      );
      const nodeInstance = NodeFactory.create(currentNode.name);
      if (nodeInstance instanceof TriggerNode) {
        currentMessage = nodeInstance.validatePayload(triggerPayload);
        console.log(
          `Trigger Node [${nodeInstance.name}] validated payload:`,
          currentMessage,
        );
      } else if (nodeInstance instanceof ActionNode) {
        try {
          nodeInstance.whenResolved();
          console.log(
            `Action Node [${nodeInstance.name}] executed successfully.`,
          );
        } catch (error) {
          nodeInstance.whenRejected();
          console.error(
            `Action Node [${nodeInstance.name}] execution failed:`,
            error,
          );
        }
      } else if (nodeInstance instanceof LoggerNode) {
        if (currentMessage) {
          nodeInstance.execute(currentMessage);
        }
      }
    }
  }
}
