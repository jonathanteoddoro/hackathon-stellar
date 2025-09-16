/**
 * 🎯 CRYPTO PRICE WATCHER - MONITORAMENTO DE LIMITE DE PREÇO
 * =========================================================
 * ✅ Monitora uma criptomoeda até atingir o limite definido
 * ✅ Polling fixo a cada 5 minutos no contrato Reflector
 * ✅ Para automaticamente quando o limite é ultrapassado
 * ✅ SDK Reflector integrado - SEM dependência externa
 */

import {
  Contract,
  Keypair,
  Account,
  rpc,
  TransactionBuilder,
  scValToNative,
  xdr,
} from '@stellar/stellar-sdk';
import 'dotenv/config';

// Configuração do contrato Reflector
const CONTRACT_ID = 'CCYOZJCOPG34LLQQ7N24YXBM7LL62R7ONMZ3G6WZAAYPB5OYKOMJRN63';
const RPC_URL = 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';

export interface PriceResult {
  price: number;
  rawPrice: string;
  timestamp: number;
  formattedPrice: string;
  age: string;
  method: string;
}

/**
 * 🚀 Cliente Reflector integrado
 */
class ReflectorClient {
  private contract: Contract;
  private server: rpc.Server;

  constructor() {
    this.contract = new Contract(CONTRACT_ID);
    this.server = new rpc.Server(RPC_URL, { allowHttp: false });
  }

  /**
   * 🎯 Buscar preço de uma criptomoeda
   */
  async getLastPrice(assetCode: string): Promise<PriceResult | null> {
    try {
      console.log(`🔍 ${assetCode}: Buscando preço...`);

      // Criar conta para simulação
      const defaultKeypair = Keypair.fromSecret('SCZANGBA5YHTNYVVV4C3U252E2B6P6F5T3U6MM63WBSBZATAQI3EBTQ4');
      const acc = await this.server.getAccount(defaultKeypair.publicKey());
      const account = new Account(acc.accountId(), acc.sequenceNumber());

      // Formato XDR correto que funciona
      const assetScVal = xdr.ScVal.scvVec([
        xdr.ScVal.scvSymbol('Other'),
        xdr.ScVal.scvSymbol(assetCode.toUpperCase())
      ]);

      const operation = this.contract.call('lastprice', assetScVal);
      const transaction = new TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: NETWORK_PASSPHRASE,
      }).addOperation(operation).setTimeout(30).build();

      const simulation = await this.server.simulateTransaction(transaction);

      if ('error' in simulation) {
        throw new Error(`Simulation error: ${simulation.error}`);
      }

      if (!simulation.result?.retval) {
        throw new Error('No return value from simulation');
      }

      const result = scValToNative(simulation.result.retval);

      if (!result.price || !result.timestamp) {
        throw new Error('Invalid price data format');
      }

      const rawPrice = result.price.toString();
      const price = Number(result.price) / Math.pow(10, 14); // 14 decimals
      const timestamp = Number(result.timestamp);
      const currentTime = Math.floor(Date.now() / 1000);
      const ageMinutes = Math.floor((currentTime - timestamp) / 60);

      console.log(`   ✅ ${assetCode}: ${price.toLocaleString('en-US', {style: 'currency', currency: 'USD'})} (dados de ${ageMinutes}m atrás)`);

      return {
        price,
        rawPrice,
        timestamp,
        formattedPrice: `$${price.toLocaleString()}`,
        age: `${ageMinutes} min atrás`,
        method: 'soroban-rpc'
      };

    } catch (error: any) {
      console.error(`   ❌ ${assetCode}: Erro - ${error.message}`);
      return null;
    }
  }
}

/**
 * 🏭 Factory para criar cliente Reflector
 */
function createReflectorClient(): ReflectorClient {
  return new ReflectorClient();
}

export class CryptoPriceWatcher {
  private assetCode: string;
  private limitPrice: number;
  private isRunning: boolean = false;
  private intervalId?: NodeJS.Timeout;
  private reflectorClient = createReflectorClient();
  private checkCount: number = 0;
  private startTime: number = Date.now();

  constructor(assetCode: string, limitPrice: number) {
    this.assetCode = assetCode.toUpperCase();
    this.limitPrice = limitPrice;
  }

