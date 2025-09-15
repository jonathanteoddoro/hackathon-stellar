import { LoggerNode } from 'src/utils/LoggerNode';
import { NodeMessage } from 'src/utils/NodeMessage';

export class TransactionLogger extends LoggerNode {
  name = 'Transaction Logger';
  description = 'Salva no log as informações da transação e valor em USD.';

  execute(message: NodeMessage) {
    console.log('Transaction Logger executed with message:', message);
    // Lógica para salvar o log da transação
  }
}
