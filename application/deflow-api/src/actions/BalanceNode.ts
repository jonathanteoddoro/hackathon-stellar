import {
  Keypair,
  TransactionBuilder,
  Networks,
  Operation,
  BASE_FEE,
  Asset,
  Horizon,
} from '@stellar/stellar-sdk';
import { ActionNode } from '../utils/ActionNode';
import { NodeMessage } from '../utils/NodeMessage';

export interface TransactionParams {
  user_secret: string;
  destination: string;
  amount: string;
}

export class TransactionNode extends ActionNode {
  name = 'TransactionNode';
  description = 'Creates and sends a payment transaction on Stellar';

  private readonly params: TransactionParams;
  private readonly server: Horizon.Server;

  constructor(params: TransactionParams) {
    super();
    if (!params || !params.user_secret || !params.destination || !params.amount) {
      throw new Error('TransactionNode requires user_secret, destination and amount');
    }
    this.params = params;
    this.server = new Horizon.Server('https://horizon-testnet.stellar.org');
  }

  async execute(message: NodeMessage): Promise<NodeMessage> {
    try {
      const userKeypair = Keypair.fromSecret(this.params.user_secret);

      const account = await this.server.loadAccount(userKeypair.publicKey());

      const transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          Operation.payment({
            destination: this.params.destination,
            asset: Asset.native(), 
            amount: this.params.amount,
          })
        )
        .setTimeout(30)
        .build();

      transaction.sign(userKeypair);

      const result = await this.server.submitTransaction(transaction);

      console.log('Transaction successful:', result);

      return { ...message, payload: result };
    } catch (error) {
      console.error('Error creating/sending transaction:', error);
      throw error;
    }
  }
}