  /**
   * 🚀 Iniciar monitoramento
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Monitoramento já está em execução');
      return;
    }

    console.log('🎯 CRYPTO PRICE WATCHER INICIADO');
    console.log('================================');
    console.log(`📊 Moeda: ${this.assetCode}`);
    console.log(`💰 Limite: $${this.limitPrice.toLocaleString()}`);
    console.log(`⏱️ Verificação: A cada 5 minutos (fixo)`);
    console.log(`🕐 Início: ${new Date().toLocaleString()}`);
    console.log('═'.repeat(50));

    this.isRunning = true;
    this.startTime = Date.now();

    // Primeira verificação imediata
    const shouldStop = await this.checkPrice();
    if (shouldStop) {
      this.stop();
      return;
    }

    // Configurar polling a cada 5 minutos (300000 ms)
    this.intervalId = setInterval(async () => {
      const shouldStop = await this.checkPrice();
      if (shouldStop) {
        this.stop();
      }
    }, 5 * 60 * 1000); // 5 minutos fixo

    // Handler para interrupção manual
    process.on('SIGINT', () => {
      console.log('\n🛑 Interrompido pelo usuário');
      this.stop();
      process.exit(0);
    });

    console.log('✅ Monitoramento ativo - pressione Ctrl+C para parar');
  }

  /**
   * 🔍 Verificar preço atual
   */
  private async checkPrice(): Promise<boolean> {
    try {
      this.checkCount++;
      const currentTime = new Date().toLocaleTimeString();
      
      console.log(`\n[${currentTime}] 🔍 Verificação #${this.checkCount}`);
      
      const priceResult: PriceResult | null = await this.reflectorClient.getLastPrice(this.assetCode);

      if (!priceResult) {
        console.log(`❌ Erro ao buscar preço de ${this.assetCode}`);
        return false;
      }

      const currentPrice = priceResult.price;
      const percentOfLimit = (currentPrice / this.limitPrice) * 100;
      
      console.log(`💰 ${this.assetCode}: $${currentPrice.toLocaleString()}`);
      console.log(`📊 Percentual do limite: ${percentOfLimit.toFixed(2)}%`);
      console.log(`📅 Idade dos dados: ${priceResult.age}`);

      // Verificar se o limite foi atingido
      if (currentPrice >= this.limitPrice) {
        console.log('\n🎉 LIMITE ATINGIDO!');
        console.log('═'.repeat(30));
        console.log(`🎯 ${this.assetCode} atingiu $${currentPrice.toLocaleString()}`);
        console.log(`💯 Isso representa ${percentOfLimit.toFixed(2)}% do limite definido`);
        console.log(`⏰ Tempo de monitoramento: ${this.getElapsedTime()}`);
        console.log(`📈 Total de verificações: ${this.checkCount}`);
        return true; // Para o monitoramento
      }

      console.log(`⏳ Aguardando próxima verificação em 5 minutos...`);
      return false; // Continua monitoramento

    } catch (error: any) {
      console.error(`❌ Erro na verificação: ${error.message}`);
      return false;
    }
  }

  /**
   * 🛑 Parar monitoramento
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    this.isRunning = false;
    
    console.log('\n🏁 MONITORAMENTO FINALIZADO');
    console.log('═'.repeat(30));
    console.log(`⏰ Tempo total: ${this.getElapsedTime()}`);
    console.log(`📊 Verificações realizadas: ${this.checkCount}`);
    console.log(`🕐 Finalizado em: ${new Date().toLocaleString()}`);
  }

  /**
   * ⏰ Calcular tempo decorrido
   */
  private getElapsedTime(): string {
    const elapsedMs = Date.now() - this.startTime;
    const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));
    const elapsedSeconds = Math.floor((elapsedMs % (1000 * 60)) / 1000);
    
    if (elapsedMinutes > 0) {
      return `${elapsedMinutes}m ${elapsedSeconds}s`;
    }
    return `${elapsedSeconds}s`;
  }

  /**
   * 📊 Status atual
   */
  getStatus(): {
    isRunning: boolean;
    assetCode: string;
    limitPrice: number;
    checkCount: number;
    elapsedTime: string;
  } {
    return {
      isRunning: this.isRunning,
      assetCode: this.assetCode,
      limitPrice: this.limitPrice,
      checkCount: this.checkCount,
      elapsedTime: this.getElapsedTime()
    };
  }
}

/**
 * 🏭 Factory para criar watcher
 */
export function createCryptoPriceWatcher(assetCode: string, limitPrice: number): CryptoPriceWatcher {
  return new CryptoPriceWatcher(assetCode, limitPrice);
}

/**
 * 🎯 Função utilitária para iniciar monitoramento
 */
export async function watchCryptoPrice(assetCode: string, limitPrice: number): Promise<void> {
  const watcher = createCryptoPriceWatcher(assetCode, limitPrice);
  await watcher.start();
}

// CLI para uso direto
if (require.main === module) {
  const [assetCode, limitPriceStr] = process.argv.slice(2);

  if (!assetCode || !limitPriceStr) {
    console.log(`
🎯 CRYPTO PRICE WATCHER - Como usar:
===================================

npm run crypto:watch <MOEDA> <LIMITE>

Parâmetros:
  MOEDA   - Código da criptomoeda (ex: BTC, ETH, XLM)
  LIMITE  - Valor limite em USD (ex: 120000, 5000, 0.5)

Exemplos:
  npm run crypto:watch BTC 120000     # Bitcoin até $120,000
  npm run crypto:watch ETH 5000       # Ethereum até $5,000
  npm run crypto:watch XLM 0.5        # Stellar até $0.50

⚙️ Funcionamento:
- Verifica preço a cada 5 minutos (fixo)
- Para automaticamente quando limite é atingido
- Usa contrato Reflector: CCYOZJCOPG34LLQQ7N24YXBM7LL62R7ONMZ3G6WZAAYPB5OYKOMJRN63
    `);
    process.exit(1);
  }

  const limitPrice = parseFloat(limitPriceStr);
  
  if (isNaN(limitPrice) || limitPrice <= 0) {
    console.error('❌ Limite deve ser um número positivo');
    process.exit(1);
  }

  // Iniciar monitoramento
  watchCryptoPrice(assetCode, limitPrice).catch(error => {
    console.error('❌ Erro no monitoramento:', error.message);
    process.exit(1);
  });
}

export default CryptoPriceWatcher;
