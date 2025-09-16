import {
  Contract,
  Keypair,
  Account,
  rpc,
  TransactionBuilder,
  scValToNative,
  xdr,
} from '@stellar/stellar-sdk';
import { TriggerNode } from '../utils/TriggerNode';
import { NodeMessage } from '../utils/NodeMessage';
import { CronJob } from 'cron';
import 'dotenv/config';

// Configuração do contrato Reflector
const CONTRACT_ID = 'CCYOZJCOPG34LLQQ7N24YXBM7LL62R7ONMZ3G6WZAAYPB5OYKOMJRN63';
const RPC_URL = 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';

interface PriceResult {
  price: number;
  timestamp: number;
}

/**
 * 🚀 Cliente Reflector integrado
 */
class ReflectorClient {
  private contract: Contract;
  private server: rpc.Server;
  private sourceSecret: string;

  constructor(sourceSecret?: string) {
    this.contract = new Contract(CONTRACT_ID);
    this.server = new rpc.Server(RPC_URL, { allowHttp: false });
    this.sourceSecret =
      sourceSecret ||
      'SCZANGBA5YHTNYVVV4C3U252E2B6P6F5T3U6MM63WBSBZATAQI3EBTQ4';
  }

  async getLastPrice(assetCode: string): Promise<PriceResult | null> {
    try {
      const defaultKeypair = Keypair.fromSecret(this.sourceSecret);
      const acc = await this.server.getAccount(defaultKeypair.publicKey());
      const account = new Account(acc.accountId(), acc.sequenceNumber());

      const assetScVal = xdr.ScVal.scvVec([
        xdr.ScVal.scvSymbol('Other'),
        xdr.ScVal.scvSymbol(assetCode.toUpperCase()),
      ]);

      const operation = this.contract.call('lastprice', assetScVal);
      const transaction = new TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      const simulation = await this.server.simulateTransaction(transaction);

      if ('error' in simulation) {
        throw new Error(`Simulation error: ${simulation.error}`);
      }

      if (!simulation.result?.retval) {
        throw new Error('No return value from simulation');
      }

      const result = scValToNative(simulation.result.retval) as unknown as {
        price: string;
        timestamp: string;
      };

      if (!result.price || !result.timestamp) {
        throw new Error('Invalid price data format');
      }

      const price = Number(result.price) / Math.pow(10, 14);
      const timestamp = Number(result.timestamp);

      return {
        price,
        timestamp,
      };
    } catch (error: unknown) {
      void error;
      console.error('Error fetching price from Reflector:', error);
      return null;
    }
  }
}

export class CryptoPriceTrigger extends TriggerNode {
  name = 'CryptoPriceTrigger';
  description = 'Trigger que dispara quando preço de criptomoeda atinge limite';
  private params: {
    asset: string;
    limitPrice: string;
    sourceSecret?: string;
    condition: string;
  };
  isJobTrigger = true;

  private reflectorClient: ReflectorClient;

  constructor(params: { [key: string]: string } = {}) {
    super();

    if (!params.asset || !params.limitPrice || !params.condition) {
      throw new Error(
        'Parameters "asset", "limitPrice" and "condition" are required for CryptoPriceTrigger',
      );
    }

    const limitPrice = parseFloat(params.limitPrice);
    if (isNaN(limitPrice) || limitPrice <= 0) {
      throw new Error('Parameter "limitPrice" must be a positive number');
    }

    this.params = {
      asset: params.asset.toUpperCase(),
      limitPrice: params.limitPrice,
      sourceSecret: params.sourceSecret, // Parâmetro opcional
      condition: params.condition, // 'above' ou 'below'
    };

    this.reflectorClient = new ReflectorClient(this.params.sourceSecret);
  }

  validatePayload(payload: object): NodeMessage {
    return {
      payload: {
        ...payload,
        conditionMet: true,
        asset: this.params.asset,
        limitPrice: parseFloat(this.params.limitPrice),
        triggeredAt: new Date().toISOString(),
      },
      metadata: {
        triggerId: 'crypto-price-trigger',
        triggerType: 'price-condition',
        timestamp: new Date().toISOString(),
      },
    };
  }

  execute(
    callback: (...args: any[]) => void,
    nodeId: string,
    flowId: string,
  ): { jobName: string; job: CronJob } {
    const jobName = `crypto-price-${nodeId}`;
    const limitPrice = parseFloat(this.params.limitPrice);

    const job = new CronJob(
      '*/30 * * * * *', // A cada 30 segundos
      async () => {
        try {
          const priceResult = await this.reflectorClient.getLastPrice(
            this.params.asset,
          );
          if (
            this.params.condition === 'gt' &&
            priceResult &&
            priceResult.price <= limitPrice
          ) {
            // Condição atendida - disparar callback
            const message = this.validatePayload({
              currentPrice: priceResult.price,
              percentOfLimit: (priceResult.price / limitPrice) * 100,
              priceTimestamp: priceResult.timestamp,
            });
            callback(message, nodeId, flowId);
          } else if (
            this.params.condition === 'lt' &&
            priceResult &&
            priceResult.price >= limitPrice
          ) {
            // Condição atendida - disparar callback
            const message = this.validatePayload({
              currentPrice: priceResult.price,
              percentOfLimit: (priceResult.price / limitPrice) * 100,
              priceTimestamp: priceResult.timestamp,
            });
            callback(message, nodeId);
          }
        } catch (error) {
          void error;
          // Continua tentando em caso de erro
        }
      },
      null,
      true,
      'UTC',
    );

    return { jobName, job };
  }
}
