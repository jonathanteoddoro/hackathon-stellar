import {
  SupportedNetworks,
  type SoroswapSDKConfig,
  SoroswapSDK,
  type QuoteRequest,
  TradeType,
  SupportedProtocols,
  type BuildQuoteRequest,
} from '@soroswap/sdk';
import { Keypair, Networks, Transaction } from '@stellar/stellar-sdk';
import { ActionNode } from '../utils/ActionNode';
import { NodeMessage } from '../utils/NodeMessage';

const NETWORK = SupportedNetworks.TESTNET;
const API_BASE_URL = process.env.SOROSWAP_API_URL || 'https://api.soroswap.finance';

async function rateLimitDelay(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 1000));
}

export interface SwapParams {
  user_secret: string;
}

export class SwapNode extends ActionNode {
  name = 'SwapNode';
  description = 'Executes a swap using Soroswap SDK';

  private readonly params: SwapParams;

  constructor(params: SwapParams) {
    super();
    if (!params || !params.user_secret) {
      throw new Error('SwapNode requires a valid user_secret in constructor');
    }
    this.params = params;
  }

  async execute(message: NodeMessage): Promise<NodeMessage> {
    const api_key = process.env.SOROSWAP_API_KEY;
    if (!api_key) throw new Error('no api key found on process.env');

    const sdkConfig: SoroswapSDKConfig = {
      apiKey: api_key,
      defaultNetwork: NETWORK,
      baseUrl: API_BASE_URL,
      timeout: 30000,
    };

    const userKeypair = Keypair.fromSecret(this.params.user_secret);

    const EXAMPLE_ADDRESSES = {
      USER: userKeypair.publicKey(),
      XLM_ASSET: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
      USDC_ASSET: 'CDWEFYYHMGEZEFC5TBUDXM3IJJ7K7W5BDGE765UIYQEV4JFWDOLSTOEK',
    };

    const sdk = new SoroswapSDK(sdkConfig);

    const quoteRequest: QuoteRequest = {
      assetIn: EXAMPLE_ADDRESSES.XLM_ASSET,
      assetOut: EXAMPLE_ADDRESSES.USDC_ASSET,
      amount: BigInt(10000000),
      tradeType: TradeType.EXACT_IN,
      protocols: [SupportedProtocols.SOROSWAP],
      slippageBps: 80,
    };

    try {
      const quote = await sdk.quote(quoteRequest);
      await rateLimitDelay();

      const buildedQuoteParams: BuildQuoteRequest = {
        quote: quote,
        from: EXAMPLE_ADDRESSES.USER,
        to: EXAMPLE_ADDRESSES.USER,
      };

      await rateLimitDelay();

      const buildedQuoteResponse = await sdk.build(buildedQuoteParams, SupportedNetworks.TESTNET);
      const transaction: Transaction = new Transaction(buildedQuoteResponse.xdr, Networks.TESTNET);
      transaction.sign(userKeypair);

      const signedTx = transaction.toXDR();
      await rateLimitDelay();

      const result = await sdk.send(signedTx);
      console.log(result);

      return { ...message, payload: result };
    } catch (error) {
      console.error(error);
      return { ...message, payload: { error: error instanceof Error ? error.message : String(error) } };
    }
  }
}
