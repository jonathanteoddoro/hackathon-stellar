import { TriggerNode } from 'src/utils/TriggerNode';
import { NodeMessage } from 'src/utils/NodeMessage';

export class EthereumTransferTrigger extends TriggerNode {
  name = 'Ethereum Transfer Trigger';
  description =
    'Dispara quando ocorre uma transferência no contrato ERC20 configurado.';

  validatePayload(payload: object): NodeMessage {
    console.log('Validating payload for Ethereum Transfer Trigger:', payload);
    if (
      'from' in payload &&
      'to' in payload &&
      'value' in payload &&
      'txHash' in payload
    ) {
      const message = new NodeMessage();
      message.payload = payload;
      return message;
    }
    throw new Error('Invalid payload for Ethereum Transfer Trigger');
  }
}
