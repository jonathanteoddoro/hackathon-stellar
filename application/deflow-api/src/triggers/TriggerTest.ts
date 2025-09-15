import { NodeMessage } from 'src/utils/NodeMessage';
import { TriggerNode } from 'src/utils/TriggerNode';

export class TriggerTest extends TriggerNode {
  name = 'TriggerTest';
  description = 'description';
  validatePayload(payload: object): NodeMessage {
    return {
      payload,
      metadata: {
        teste: 'gabriel',
      },
    };
  }
}
