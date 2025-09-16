import { TriggerNode } from 'src/utils/TriggerNode';
import { NodeMessage } from 'src/utils/NodeMessage';

export class HttpTrigger extends TriggerNode {
  name = 'HTTPTrigger';
  description = 'Trigger ativado via requisição HTTP';
  isJobTrigger = false;

  constructor(params: { [key: string]: string } = {}) {
    super();
    void params; // HTTP trigger does not use params for now
  }

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
