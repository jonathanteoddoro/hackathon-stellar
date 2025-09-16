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

const TOKEN_ADDRESSES: Record<string, string> = {
  XLM: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
  XTAR: 'CCSV3Y6QKAPRZCPLCMC5W7OCS5BFPKMYFK5GC25SSSS44U2WA4Y7QRKE',
  USDC: 'CDWEFYYHMGEZEFC5TBUDXM3IJJ7K7W5BDGE765UIYQEV4JFWDOLSTOEK',
  XRP: 'CBFM34O7P6YJG2DCS3C7AJI6WDKD2JPMPPA7RTVYGC7ZYEPKDLGEIFP5',
  ARST: 'CB3TIJR2B5NZFKZLBUE5LAASV7WIRDKS24VPIYUXXEHM7XN3X2JXFHZY',
  AQUA: 'CD56OXOMAZ55LIKCYVFXH5CP2AKCLYMPMBFRN5XIJVOTWOVY2KFGLZVJ',
  EURC: 'CAUL6I3KR55BAOSOE23VRR5FUFD2EEBWF3DHGWUZN7N3ZGVR4QQU6DQM',
  BTC: 'CBFX54THH4KKRDDOMV5G6TNGDPHXEUAXM7SGTOOXTZKODACI7O5ND6U7',
  BRL: 'CAG6QUTOUL3M4HPOPFYYDGJQODY7I3WUYKO2DFYDHIRHLD4HHPGIHWBJ',
  RYAW: 'CBIWPSUKAYOE5ORIDLYNPFMWWNIZSA5LQVDNXYTW7HI4H5TIU64DGJ7F',
  JAHV: 'CAZKRTMRBEMSMRCGC4C6YDUU22H5AVQZ5HAASR4PGWITXPDDBB3BTGHI',
  VOEZ: 'CDUCWV4VK6MXD3JMYFQUQ2KUHHGTMR7RAS6C2SPF7EHHUEGKFCRO3ZZF',
  JORV: 'CAT5EZTZVB4V4O7E5ZA2HQJTL7MZPWDJWQZIJYPMTAY6DMRWOIK5AMCD',
};

const NETWORK = SupportedNetworks.TESTNET;
const API_BASE_URL =
  process.env.SOROSWAP_API_URL || 'https://api.soroswap.finance';

async function rateLimitDelay(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 1000));
}

export interface SwapParams {
  user_secret: string;
  amount: string;
  fromToken?: string;
  toToken?: string;
}

export class SwapNode extends ActionNode {
  name = 'SwapNode';
  description = 'Executes a swap using Soroswap SDK';

  private readonly params: SwapParams;
  private readonly assetInAddress: string;
  private readonly assetOutAddress: string;

  constructor(params: SwapParams) {
    super();
    if (!params || !params.user_secret) {
      throw new Error('SwapNode requires a valid user_secret in constructor');
    }
    if (!params || !params.amount) {
      throw new Error('SwapNode requires a valid amount in constructor');
    }
    this.params = params;

    const fromCode = (params.fromToken || 'XLM').toUpperCase();
    const toCode = (params.toToken || 'USDC').toUpperCase();

    const inAddr = TOKEN_ADDRESSES[fromCode];
    const outAddr = TOKEN_ADDRESSES[toCode];

    if (!inAddr)
      throw new Error(`Unknown fromToken code in constructor: ${fromCode}`);
    if (!outAddr)
      throw new Error(`Unknown toToken code in constructor: ${toCode}`);

    this.assetInAddress = inAddr;
    this.assetOutAddress = outAddr;
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

    const sdk = new SoroswapSDK(sdkConfig);

    const quoteRequest: QuoteRequest = {
      assetIn: this.assetInAddress,
      assetOut: this.assetOutAddress,
      amount: BigInt(this.params.amount),
      tradeType: TradeType.EXACT_IN,
      protocols: [SupportedProtocols.SOROSWAP],
      slippageBps: 80,
    };

    try {
      const quote = await sdk.quote(quoteRequest);
      await rateLimitDelay();

      const buildedQuoteParams: BuildQuoteRequest = {
        quote: quote,
        from: userKeypair.publicKey(),
        to: userKeypair.publicKey(),
      };

      await rateLimitDelay();

      const buildedQuoteResponse = await sdk.build(
        buildedQuoteParams,
        SupportedNetworks.TESTNET,
      );
      const transaction: Transaction = new Transaction(
        buildedQuoteResponse.xdr,
        Networks.TESTNET,
      );
      transaction.sign(userKeypair);

      const signedTx = transaction.toXDR();
      await rateLimitDelay();

      const result = (await sdk.send(signedTx)) as object;
      console.log(result);

      return {
        metadata: message.metadata,
        payload: {
          ...message.payload,
          ...result,
        },
      };
    } catch (error) {
      console.error(error);
      return { ...message, payload: { error } };
    }
  }
}
