import { FetchTokenPrice } from '../actions/FetchTokenPrice';
import { TransactionLogger } from '../loggers/TransactionLogger';
import { EthereumTransferTrigger } from '../triggers/EthereumTransferTrigger';
import { NodeFactory } from './NodeFactory';
import { NodeType } from './NodeType';

NodeFactory.register(
  'Ethereum Transfer Trigger',
  EthereumTransferTrigger,
  NodeType.Trigger,
);
NodeFactory.register('Fetch Token Price', FetchTokenPrice, NodeType.Action);
NodeFactory.register('Transaction Logger', TransactionLogger, NodeType.Logger);

export { NodeFactory };
