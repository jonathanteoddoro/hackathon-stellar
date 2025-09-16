import { Injectable } from '@nestjs/common';
import { TriggerNode } from 'src/utils/TriggerNode';
import { NodeMessage } from 'src/utils/NodeMessage';

@Injectable()
export class HttpTrigger extends TriggerNode {
  name = 'HTTP Trigger';
  description = 'Trigger ativado via requisição HTTP';

  validatePayload(payload: object): NodeMessage {
    return {
      payload: payload || {},
      metadata: {
        triggerId: 'http-trigger',
        triggerType: 'http',
        timestamp: new Date().toISOString(),
      },
    };
  }

  async execute(): Promise<NodeMessage> {
    return this.validatePayload({});
  }
}
